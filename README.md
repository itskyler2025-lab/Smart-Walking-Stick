# Smart Walking Stick: Full-Stack IoT Tracking & Alert System

A comprehensive IoT solution designed to enhance the safety and independence of the elderly and visually impaired. It combines a custom-built hardware device (the 'smart stick') with a real-time web dashboard, providing caregivers with live location tracking, path history, and instant emergency alerts.

<!-- You can replace this with a screenshot or GIF of your project -->
<!--  -->

## ✨ Key Features

*   **Real-Time GPS Tracking**: Live location updates on an interactive Google Maps interface.
*   **Interactive Path History**: Visualize the user's recent routes with timestamps.
*   **Emergency Panic Button**: A physical button on the stick triggers instant visual and audio alarms on the dashboard.
*   **Automated Notifications**: Caregivers receive immediate email and push notifications (via Firebase) during emergencies.
*   **Dual-Connectivity (WiFi & Cellular)**: The device prioritizes WiFi and automatically fails over to a SIM800L GPRS module, ensuring constant connectivity.
*   **Hardware Status Monitoring**: Real-time battery level and obstacle detection status displayed on the dashboard.
*   **Over-the-Air (OTA) Firmware Updates**: Securely update the device's firmware remotely from the backend.
*   **Secure User Authentication**: JWT-based login system to protect sensitive user and location data.
*   **Responsive Web Dashboard**: A modern, dark-themed interface built with React, optimized for both desktop and mobile devices.

## 🏗️ System Architecture

The project is composed of three main parts that work in concert:

1.  **Smart Stick (ESP32 Firmware):**
    *   Captures GPS coordinates, battery voltage, and ultrasonic sensor data.
    *   Sends data to the backend via HTTPS POST requests, prioritizing WiFi and using GPRS as a failover.
    *   Listens for OTA update commands from the server.
    *   Triggers an immediate "emergency" data transmission when the panic button is pressed.

2.  **Backend (Node.js / Express):**
    *   Provides a secure REST API for user authentication, profile management, and data retrieval.
    *   Receives and stores location data from the stick in a MongoDB database.
    *   Broadcasts real-time location and status updates to the frontend via a Socket.io WebSocket server.
    *   Handles emergency logic, sending alerts via Nodemailer (email) and Firebase Admin SDK (push notifications).
    *   Serves new firmware binaries for secure OTA updates.

3.  **Frontend (React):**
    *   A secure, single-page application for caregivers to monitor the device.
    *   Displays live location, path history, and device status on an interactive map.
    *   Receives real-time updates through a WebSocket connection.
    *   Allows users to manage their profile and clear active emergency alerts.

## 📂 Project Structure

```
/
├── smart-stick-backend/    # Node.js, Express, Socket.io API
├── smart-stick-frontend/   # React.js dashboard (Vite)
├── smart-stick-firmware/   # C++ code for the ESP32 device
└── SmartStickNative/       # (Placeholder) React Native mobile app
```
## 🛠️ Tech Stack

| Category      | Technology                                                              |
|---------------|-------------------------------------------------------------------------|
| **Hardware**  | ESP32, NEO-6M (GPS), SIM800L (GPRS), JSN-SR04T (Ultrasonic)                |
| **Firmware**  | C++ (Arduino Framework)                                                 |
| **Backend**   | Node.js, Express, MongoDB, Mongoose, Socket.io, JWT, Nodemailer, Firebase Admin |
| **Frontend**  | React, Vite, Google Maps API, Socket.io Client, Axios, React Router           |
| **Deployment**| Render (Backend), Vercel (Frontend) - *Examples*                        |


## 🔌 Hardware & Firmware

### Components
*   **Microcontroller**: ESP32 (Dual-core, Wi-Fi/Bluetooth enabled).
*   **GPS Module**: NEO-6M (for location tracking).
*   **Cellular Module**: SIM800L (for GPRS data transmission when outside Wi-Fi range).
*   **Obstacle Sensor**: JSN-SR04T (Waterproof ultrasonic sensor).
*   **Input**: Push button (Panic/Emergency).
*   **Output**: Buzzer (Obstacle warning) and LED (Status).
*   **Power**: Li-ion Battery with a voltage divider for monitoring.

### Pin Configuration (Wiring)

| Component | ESP32 Pin | Description |
| :--- | :--- | :--- |
| **GPS RX** | GPIO 17 | Serial TX from ESP32 to GPS RX |
| **GPS TX** | GPIO 16 | Serial RX from ESP32 to GPS TX |
| **SIM800L RX** | GPIO 26 | Serial TX from ESP32 to SIM RX |
| **SIM800L TX** | GPIO 25 | Serial RX from ESP32 to SIM TX |
| **Ultrasonic Trig** | GPIO 13 | Trigger pulse for sensor |
| **Ultrasonic Echo** | GPIO 27 | Echo pulse from sensor (Moved from GPIO 12 to prevent boot issues) |
| **Panic Button** | GPIO 14 | Input (Pull-up) |
| **Buzzer** | GPIO 4 | Output |
| **Status LED** | GPIO 2 | Output (Built-in LED) |
| **Battery Monitor** | GPIO 34 | Analog Input (ADC1_CH6) |


