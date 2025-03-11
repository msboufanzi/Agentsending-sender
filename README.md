# Agent Sending Project

## Overview

This project consists of a frontend and a backend that work together to provide a complete solution for agent sending. The backend is built with Flask and handles authentication, API requests, and other server-side logic. The frontend is built with a web framework and interacts with the backend to provide a user interface.

## Functionality

- **User Authentication**: Users can authenticate using Google OAuth.
- **API Integration**: The backend integrates with Google APIs to perform various tasks.
- **JWT Tokens**: JSON Web Tokens (JWT) are used for secure communication between the frontend and backend.
- **CORS**: Cross-Origin Resource Sharing (CORS) is enabled to allow the frontend to communicate with the backend.

## Prerequisites

- Python 3.x
- Node.js (for frontend)
- pip (Python package installer)
- npm (Node package manager)

## Backend Setup

1. **Clone the repository**:
    ```sh
    git clone <repository-url>
    cd Agentsending-sender-backup
    ```

2. **Create and activate a virtual environment**:
    ```sh
    python3 -m venv venv
    source venv/bin/activate
    ```

3. **Install backend dependencies**:
    ```sh
    pip install Flask
    pip install Flask-Cors
    pip install python-dotenv
    pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
    pip install pyjwt
    ```

4. **Set up environment variables**:
    Create a `.env` file in the backend directory and add the necessary environment variables.
    SECRET_KEY=
    CLIENT_ID= 
    CLIENT_SECRET=


5. **Run the backend server**:
    ```sh
    flask run
    ```

## Frontend Setup

1. **Navigate to the frontend directory**:
    ```sh
    cd frontend
    ```

2. **Install frontend dependencies**:
    ```sh
    npm install
    ```

3. **Run the frontend server**:
    ```sh
    npm start
    ```

## Running the Project

1. **Start the backend server**:
    ```sh
    source venv/bin/activate
    flask run
    ```

2. **Start the frontend server**:
    ```sh
    cd frontend
    npm start
    ```

3. **Access the application**:
    Open your web browser and navigate to `http://localhost:3000` to access the frontend. The frontend will communicate with the backend running on `http://localhost:5000`.

## Notes

- Ensure that the `client_secret.json` file is correctly configured with your Google API credentials.
- Make sure to configure the redirect URIs in your Google API console to match the ones used in the project.

