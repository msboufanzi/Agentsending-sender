from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib
import os
import csv
import time
import threading
import queue
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app)

# Load environment variables
load_dotenv()

# Global Variables
contact_queue = queue.Queue()
send_lock = threading.Lock()
email_templates = {
    'EN': 'Default English template. Hello [NAME]',  # Default template
    'ES': 'Default Spanish template. Hola [NAME]',
    'FR': 'Default French template. Bonjour [NAME]'
}
campaign_status = {
    'is_running': False,
    'remaining': 0,
    'total': 0,
    'errors': []
}

# Store uploaded files
data_folder = 'data'
os.makedirs(data_folder, exist_ok=True)

@app.route('/')
def index():
    return "Email Automation Backend Running!"

@app.route('/upload-contacts', methods=['POST'])
def upload_contacts():
    try:
        file = request.files['file']
        file_path = os.path.join(data_folder, 'contacts.csv')
        file.save(file_path)
        
        # Count total contacts
        with open(file_path, 'r') as f:
            total = sum(1 for line in f) - 1  # Subtract 1 for header
            campaign_status['total'] = total
            
        return jsonify({"message": "Contacts uploaded successfully!", "total": total})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/upload-attachment', methods=['POST'])
def upload_attachment():
    try:
        file = request.files['file']
        file_path = os.path.join(data_folder, file.filename)
        file.save(file_path)
        return jsonify({"message": "Attachment uploaded successfully!"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/save-templates', methods=['POST'])
def save_templates():
    global email_templates
    try:
        templates = request.json
        if not templates or 'EN' not in templates:
            return jsonify({"error": "English (EN) template is required"}), 400
        email_templates = templates
        return jsonify({"message": "Email templates saved successfully!"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/campaign-status', methods=['GET'])
def get_campaign_status():
    return jsonify({
        "isRunning": campaign_status['is_running'],
        "remaining": campaign_status['remaining'],
        "total": campaign_status['total'],
        "errors": campaign_status['errors'][-5:],  # Return last 5 errors
        "status": "running" if campaign_status['is_running'] else "completed"
    })

@app.route('/send-emails', methods=['POST'])
def send_emails():
    global campaign_status
    
    try:
        data = request.json
        smtp_host = data['smtp_host']
        port = data['port']
        username = data['username']
        password = data['password']
        subject = data['subject']
        delay = int(data['pause_between_messages'])
        retries = int(data['retries'])
        max_connections = int(data['max_connections'])

        # Reset campaign status
        campaign_status['errors'] = []
        campaign_status['is_running'] = True
        
        # Check if templates exist
        if not email_templates or 'EN' not in email_templates:
            return jsonify({"error": "Please save email templates first"}), 400

        # Load contacts
        contacts_path = os.path.join(data_folder, 'contacts.csv')
        if not os.path.exists(contacts_path):
            return jsonify({"error": "No contacts file found"}), 400

        with open(contacts_path, mode='r', encoding='utf-8') as file:
            contacts = list(csv.reader(file))
            if len(contacts) <= 1:  # Only header or empty
                return jsonify({"error": "No contacts found in file"}), 400
            contacts = contacts[1:]  # Skip header

        campaign_status['remaining'] = len(contacts)
        campaign_status['total'] = len(contacts)

        # Clear and fill queue
        while not contact_queue.empty():
            contact_queue.get()
        
        for contact in contacts:
            contact_queue.put(contact)

        def worker():
            while not contact_queue.empty():
                try:
                    contact = contact_queue.get()
                    email = contact[0]
                    name = contact[1] if len(contact) > 1 else "Valued Customer"
                    language = contact[2] if len(contact) > 2 else "EN"
                    
                    # Get template with fallback to EN
                    template = email_templates.get(language, email_templates.get('EN', ''))
                    if not template:
                        raise ValueError(f"No template found for language {language}")
                        
                    email_body = template.replace("[NAME]", name)
                    
                    for attempt in range(retries + 1):
                        try:
                            msg = MIMEMultipart()
                            msg['From'] = username
                            msg['To'] = email
                            msg['Subject'] = subject
                            msg.attach(MIMEText(email_body, 'plain'))
                            
                            # Add attachments if any
                            for filename in os.listdir(data_folder):
                                if filename != 'contacts.csv':
                                    attachment_path = os.path.join(data_folder, filename)
                                    with open(attachment_path, 'rb') as attachment:
                                        part = MIMEBase('application', 'octet-stream')
                                        part.set_payload(attachment.read())
                                        encoders.encode_base64(part)
                                        part.add_header('Content-Disposition', f'attachment; filename={filename}')
                                        msg.attach(part)
                            
                            server = smtplib.SMTP(smtp_host, port)
                            server.starttls()
                            server.login(username, password)
                            server.send_message(msg)
                            server.quit()
                            
                            print(f'Email sent to {email}')
                            break
                        except Exception as e:
                            print(f'Error sending to {email}: {e}')
                            if attempt < retries:
                                time.sleep(2)
                            else:
                                campaign_status['errors'].append(f"Failed to send to {email}: {str(e)}")
                    
                    with send_lock:
                        campaign_status['remaining'] -= 1
                        
                    contact_queue.task_done()
                    time.sleep(delay)
                except Exception as e:
                    print(f"Worker error: {e}")
                    campaign_status['errors'].append(str(e))
                    continue

        # Start worker threads
        threads = []
        for _ in range(max_connections):
            thread = threading.Thread(target=worker)
            thread.daemon = True  # Make thread daemon so it exits when main thread exits
            thread.start()
            threads.append(thread)

        return jsonify({"message": "Email campaign started!"})
    except Exception as e:
        campaign_status['is_running'] = False
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)