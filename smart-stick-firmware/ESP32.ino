#include <WiFi.h>
#include <HTTPClient.h>
#include <TinyGPS++.h>
#include <NewPing.h>

// ===================================================
// 1. CONFIGURATION AND PIN ASSIGNMENTS
// ===================================================

// --- A. Connectivity Settings ---
const char* WIFI_SSID = "Your_Network_SSID";
const char* WIFI_PASS = "Your_Network_Password";
// **IMPORTANT**: Replace with your actual Node.js server URL
const char* API_URL   = "http://YOUR_SERVER_IP:3000/api/location"; 
const char* STICK_ID = "WALKSTK-001"; 

// --- B. Pin Assignments ---
// GPS (NEO-6M) on HardwareSerial 1
#define GPS_TX_PIN 17 // ESP32 -> GPS_RX
#define GPS_RX_PIN 16 // ESP32 -> GPS_TX

// SIM800L EVB on HardwareSerial 2
#define SIM_BAUD 9600 // Standard baud rate for SIM800L
#define SIM_TX_PIN 26 // ESP32 -> SIM800L_RX
#define SIM_RX_PIN 25 // ESP32 -> SIM800L_TX
// NOTE: Ensure your SIM800L module is powered correctly (3.7V - 4.4V) and logic levels are 3.3V.

// Ultrasonic Sensor (JSN-SR04T)
#define ULTRASONIC_TRIG_PIN 13 
#define ULTRASONIC_ECHO_PIN 12 
#define MAX_DISTANCE 400 // Max sensor distance in cm

// Passive Piezo Buzzer
#define BUZZER_PIN 4

// --- C. Cellular (SIM800L) Settings ---
// Check with your Mobile Network Operator (MNO) for the correct APN
const char* APN = "internet"; // e.g., "smartinternet", "globe.com.ph", "att.mvno"
const char* APN_USER = "";
const char* APN_PASS = "";

// --- D. Timing and State Variables ---
const long TRANSMIT_INTERVAL_MS = 10000; // Send update every 10 seconds
unsigned long previousMillis = 0; 

double currentLatitude = 0.0;
double currentLongitude = 0.0;
bool isObstacle = false;

// --- E. Object Instantiation ---
HardwareSerial GPS_Serial(1); // UART 1 for GPS
HardwareSerial SIM_Serial(2); // UART 2 for SIM800L
TinyGPSPlus gps;
NewPing sonar(ULTRASONIC_TRIG_PIN, ULTRASONIC_ECHO_PIN, MAX_DISTANCE);

// ===================================================
// 2. UTILITY FUNCTIONS
// ===================================================

/**
 * @brief Sends AT command and waits for a specific response.
 */
bool sendATCommand(const char* command, const char* expected_response, unsigned long timeout = 5000) {
    SIM_Serial.println(command);
    unsigned long start_time = millis();
    String response = "";

    while (millis() - start_time < timeout) {
        if (SIM_Serial.available()) {
            char c = SIM_Serial.read();
            response += c;
            
            if (response.indexOf(expected_response) != -1) {
                // Serial.printf("SIM: SUCCESS - %s\n", response.c_str());
                return true;
            }
        }
    }
    Serial.printf("SIM: FAILURE - Cmd: %s (Expected: %s)\n", command, expected_response);
    return false;
}

// ===================================================
// 3. SENSOR & CONNECTIVITY LOGIC
// ===================================================

/**
 * @brief Attempts to connect to the configured Wi-Fi network.
 */
bool connectWiFi() {
    if (WiFi.status() == WL_CONNECTED) {
        return true;
    }
    
    Serial.println("Attempting Wi-Fi connection...");
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWiFi connected. IP: " + WiFi.localIP().toString());
        return true;
    } else {
        Serial.println("\nWiFi connection failed.");
        return false;
    }
}

/**
 * @brief Reads incoming GPS serial data and updates global coordinates. NON-BLOCKING.
 */
void updateGPSData() {
    // Process all available characters from the GPS module
    while (GPS_Serial.available()) {
        gps.encode(GPS_Serial.read());
    }

    // Check if the fix is valid and recent (less than 2 seconds old)
    if (gps.location.isValid() && gps.location.age() < 2000) { 
        currentLatitude = gps.location.lat();
        currentLongitude = gps.location.lng();
    }
}

/**
 * @brief Checks the ultrasonic sensor for obstacles.
 */
bool checkObstacle(int threshold_cm = 50) {
    int distance = sonar.ping_cm(); 

    if (distance > 0 && distance < threshold_cm) {
        tone(BUZZER_PIN, 1000, 250); 
        return true;
    }
    return false;
}

/**
 * @brief Sends the data payload using SIM800L GPRS (Cellular Failover).
 */