## 🚀 Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   MongoDB (a local instance or a MongoDB Atlas URI)
*   A Google Maps API Key
*   A Gmail account with an "App Password" for sending emails.
*   A Firebase project with a service account key for push notifications.
*   Arduino IDE with ESP32 board support installed.

### 1. Backend Setup

1.  Navigate to the backend folder:
    ```bash
    cd smart-stick-backend
    ```
2.  Install dependencies: `npm install`
3.  Create a `.env` file in the `smart-stick-backend` directory. You can copy `.env.example` to get started.
    ```env
    # Server Configuration
    PORT=5000
    FRONTEND_URL=http://localhost:3000

    # MongoDB Connection
    # For local MongoDB: MONGO_URI=mongodb://localhost:27017/smart-stick
    # For MongoDB Atlas: MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/smart-stick
    MONGO_URI=your_mongodb_connection_string

    # JWT Authentication
    JWT_SECRET=your_super_secret_jwt_key
    JWT_EXPIRES_IN=24h

    # Email Service (Nodemailer with Gmail)
    # You need to generate an "App Password" from your Google Account settings
    # See: https://support.google.com/accounts/answer/185833
    EMAIL_USER=your_email@gmail.com
    EMAIL_PASS=your_gmail_app_password

    # API Key for ESP32 Communication
    # This should be a long, random, and unguessable string
    ESP32_API_KEY=a_strong_random_api_key_for_esp32

    # Firebase Admin SDK (for Push Notifications)
    # This should be the entire content of your firebase-service-account.json file,
    # stringified into a single line.
    # Example: '{"type":"service_account",...}'
    FIREBASE_SERVICE_ACCOUNT=
    ```
4.  Start the server:
    ```bash
    npm run dev
    ```

### 2. Frontend Setup

1.  Navigate to the frontend folder:
    ```bash
    cd smart-stick-frontend
    ```
2.  Install dependencies: `npm install`
3.  Create a `.env` file in the `smart-stick-frontend` directory. **Note:** Vite requires the `VITE_` prefix for environment variables.
    ```env
    VITE_API_URL=http://localhost:5000
    VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
    VITE_GOOGLE_MAPS_MAP_ID=your_google_maps_map_id # Optional, for custom map styling
    ```
4.  Start the React app:
    ```bash
    npm start
    ```

### 3. Firmware & Device Setup

1.  **Flash the Firmware**:
    *   Open `smart-stick-firmware/ESP32.ino` in the Arduino IDE.
    *   Install the required libraries from the Library Manager:
        *   `TinyGPS++` by Mikal Hart
        *   `NewPing` by Tim Eckel
    *   Connect your ESP32 board, select the correct board and port in the Arduino IDE, and click "Upload".

2.  **Configure the Device**:
    *   After flashing, the ESP32 will create a Wi-Fi Access Point named **`SmartStick-Setup`**.
    *   Connect to this network with your phone or computer. A captive portal should automatically open a configuration page. If not, navigate to `192.168.4.1` in your browser.
    *   On the configuration page, enter:
        *   Your local Wi-Fi SSID and Password.
        *   The `Stick ID` you will use to register an account (e.g., `WALKSTK-001`).
        *   The `API Key` (must match `ESP32_API_KEY` in the backend `.env` file).
        *   The `API URL` for location data (e.g., `https://your-backend-url.com/api/location`).
        *   The `OTA URL` for firmware updates (e.g., `http://<your-backend-ip>:5000/api/firmware/update`).
    *   Click "Save". The device will restart and connect to your network.

---

## 📡 API Endpoints

A brief overview of the main backend API routes.

### Authentication
*   `POST /api/auth/register`: Register a new caregiver account.
*   `POST /api/auth/login`: Login to receive an access token.
*   `POST /api/auth/forgotpassword`: Request a password reset email.
*   `PUT /api/auth/resetpassword/:token`: Reset password using a token.

### Device & Location Data
*   `POST /api/location`: **(For ESP32)** Endpoint for the hardware to send GPS, battery, and sensor data. Secured with an API key.
*   `GET /api/latest`: **(Protected)** Retrieve the most recent location status for the logged-in user's stick.
*   `GET /api/history`: **(Protected)** Retrieve historical path data for the logged-in user's stick.
*   `POST /api/emergency/clear`: **(Protected)** Clear an active emergency state.

### User & Firmware
*   `GET /api/user/profile`: **(Protected)** Get the current user's profile information.
*   `PUT /api/user/profile`: **(Protected)** Update the user's profile.
*   `PUT /api/user/fcm-token`: **(Protected)** Update the user's Firebase Cloud Messaging token.
*   `GET /api/firmware/update`: **(For ESP32)** Endpoint for the hardware to check for and download new firmware versions.

## 🗺️ Future Roadmap

*   **React Native App**: Complete the native mobile application for a better on-the-go monitoring experience.
*   **Geofencing**: Implement functionality to alert caregivers if the user leaves a predefined safe area.
*   **Fall Detection**: Integrate an accelerometer (like MPU-6050) to detect falls and trigger automatic emergency alerts.
*   **Dashboard Analytics**: Add a section for data analytics, such as daily distance traveled, common routes, and battery usage patterns.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📄 License
This project is open-source and available under the MIT License.