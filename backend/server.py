# Email Automation Backend (Flask)

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
email_templates = {}

# Store uploaded files
data_folder = 'data'
os.makedirs(data_folder, exist_ok=True)

@app.route('/')
def index():
    return "Email Automation Backend Running!"

@app.route('/upload-contacts', methods=['POST'])
def upload_contacts():
    file = request.files['file']
    file_path = os.path.join(data_folder, 'contacts.csv')
    file.save(file_path)
    return jsonify({"message": "Contacts uploaded successfully!"})

@app.route('/upload-attachment', methods=['POST'])
def upload_attachment():
    file = request.files['file']
    file_path = os.path.join(data_folder, file.filename)
    file.save(file_path)
    return jsonify({"message": "Attachment uploaded successfully!"})

@app.route('/send-emails', methods=['POST'])
def send_emails():
    data = request.json
    smtp_host = data['smtp_host']
    port = data['port']
    username = data['username']
    password = data['password']
    subject = data['subject']
    delay = int(data['pause_between_messages'])
    retries = int(data['retries'])
    max_connections = int(data['max_connections'])
    
    with open(os.path.join(data_folder, 'contacts.csv'), mode='r', encoding='utf-8') as file:
        contacts = list(csv.reader(file))

    for contact in contacts:
        contact_queue.put(contact)

    def worker():
        while not contact_queue.empty():
            contact = contact_queue.get()
            email = contact[0]
            name = contact[1] if len(contact) > 1 else ""
            language = contact[2] if len(contact) > 2 else "EN"
            
            email_body = email_templates.get(language, email_templates['EN']).replace("[NAME]", name)
            
            for attempt in range(retries + 1):
                try:
                    msg = MIMEMultipart()
                    msg['From'] = username
                    msg['To'] = email
                    msg['Subject'] = subject
                    msg.attach(MIMEText(email_body, 'plain'))
                    
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
            
            contact_queue.task_done()
            time.sleep(delay)
    
    threads = []
    for _ in range(max_connections):
        thread = threading.Thread(target=worker)
        thread.start()
        threads.append(thread)
    
    for thread in threads:
        thread.join()
    
    return jsonify({"message": "Email campaign started!"})

if __name__ == '__main__':
    app.run(debug=True)