bool sendDataGPRS(String payload) {
    Serial.println("Starting GPRS transmission sequence...");

    // 1. Basic modem check
    if (!sendATCommand("AT", "OK", 1000)) return false; 

    // 2. Network Registration Check 
    if (!sendATCommand("AT+CREG?", "+CREG: 0,1", 10000) && 
        !sendATCommand("AT+CREG?", "+CREG: 0,5", 10000)) {
        Serial.println("Failed to register on the network.");
        return false;
    }
    Serial.println("Registered to network.");

    // 3. Configure GPRS APN
    String apnCommand = "AT+CSTT=\"" + String(APN) + "\",\"" + String(APN_USER) + "\",\"" + String(APN_PASS) + "\"";
    if (!sendATCommand(apnCommand.c_str(), "OK")) return false;

    // 4. Bring up Wireless Connection (Start GPRS)
    if (!sendATCommand("AT+CIICR", "OK", 5000)) return false;

    // 5. Get Local IP Address (Check for a character in an IP)
    if (!sendATCommand("AT+CIFSR", ".", 10000)) return false; 

    // 6. Initialize HTTP service
    if (!sendATCommand("AT+HTTPINIT", "OK", 5000)) return false;

    // 7. Set HTTP Parameters (URL)
    String urlCommand = "AT+HTTPPARA=\"URL\",\"" + String(API_URL) + "\"";
    if (!sendATCommand(urlCommand.c_str(), "OK")) return false;

    // 8. Set Content Type (JSON)
    if (!sendATCommand("AT+HTTPPARA=\"CONTENT\",\"application/json\"", "OK")) return false;
    
    // 9. Send Data Header
    String dataCommand = "AT+HTTPDATA=" + String(payload.length()) + ",5000"; 
    if (!sendATCommand(dataCommand.c_str(), "DOWNLOAD", 10000)) return false;

    // 10. Send the actual payload data
    SIM_Serial.print(payload);
    if (!sendATCommand("", "OK", 10000)) return false; 

    // 11. Execute HTTP POST method (1 = POST)
    if (!sendATCommand("AT+HTTPACTION=1", "OK", 10000)) return false; 

    // 12. Check status of POST request (Wait for AT+HTTPACTION: 1, 201, ...)
    // Note: The response is typically read after a delay, this simplifies by checking the action code.
    if (!sendATCommand("AT+HTTPREAD", "+HTTPACTION: 1,201", 15000)) { 
        Serial.println("GPRS POST FAILED or returned error code.");
        // Terminate regardless of success/failure
        sendATCommand("AT+HTTPTERM", "OK"); 
        return false;
    }
    
    // 13. Terminate HTTP service
    sendATCommand("AT+HTTPTERM", "OK");

    Serial.println("GPRS Transmission COMPLETE.");
    return true;
}

/**
 * @brief Main function to prepare and send data, prioritizing Wi-Fi.
 */
void sendData() {
    if (currentLatitude == 0.0 && currentLongitude == 0.0) {
        Serial.println("Warning: Skipping transmission, no valid GPS lock yet.");
        return;
    }

    // --- 1. Prepare JSON Payload ---
    String jsonPayload = "{";
    jsonPayload += "\"stickId\":\"" + String(STICK_ID) + "\",";
    jsonPayload += "\"latitude\":" + String(currentLatitude, 6) + ",";
    jsonPayload += "\"longitude\":" + String(currentLongitude, 6) + ",";
    jsonPayload += String("\"obstacleDetected\":") + (isObstacle ? "true" : "false") + ",";
    // NOTE: Implement analogRead() on a voltage divider circuit to get real battery data.
    jsonPayload += "\"batteryLevel\":75"; 
    jsonPayload += "}";

    // --- 2. Attempt Wi-Fi Transmission ---
    bool wifi_success = false;
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(API_URL);
        http.addHeader("Content-Type", "application/json");

        Serial.println("Attempting Wi-Fi transmission...");
        int httpCode = http.POST(jsonPayload);
        
        if (httpCode > 0) {
            Serial.printf("[HTTP] POST success, code: %d\n", httpCode);
            wifi_success = true;
        } else {
            Serial.printf("[HTTP] Wi-Fi POST failed, error: %s\n", http.errorToString(httpCode).c_str());
        }
        http.end();
    } 
    
    // --- 3. Cellular Failover ---
    if (!wifi_success) {
        Serial.println("Wi-Fi failed/disconnected. Initiating Cellular GPRS Failover...");
        
        if (sendDataGPRS(jsonPayload)) {
            Serial.println("Data sent successfully via GPRS.");
        } else {
            Serial.println("Data transmission FAILED via both Wi-Fi and GPRS.");
        }
    }
}

// ===================================================
// 4. SETUP AND LOOP
// ===================================================

void setup() {
    Serial.begin(115200);
    delay(500);

    // Initialize GPS UART at 9600 baud
    GPS_Serial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN); 

    // Initialize SIM800L UART
    SIM_Serial.begin(SIM_BAUD, SERIAL_8N1, SIM_RX_PIN, SIM_TX_PIN); 

    // Initialize buzzer and ultrasonic pins
    pinMode(BUZZER_PIN, OUTPUT);
    pinMode(ULTRASONIC_TRIG_PIN, OUTPUT);
    pinMode(ULTRASONIC_ECHO_PIN, INPUT);

    // Initial Wi-Fi connection attempt
    connectWiFi();
}

void loop() {
    // A. Connectivity Maintenance (Check and reconnect every 5 seconds)
    if (WiFi.status() != WL_CONNECTED) {
        if (millis() % 5000 < 50) { 
             connectWiFi();
        }
    }
    
    // B. Continuous Sensor Reading (Non-Blocking)
    // These functions run extremely fast every loop cycle.
    updateGPSData();
    isObstacle = checkObstacle();

    // C. Timed Data Transmission
    unsigned long currentMillis = millis();

    // Check if the set interval has passed (10 seconds)
    if (currentMillis - previousMillis >= TRANSMIT_INTERVAL_MS) {
        previousMillis = currentMillis; // Reset the timer
        
        sendData(); 
    }
}