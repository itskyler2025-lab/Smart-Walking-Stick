#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <TinyGPS++.h>
#include <NewPing.h>
#include <time.h>
#include <HTTPUpdate.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <Preferences.h>

// ===================================================
// 1. CONFIGURATION AND PIN ASSIGNMENTS
// ===================================================

// --- A. Firmware Version ---
const char* FW_VERSION = "1.0.0"; // Current firmware version

// --- Root CA Certificate (ISRG Root X1 for Render/Let's Encrypt) ---
// If your backend uses a different provider, replace this PEM string.
const char* root_ca = \
"-----BEGIN CERTIFICATE-----\n" \
"MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPguyzmk0cwDQYJKoZIhvcNAQELBQAw\n" \
"TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh\n" \
"cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4\n" \
"WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu\n" \
"ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY\n" \
"MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc\n" \
"h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+\n" \
"0TM8ukj13Xnfs7j/EvEhmkvBioZxaUwlkywrRXx4m1zdqSPwerDK44E875Eyaf85\n" \
"60DB8hirno15fSqPo+drl5fIu8i2jlmY/t/6u3eRgJ34FdpQ94veZG5hGJDRK67l\n" \
"8gVIhgFz6n7p1q7IzQt03Wta1wf6Jp8/172ld381m7f+L64W2r523qO9p8+s19n+\n" \
"e4F5lOv8S28Fw9xI5qG48eG+eU335nF9c8W9c8A+ac4SlE/eC9s122Z/8C5y1t8z\n" \
"479g1+GGE6iF6aNYxlc/7/q9H9C1W6L4S3F4rE/7jL76A8eBw6+J9h193z5A9Dsv\n" \
"j/6p7ysPH0Ukp8Yll00te/2o300f9gZ18t3ii7As3r+J3x5y4yW8O96/1+x4252w\n" \
"h6PVqU3kb2ks9910Y28+5D/9jJ9og0VV9bZb9t57d3BHIsov540R2ns8MhyJe6hI\n" \
"x29h59f2/43rP5L+q8k0/5K28breltXln4/3V7f724GBdP2vlI159/df6095d7xx\n" \
"sD2H1s/b88em6FJ6p1kG2flX\n" \
"-----END CERTIFICATE-----\n";

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
#define ULTRASONIC_ECHO_PIN 27 // Changed from 12 (Strapping Pin) to 27 to prevent boot issues. Update wiring!
#define MAX_DISTANCE 400 // Max sensor distance in cm

// Status LED
#define STATUS_LED_PIN 2 // Built-in LED on many ESP32 boards

// Buzzer (Passive or Active). Using tone() for compatibility with passive buzzers.
#define BUZZER_PIN 4
#define BEEP_FREQUENCY 1000 // Frequency in Hz for the beep sound.

#define EMERGENCY_BTN_PIN 14 // Button connected between GPIO 14 and GND. 
// For 4-pin buttons: Connect GPIO 14 to one pin, and GND to the diagonally opposite pin.

// Power Button (Soft Latch via Deep Sleep)
#define POWER_BTN_PIN 33 // Connect button between GPIO 33 and GND

// Battery Monitoring (Voltage Divider)
#define BATTERY_PIN 34 // ADC1_CH6. Connect center of voltage divider here.
// Assumes a voltage divider with two equal resistors (e.g., 10k & 10k)
const float BATTERY_CALIBRATION_FACTOR = 1.0; // Adjust this value to calibrate (e.g., if reading is low, increase this)

// USB Power Detection
#define USB_DETECT_PIN 35 // Connect USB 5V to this pin via a voltage divider (e.g., 10k + 20k) to get ~3.3V

// --- C. Cellular (SIM800L) Settings ---
// Check with your Mobile Network Operatorfor the correct APN
const char* APN = "internet";
const char* APN_USER = "";
const char* APN_PASS = "";
 
// --- D. NTP Time Settings ---
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 0;      // GMT offset in seconds. Set to your timezone (e.g., -5 * 3600 for EST).
const int   daylightOffset_sec = 0; // Daylight saving offset in seconds (e.g., 3600).

// --- E. Timing and State Variables ---
bool configMode = false; // Flag to indicate if we are in AP/Configuration mode
const long TRANSMIT_INTERVAL_MS = 10000; // Send update every 10 seconds
unsigned long previousMillis = 0; 

double currentLatitude = 0.0;
double currentLongitude = 0.0;
bool isObstacle = false;
bool isEmergency = false;

volatile bool buttonPressedFlag = false; // Flag set by ISR
unsigned long lastSpamTime = 0;
const unsigned long spamDelay = 2000; // 2 seconds to prevent spamming
 
// Buzzer state for non-blocking double-beep
enum BuzzerState {
  BUZZER_IDLE,
  BUZZER_OBSTACLE_BEEP_1,
  BUZZER_OBSTACLE_PAUSE_1,
  BUZZER_OBSTACLE_BEEP_2,
  BUZZER_BATTERY_BEEP_1,
  BUZZER_BATTERY_PAUSE_1,
  BUZZER_BATTERY_BEEP_2,
  BUZZER_BATTERY_PAUSE_2,
  BUZZER_BATTERY_BEEP_3
};
BuzzerState buzzerState = BUZZER_IDLE;
unsigned long buzzerStateStartTime = 0;
unsigned long lastBeepFinishTime = 0; // Used for cooldown between double-beep sequences
const long BEEP_1_DURATION_MS = 80;
const long PAUSE_1_DURATION_MS = 60; 
const long BEEP_2_DURATION_MS = 80; 

// Low Battery Alert Settings
const int LOW_BATTERY_THRESHOLD = 20; // Alert when battery is <= 20%
const unsigned long LOW_BATTERY_WARNING_INTERVAL = 60000; // Repeat every 60 seconds
unsigned long lastLowBatteryWarningTime = 0;
const int BATTERY_BEEP_FREQ = 500; // Lower pitch (500Hz) for battery warning
const long BATTERY_BEEP_DURATION = 150;
const long BATTERY_PAUSE_DURATION = 100;

// Dynamic beep interval settings
const int MAX_OBSTACLE_DIST_CM = 50;      // The max distance to consider an obstacle
const int MIN_OBSTACLE_DIST_CM = 5;       // The distance for the fastest beep
const long FAST_BEEP_COOLDOWN_MS = 100;   // Cooldown for closest obstacles
const long SLOW_BEEP_COOLDOWN_MS = 600;   // Cooldown for farthest obstacles
long currentBeepCooldown = SLOW_BEEP_COOLDOWN_MS; // Holds the dynamically calculated cooldown

// Wi-Fi reconnect timer
unsigned long lastWifiReconnectAttempt = 0;
const long WIFI_RECONNECT_INTERVAL_MS = 5000; // Try to reconnect every 5 seconds

// Power Button State
unsigned long powerBtnTimer = 0;

// Non-Blocking Battery Sampling State
const int BATTERY_SAMPLE_COUNT = 20;
int batterySamples[BATTERY_SAMPLE_COUNT];
int batterySampleIndex = 0;
bool batterySamplesReady = false;
int lastCalculatedBatteryLevel = -1; // Use -1 to indicate not yet calculated
 
// --- F. Object Instantiation ---
HardwareSerial GPS_Serial(1); // UART 1 for GPS
HardwareSerial SIM_Serial(2); // UART 2 for SIM800L
TinyGPSPlus gps;
NewPing sonar(ULTRASONIC_TRIG_PIN, ULTRASONIC_ECHO_PIN, MAX_DISTANCE);
WebServer server(80);
DNSServer dnsServer;
Preferences preferences;

// ===================================================
// 2. UTILITY FUNCTIONS
// ===================================================

/**
 * @brief Interrupt Service Routine for the emergency button.
 */
void IRAM_ATTR handleButtonInterrupt() {
  buttonPressedFlag = true;
}

/**
 * @brief Initializes and synchronizes the device time using an NTP server.
 * This is crucial for SSL certificate validation.
 */
void syncTime() {
  Serial.println("Configuring time from NTP server...");
  // configTime(gmtOffset_sec, daylightOffset_sec, ntpServer1, ntpServer2, ntpServer3)
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("Failed to obtain time. Retrying...");
    // It can take a few seconds to sync.
    int retries = 0;
    while (!getLocalTime(&timeinfo) && retries < 10) {
      delay(500);
      Serial.print(".");
      retries++;
    }
  }

  if (getLocalTime(&timeinfo)) {
    Serial.println("\nTime synchronized successfully!");
    Serial.println(&timeinfo, "%A, %B %d %Y %H:%M:%S");
  } else {
    Serial.println("\nFailed to synchronize time after multiple attempts. SSL validation may fail.");
  }
}

void handleRoot() {
  // Scan for networks
  Serial.println("Scanning for networks...");
  int n = WiFi.scanNetworks();
  Serial.println("Scan done");
  
  String ssidOptions = "";
  if (n == 0) {
    ssidOptions = "<option value='' disabled>No networks found</option>";
  } else {
    for (int i = 0; i < n; ++i) {
      String ssid = WiFi.SSID(i);
      String rssi = String(WiFi.RSSI(i));
      String lock = (WiFi.encryptionType(i) == WIFI_AUTH_OPEN) ? "" : "🔒";
      ssidOptions += "<option value=\"" + ssid + "\">" + ssid + " (" + rssi + " dBm) " + lock + "</option>";
    }
  }

  String html = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Smart Stick Wi-Fi Setup</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #222831; color: #EEEEEE; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
        .container { background-color: #393E46; padding: 25px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); width: 90%; max-width: 400px; }
        h1 { color: #00ADB5; text-align: center; margin-top: 0; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, select { width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid #00ADB5; border-radius: 5px; background-color: #222831; color: #EEEEEE; box-sizing: border-box; }
        button { width: 100%; padding: 12px; background-color: #00ADB5; color: white; border: none; border-radius: 5px; font-weight: bold; font-size: 16px; cursor: pointer; transition: background-color 0.3s; }
        button:hover { background-color: #008C9E; }
        .rescan-btn { background-color: transparent; border: 1px solid #00ADB5; color: #00ADB5; margin-bottom: 20px; }
        .rescan-btn:hover { background-color: rgba(0, 173, 181, 0.1); }
        .hidden { display: none; }
    </style>
    <script>
        function onSSIDChange() {
            var select = document.getElementById("ssidSelect");
            var input = document.getElementById("ssid");
            if (select.value === "MANUAL") {
                input.classList.remove("hidden");
                input.value = "";
                input.focus();
            } else {
                input.classList.add("hidden");
                input.value = select.value;
            }
        }

        function togglePassword() {
            var x = document.getElementById("pass");
            if (x.type === "password") {
                x.type = "text";
            } else {
                x.type = "password";
            }
        }

        function validateForm() {
            var apiKey = document.getElementById("apiKey").value;
            if (apiKey.trim() === "") {
                alert("API Key is required!");
                document.getElementById("apiKey").focus();
                return false;
            }
            return true;
        }
    </script>
</head>
<body>
    <div class="container">
        <h1>Wi-Fi Configuration</h1>
        <button type="button" class="rescan-btn" onclick="window.location.href='/'">↻ Rescan Networks</button>
        <form action="/save" method="POST" onsubmit="return validateForm()">
            <label for="ssidSelect">Select Network:</label>
            <select id="ssidSelect" onchange="onSSIDChange()">
                <option value="" disabled selected>Select a network...</option>
                %SSID_OPTIONS%
                <option value="MANUAL">Enter Manually...</option>
            </select>
            
            <input type="text" id="ssid" name="ssid" class="hidden" placeholder="Enter SSID Manually" required>

            <label for="pass">Password:</label>
            <input type="password" id="pass" name="pass" placeholder="Your WiFi Password">
            
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <input type="checkbox" onclick="togglePassword()" style="width: auto; margin: 0 10px 0 0;">
                <span style="cursor: pointer;" onclick="togglePassword()">Show Password</span>
            </div>

            <hr style="border-color: #00ADB5; margin: 20px 0;">
            <label for="stickId">Stick ID:</label>
            <input type="text" id="stickId" name="stickId" required placeholder="e.g., WALKSTK-001" value="%STICK_ID%">
            <label for="apiKey">API Key:</label>
            <input type="password" id="apiKey" name="apiKey" required placeholder="Backend API Key" value="%API_KEY%">
            <hr style="border-color: #00ADB5; margin: 20px 0;">
            <label for="apiUrl">API URL:</label>
            <input type="text" id="apiUrl" name="apiUrl" required placeholder="https://your-backend.com/api/location" value="%API_URL%">
            <label for="otaUrl">OTA URL:</label>
            <input type="text" id="otaUrl" name="otaUrl" required placeholder="https://your-backend.com/api/firmware/update" value="%OTA_URL%">
            <button type="submit">Save and Restart</button>
        </form>
    </div>
    <script>
        var savedSSID = "%SAVED_SSID%";
        if(savedSSID) {
            document.getElementById("ssid").value = savedSSID;
        }
    </script>
</body>
</html>
)rawliteral";

  // Load existing values to pre-fill the form
  preferences.begin("wifi-creds", true);
  String savedSSID = preferences.getString("ssid", "");
  html.replace("%SAVED_SSID%", savedSSID);
  html.replace("%SSID_OPTIONS%", ssidOptions);
  html.replace("%STICK_ID%", preferences.getString("stickId", ""));
  html.replace("%API_KEY%", preferences.getString("apiKey", ""));
  html.replace("%API_URL%", preferences.getString("apiUrl", ""));
  html.replace("%OTA_URL%", preferences.getString("otaUrl", ""));
  preferences.end();

  server.send(200, "text/html", html);
}

void handleSave() {
  String ssid = server.arg("ssid");
  String pass = server.arg("pass");
  String stickId = server.arg("stickId");
  String apiKey = server.arg("apiKey");
  String apiUrl = server.arg("apiUrl");
  String otaUrl = server.arg("otaUrl");

  Serial.println("Saving new configuration...");
  Serial.println("SSID: " + ssid);
  Serial.println("Stick ID: " + stickId);
  Serial.println("API URL: " + apiUrl);
  Serial.println("OTA URL: " + otaUrl);
  // Do not print password or api key to serial for security

  preferences.begin("wifi-creds", false);
  preferences.putString("ssid", ssid);
  preferences.putString("pass", pass);
  preferences.putString("stickId", stickId);
  preferences.putString("apiKey", apiKey);
  preferences.putString("apiUrl", apiUrl);
  preferences.putString("otaUrl", otaUrl);
  preferences.end();

  String html = R"rawliteral(
<!DOCTYPE html><html><head><title>Saved</title><style>body{font-family:sans-serif;background:#222831;color:#eee;text-align:center;padding-top:50px;}</style></head>
<body><h1>Credentials Saved!</h1><p>The device will now restart and attempt to connect to the new network.</p></body></html>
)rawliteral";
  server.send(200, "text/html", html);

  delay(1000);
  ESP.restart();
}

/**
 * @brief Sends an AT command and waits for a specific response, with improved robustness.
 * This version reads the serial response line-by-line to avoid memory issues and
 * provides better debugging output.
 * @param command The AT command to send.
 * @param expected_response1 The primary expected success response string.
 * @param timeout The time to wait for a response in milliseconds.
 * @param expected_response2 An optional secondary expected success response string.
 * @return True if one of the expected responses is found, false on timeout or error.
 */
bool sendATCommand(const char* command, const char* expected_response1, unsigned long timeout, const char* expected_response2 = nullptr) {
    // 1. Clear any previous data in the serial buffer to start fresh
    while(SIM_Serial.available()) {
        SIM_Serial.read();
    }

    // 2. Send the command
    SIM_Serial.println(command);
    Serial.printf("SIM TX: %s\n", command);

    // 3. Wait for a response line-by-line
    unsigned long start_time = millis();
    String current_line = "";
    bool line_complete = false;

    while (millis() - start_time < timeout) {
        if (SIM_Serial.available()) {
            char c = SIM_Serial.read();
            if (c == '\n') {
                line_complete = true;
            } else if (c != '\r') {
                current_line += c;
            }

            if (line_complete) {
                current_line.trim();
                if (current_line.length() > 0) {
                    Serial.printf("SIM RX: %s\n", current_line.c_str());

                    // Check for primary success condition
                    if (current_line.indexOf(expected_response1) != -1) return true;
                    // Check for alternate success condition if provided
                    if (expected_response2 != nullptr && current_line.indexOf(expected_response2) != -1) return true;
                    // Check for common errors
                    if (current_line.indexOf("ERROR") != -1) {
                        Serial.println("SIM: Received ERROR response.");
                        return false;
                    }
                }
                // Reset for next line
                current_line = "";
                line_complete = false;
            }
        }
    }

    // 4. If we get here, it's a timeout
    Serial.printf("SIM: TIMEOUT - Cmd: %s (Expected: %s)\n", command, expected_response1);
    return false;
}

// ===================================================
// 3. SENSOR & CONNECTIVITY LOGIC
// ===================================================

void startConfigMode() {
  configMode = true;
  const char* ap_ssid = "SmartStick-Setup";
  
  Serial.println("\nStarting Configuration Mode...");
  Serial.printf("Connect to Wi-Fi '%s' to configure.\n", ap_ssid);

  // Set mode to AP+STA to allow scanning while AP is active
  WiFi.mode(WIFI_AP_STA);
  // Start Access Point
  WiFi.softAP(ap_ssid);
  IPAddress apIP = WiFi.softAPIP();
  Serial.printf("AP IP address: %s\n", apIP.toString().c_str());

  // Start DNS server for captive portal
  dnsServer.start(53, "*", apIP);

  // Setup web server routes
  server.on("/", HTTP_GET, handleRoot);
  server.on("/save", HTTP_POST, handleSave);

  // --- Captive Portal Handlers ---
  // By responding to these common OS connectivity check URLs with our configuration page,
  // we can trigger the captive portal popup on most devices.
  server.on("/generate_204", HTTP_GET, handleRoot); // Android
  server.on("/fwlink", HTTP_GET, handleRoot);       // Microsoft
  server.on("/hotspot-detect.html", HTTP_GET, handleRoot); // Apple

  // Generic catch-all for any other request.
  server.onNotFound(handleRoot);

  server.begin();

  Serial.println("Web server started. Waiting for configuration...");
}

/**
 * @brief Attempts to connect to the configured Wi-Fi network.
 */
bool connectWiFi(bool enableConfigMode) {
  // Read credentials from persistent storage
  preferences.begin("wifi-creds", true); // Read-only
  String ssid = preferences.getString("ssid", "");
  String pass = preferences.getString("pass", "");
  preferences.end();

  if (ssid == "") {
    startConfigMode();
    return false;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(STATUS_LED_PIN, HIGH); // Solid ON for connected
    return true;
  }
  
  Serial.println("Attempting Wi-Fi connection to: " + ssid);
  WiFi.begin(ssid.c_str(), pass.c_str());
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    // Blink the LED to indicate connection attempt
    digitalWrite(STATUS_LED_PIN, HIGH);
    delay(250);
    digitalWrite(STATUS_LED_PIN, LOW);
    delay(250);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected. IP: " + WiFi.localIP().toString());
    digitalWrite(STATUS_LED_PIN, HIGH); // Solid ON for connected
    return true;
  } else {
    Serial.println("\nWiFi connection failed.");
    if (enableConfigMode) {
      startConfigMode();
    }
    digitalWrite(STATUS_LED_PIN, LOW); // OFF for failed connection
    return false;
  }
}

/**
 * @brief Checks for firmware updates from the server and installs them if available.
 */
void checkFirmwareUpdate() {
    if (WiFi.status() != WL_CONNECTED) return;

    preferences.begin("wifi-creds", true);
    String apiKey = preferences.getString("apiKey", "");
    String otaUrl = preferences.getString("otaUrl", "");
    preferences.end();

    Serial.println("Checking for firmware updates...");
    WiFiClientSecure client;
    client.setCACert(root_ca);
    
    if (otaUrl == "") { Serial.println("OTA URL not configured. Skipping update check."); return; }
    // httpUpdate.update() automatically sends the current version in 'x-ESP32-version' header
    // We add the API key as a header for better security than a query parameter.
    httpUpdate.setAuthorization(apiKey.c_str());
    t_httpUpdate_return ret = httpUpdate.update(client, otaUrl, FW_VERSION);

    switch (ret) {
        case HTTP_UPDATE_FAILED:
            Serial.printf("OTA Update Failed. Error (%d): %s\n", httpUpdate.getLastError(), httpUpdate.getLastErrorString().c_str());
            break;
        case HTTP_UPDATE_NO_UPDATES:
            Serial.println("No firmware updates available.");
            break;
        case HTTP_UPDATE_OK:
            Serial.println("OTA Update complete. Rebooting...");
            break;
    }
}

/**
 * @brief Reads incoming GPS serial data and updates global coordinates. NON-BLOCKING.
 */
void updateGPSData() {
    // Process all available characters from the GPS module
    while (GPS_Serial.available()) {
        char c = GPS_Serial.read();
        gps.encode(c);
        // Serial.write(c); // Uncomment this line to see raw GPS data if you suspect wiring issues
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
bool checkObstacle() {
    int distance = sonar.ping_cm(); 

    // Debug: Print distance every 500ms to verify sensor is working
    static unsigned long lastDebugTime = 0;
    if (millis() - lastDebugTime > 500) {
        Serial.printf("[SENSOR] Distance: %d cm, Cooldown: %ld ms\n", distance, currentBeepCooldown);
        lastDebugTime = millis();
    }

    if (distance > 0 && distance < MAX_OBSTACLE_DIST_CM) {
        // Obstacle is detected. Calculate how fast to beep.
        // Constrain the distance to our mapping range to prevent weird map() results
        int constrainedDist = constrain(distance, MIN_OBSTACLE_DIST_CM, MAX_OBSTACLE_DIST_CM);
        
        // Map the distance to a cooldown period. Closer distance = shorter cooldown.
        currentBeepCooldown = map(constrainedDist, MIN_OBSTACLE_DIST_CM, MAX_OBSTACLE_DIST_CM, FAST_BEEP_COOLDOWN_MS, SLOW_BEEP_COOLDOWN_MS);

        // If the buzzer is idle AND the dynamic cooldown period has passed, start the double-beep sequence
        if (buzzerState == BUZZER_IDLE && (millis() - lastBeepFinishTime > currentBeepCooldown)) {
            buzzerState = BUZZER_OBSTACLE_BEEP_1;
            buzzerStateStartTime = millis();
            tone(BUZZER_PIN, BEEP_FREQUENCY);
        }
        return true;
    }

    // No obstacle in range, reset cooldown to default
    currentBeepCooldown = SLOW_BEEP_COOLDOWN_MS;
    return false;
}

/**
 * @brief Reads one ADC sample for the battery level. NON-BLOCKING.
 * This should be called in every loop() iteration.
 */
void updateBatterySample() {
    batterySamples[batterySampleIndex] = analogRead(BATTERY_PIN);
    batterySampleIndex++;
    if (batterySampleIndex >= BATTERY_SAMPLE_COUNT) {
        batterySampleIndex = 0;
        if (!batterySamplesReady) {
            batterySamplesReady = true; // Buffer is now full for the first time
        }
    }
}

/**
 * @brief Calculates battery level from collected samples and converts to percentage. NON-BLOCKING.
 */
int getBatteryLevel() {
    // If we don't have a full buffer of samples yet, return the last known value or a default.
    if (!batterySamplesReady) {
        return (lastCalculatedBatteryLevel != -1) ? lastCalculatedBatteryLevel : 100; // Default to 100% on first run
    }

    // Calculate the average from the sample buffer
    long sum = 0;
    for (int i = 0; i < BATTERY_SAMPLE_COUNT; i++) {
        sum += batterySamples[i];
    }
    int raw = sum / BATTERY_SAMPLE_COUNT;
    
    // Calculate Voltage: (ADC / 4095) * 3.3V_Ref * 2 (Voltage Divider Factor)
    float voltage = (raw / 4095.0) * 3.3 * 2.0 * BATTERY_CALIBRATION_FACTOR;
    
    // Debugging: Print voltage to Serial to help with calibration
    Serial.printf("Battery: Raw=%d, Voltage=%.2fV\n", raw, voltage);
    
    // --- METHOD 1: Simple Linear Mapping (Good for general estimation) ---
    // Maps Li-ion voltage range (approx 3.0V empty to 4.2V full) to 0-100%
    int percentage = (int)((voltage - 3.0) / (4.2 - 3.0) * 100);
    
    /*
    // --- METHOD 2: More Accurate Multi-Point Mapping (Advanced) ---
    // This provides a more accurate percentage based on a typical Li-ion discharge curve.
    // Uncomment this block and comment out Method 1 for higher accuracy.
    int percentage;
    if (voltage >= 4.2) percentage = 100;
    else if (voltage > 4.1) percentage = map(voltage * 100, 410, 420, 90, 100);
    else if (voltage > 3.95) percentage = map(voltage * 100, 395, 410, 75, 90);
    else if (voltage > 3.8) percentage = map(voltage * 100, 380, 395, 55, 75);
    else if (voltage > 3.7) percentage = map(voltage * 100, 370, 380, 20, 55);
    else if (voltage > 3.5) percentage = map(voltage * 100, 350, 370, 5, 20);
    else if (voltage > 3.0) percentage = map(voltage * 100, 300, 350, 0, 5);
    else percentage = 0;
    */

    if (percentage > 100) percentage = 100;
    if (percentage < 0) percentage = 0;

    lastCalculatedBatteryLevel = percentage; // Store the new value
    return percentage;
}

/**
 * @brief Sends the data payload using SIM800L GPRS (Cellular Failover).
 */
bool sendDataGPRS(String payload) {
    Serial.println("Starting GPRS transmission sequence...");

    // Load credentials from storage
    preferences.begin("wifi-creds", true);
    String apiKey = preferences.getString("apiKey", "");
    String apiUrl = preferences.getString("apiUrl", "");
    preferences.end();

    if (apiUrl == "") { Serial.println("GPRS: API URL not configured. Aborting."); return false; }

    // 1. Basic modem check
    if (!sendATCommand("AT", "OK", 1000)) return false; 

    // 2. Network Registration Check (1 = Home network, 5 = Roaming)
    if (!sendATCommand("AT+CREG?", "+CREG: 0,1", 10000, "+CREG: 0,5")) {
        Serial.println("GPRS: Failed to register on the network.");
        return false;
    }
    Serial.println("GPRS: Registered to network.");

    // 3. Configure GPRS APN
    String apnCommand = "AT+CSTT=\"" + String(APN) + "\",\"" + String(APN_USER) + "\",\"" + String(APN_PASS) + "\"";
    if (!sendATCommand(apnCommand.c_str(), "OK", 5000)) return false;

    // 4. Bring up Wireless Connection (Start GPRS)
    if (!sendATCommand("AT+CIICR", "OK", 5000)) return false;

    // 5. Get Local IP Address (Check for a character in an IP)
    if (!sendATCommand("AT+CIFSR", ".", 10000)) return false; 

    // 6. Initialize HTTP service
    if (!sendATCommand("AT+HTTPINIT", "OK", 5000)) return false;

    // 7. Set HTTP Parameters (URL)
    String urlCommand = "AT+HTTPPARA=\"URL\",\"" + apiUrl + "\"";
    if (!sendATCommand(urlCommand.c_str(), "OK", 5000)) return false;

    // Enable HTTPS if the URL uses it (Render requires HTTPS)
    if (apiUrl.startsWith("https")) {
        sendATCommand("AT+HTTPSSL=1", "OK", 5000);
    }

    // 8. Set Content Type (JSON)
    if (!sendATCommand("AT+HTTPPARA=\"CONTENT\",\"application/json\"", "OK", 5000)) return false;
    
    // Set API Key Header (Custom Header for GPRS)
    String headerCommand = "AT+HTTPPARA=\"USERDATA\",\"x-api-key: " + apiKey + "\"";
    if (!sendATCommand(headerCommand.c_str(), "OK", 5000)) return false;

    // 9. Send Data Header
    String dataCommand = "AT+HTTPDATA=" + String(payload.length()) + ",5000"; 
    if (!sendATCommand(dataCommand.c_str(), "DOWNLOAD", 10000)) return false;

    // 10. Send the actual payload data
    SIM_Serial.print(payload);
    if (!sendATCommand("", "OK", 10000)) return false; 

    // 11. Execute HTTP POST method (1 = POST)
    if (!sendATCommand("AT+HTTPACTION=1", "OK", 10000)) return false; 

    // 12. Wait for HTTP Action Status (URC)
    // The modem sends +HTTPACTION: 1,STATUS,LEN asynchronously
    bool statusReceived = false;
    unsigned long waitStart = millis();
    String urc = "";
    while (millis() - waitStart < 15000) {
        if (SIM_Serial.available()) {
            urc += (char)SIM_Serial.read();
            if (urc.indexOf("+HTTPACTION: 1,2") != -1) { // Matches 200, 201, etc.
                statusReceived = true;
                break;
            }
        }
    }

    if (!statusReceived) {
        Serial.println("GPRS POST FAILED or timed out (No 2xx status).");
        sendATCommand("AT+HTTPTERM", "OK", 5000); // Terminate regardless of success/failure
        return false;
    }
    
    // If successful, read the response body for a command
    if (sendATCommand("AT+HTTPREAD", "+HTTPREAD:", 10000)) {
        String responseBody = "";
        unsigned long readStart = millis();
        while (millis() - readStart < 5000 && !responseBody.endsWith("\nOK\r\n")) {
            if (SIM_Serial.available()) {
                responseBody += (char)SIM_Serial.read();
            }
        }
        Serial.printf("[GPRS] Response: %s\n", responseBody.c_str());
        if (responseBody.indexOf("\"command\":\"clear_emergency\"") != -1) {
            Serial.println("[COMMAND] Received 'clear_emergency' command via GPRS. Resetting emergency state.");
            isEmergency = false;
        }
    }

    // 13. Terminate HTTP service
    sendATCommand("AT+HTTPTERM", "OK", 5000);

    Serial.println("GPRS Transmission COMPLETE.");
    return true;
}

/**
 * @brief Main function to prepare and send data, prioritizing Wi-Fi.
 */
void sendData() {
    if (currentLatitude == 0.0 && currentLongitude == 0.0) {
        Serial.println("Warning: Skipping transmission, no valid GPS lock yet.");
        
        // Diagnostic: Check if we are receiving ANY data from the GPS
        if (gps.charsProcessed() < 10) {
            Serial.println("   [ERROR] No data received from GPS. Check wiring!");
            Serial.println("   [CHECK] GPS TX pin ---> ESP32 GPIO 16");
        } else {
            Serial.printf("   [INFO] Receiving GPS data (Chars: %lu), but no fix parsed yet.\n", gps.charsProcessed());
        }
        return;
    }

    // --- 1. Load credentials from storage ---
    preferences.begin("wifi-creds", true);
    String stickId = preferences.getString("stickId", "");
    String apiKey = preferences.getString("apiKey", "");
    String apiUrl = preferences.getString("apiUrl", "");
    preferences.end();

    if (stickId == "" || apiKey == "" || apiUrl == "") { Serial.println("Configuration missing (StickID/Key/URL). Skipping transmission."); return; }

    // --- 2. Prepare JSON Payload ---
    String jsonPayload = "{";
    jsonPayload += "\"stickId\":\"" + stickId + "\",";
    jsonPayload += "\"latitude\":" + String(currentLatitude, 6) + ",";
    jsonPayload += "\"longitude\":" + String(currentLongitude, 6) + ",";
    jsonPayload += String("\"obstacleDetected\":") + (isObstacle ? "true" : "false") + ",";
    jsonPayload += String("\"emergency\":") + (isEmergency ? "true" : "false") + ",";
    jsonPayload += String("\"isCharging\":") + (digitalRead(USB_DETECT_PIN) ? "true" : "false") + ",";
    jsonPayload += "\"uptime\":" + String(millis()) + ",";
    jsonPayload += "\"batteryLevel\":" + String(getBatteryLevel());

    // --- 3. Attempt Wi-Fi Transmission ---
    bool wifi_success = false;
    if (WiFi.status() == WL_CONNECTED) {
        WiFiClientSecure client;
        client.setCACert(root_ca); // Verify the server certificate
        // client.setInsecure(); // Disabling SSL is not recommended for production
        HTTPClient http;
        http.begin(client, apiUrl);
        http.addHeader("Content-Type", "application/json");
        http.addHeader("x-api-key", apiKey);

        Serial.println("Attempting Wi-Fi transmission...");
        int httpCode = http.POST(jsonPayload + ",\"connectionType\":\"WiFi\"}");
        
        // Only consider 2xx status codes as success (e.g., 200 OK, 201 Created)
        if (httpCode >= 200 && httpCode < 300) {
            Serial.printf("[HTTP] POST success, code: %d\n", httpCode);
            wifi_success = true;

            // Check response for a command from the server
            String responseBody = http.getString();
            Serial.printf("[HTTP] Response: %s\n", responseBody.c_str());
            if (responseBody.indexOf("\"command\":\"clear_emergency\"") != -1) {
                Serial.println("[COMMAND] Received 'clear_emergency' command. Resetting emergency state.");
                isEmergency = false;
            }
        } else {
            if (httpCode > 0) {
                Serial.printf("[HTTP] POST failed, server responded with code: %d\n", httpCode);
                if (httpCode == 404) Serial.println("   -> [ERROR] URL Not Found. Check 'API_URL' matches your backend route!");
                if (httpCode == 401 || httpCode == 403) Serial.println("   -> [ERROR] Authentication Failed. Check 'API_KEY'!");
                if (httpCode >= 500) Serial.println("   -> [ERROR] Server Error. Check backend logs.");
            } else {
                Serial.printf("[HTTP] POST failed, connection error: %s\n", http.errorToString(httpCode).c_str());
            }
        }
        http.end();
    } 
    
    // --- 4. Cellular Failover ---
    if (!wifi_success) {
        Serial.println("Wi-Fi failed/disconnected. Initiating Cellular GPRS Failover...");
        
        if (sendDataGPRS(jsonPayload + ",\"connectionType\":\"Cellular\"}")) {
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

    // Check SIM800L connection immediately at boot
    Serial.println("Checking SIM800L module...");
    SIM_Serial.println("AT"); delay(100); // Wake up / Auto-baud
    if (!sendATCommand("AT", "OK", 2000)) {
        Serial.println("WARNING: SIM800L not responding. Check wiring (TX/RX) and Power!");
    }

    // Initialize buzzer and ultrasonic pins
    pinMode(BUZZER_PIN, OUTPUT);
    pinMode(ULTRASONIC_TRIG_PIN, OUTPUT);
    pinMode(ULTRASONIC_ECHO_PIN, INPUT);
    pinMode(BATTERY_PIN, INPUT);
    pinMode(STATUS_LED_PIN, OUTPUT);
    pinMode(EMERGENCY_BTN_PIN, INPUT_PULLUP); // Enable internal pull-up resistor
    pinMode(USB_DETECT_PIN, INPUT); // Initialize USB detection pin
    pinMode(POWER_BTN_PIN, INPUT_PULLUP); // Power button with internal pull-up
    
    // Initialize battery sample buffer
    for (int i = 0; i < BATTERY_SAMPLE_COUNT; i++) {
        batterySamples[i] = 0;
    }

    // Attach interrupt to the button pin, trigger on FALLING edge (HIGH to LOW)
    attachInterrupt(digitalPinToInterrupt(EMERGENCY_BTN_PIN), handleButtonInterrupt, FALLING);

    // Configure Wake-up Source for Power Button (Wake up when GPIO 33 is LOW)
    esp_sleep_enable_ext0_wakeup((gpio_num_t)POWER_BTN_PIN, 0);

    // If we just woke up from sleep, wait for the button to be released 
    // to prevent immediately triggering the "Turn Off" logic in the loop.
    if (esp_sleep_get_wakeup_cause() == ESP_SLEEP_WAKEUP_EXT0) {
        while(digitalRead(POWER_BTN_PIN) == LOW) { delay(10); }
    }

    // Initial Wi-Fi connection attempt
    if (connectWiFi(true)) {
        // Synchronize time for SSL certificate validation
        syncTime();
        // Check for updates on boot
        checkFirmwareUpdate();
    }
}

void loop() {
    unsigned long currentMillis = millis();

    // D0. Power Button Check (Long Press to Sleep/Off)
    // Moved to top of loop to ensure it works even in config mode or when disconnected
    if (digitalRead(POWER_BTN_PIN) == LOW) {
        // Button is pressed, start counting if not already
        if (powerBtnTimer == 0) {
            powerBtnTimer = millis();
            Serial.println("Power button pressed..."); 
        }
        
        // If held for more than 3 seconds, go to sleep
        if (millis() - powerBtnTimer > 3000) {
            Serial.println("Power Button Held. Entering Deep Sleep...");
            // Visual/Audio feedback before sleep
            tone(BUZZER_PIN, 500, 500); 
            digitalWrite(STATUS_LED_PIN, LOW);
            delay(1000); // Wait for beep to finish
            
            esp_deep_sleep_start(); // Enter Deep Sleep (OFF)
        }
    } else {
        powerBtnTimer = 0; // Reset timer if button released
    }

    // If in config mode, only handle web server requests
    if (configMode) {
        dnsServer.processNextRequest();
        server.handleClient();
        return; // Skip all other logic
    }

    // A. Connectivity Maintenance (Non-Blocking)
    if (WiFi.status() != WL_CONNECTED) {
        digitalWrite(STATUS_LED_PIN, LOW); // Turn LED off if disconnected
        if (currentMillis - lastWifiReconnectAttempt >= WIFI_RECONNECT_INTERVAL_MS) {
            lastWifiReconnectAttempt = currentMillis;
            if (connectWiFi(false)) {
                syncTime(); // Re-sync time on reconnect
            }
        }
    } else {
        digitalWrite(STATUS_LED_PIN, HIGH); // Solid ON when connected
    }
    
    // B. Continuous Sensor Reading (Non-Blocking)
    updateGPSData();
    isObstacle = checkObstacle();
    updateBatterySample();
    
    // C. Non-blocking Buzzer Control (Double Beep State Machine)
    switch (buzzerState) {
        // --- Obstacle Pattern (High Pitch Double Beep) ---
        case BUZZER_OBSTACLE_BEEP_1:
            if (currentMillis - buzzerStateStartTime >= BEEP_1_DURATION_MS) {
                noTone(BUZZER_PIN);
                buzzerState = BUZZER_OBSTACLE_PAUSE_1;
                buzzerStateStartTime = currentMillis;
            }
            break;
        case BUZZER_OBSTACLE_PAUSE_1:
            if (currentMillis - buzzerStateStartTime >= PAUSE_1_DURATION_MS) {
                tone(BUZZER_PIN, BEEP_FREQUENCY);
                buzzerState = BUZZER_OBSTACLE_BEEP_2;
                buzzerStateStartTime = currentMillis;
            }
            break;
        case BUZZER_OBSTACLE_BEEP_2:
            if (currentMillis - buzzerStateStartTime >= BEEP_2_DURATION_MS) {
                noTone(BUZZER_PIN);
                buzzerState = BUZZER_IDLE; 
                lastBeepFinishTime = currentMillis; // Mark when the double-beep sequence finished for cooldown
            }
            break;

        // --- Low Battery Pattern (Low Pitch Triple Beep) ---
        case BUZZER_BATTERY_BEEP_1:
            if (currentMillis - buzzerStateStartTime >= BATTERY_BEEP_DURATION) {
                noTone(BUZZER_PIN);
                buzzerState = BUZZER_BATTERY_PAUSE_1;
                buzzerStateStartTime = currentMillis;
            }
            break;
        case BUZZER_BATTERY_PAUSE_1:
             if (currentMillis - buzzerStateStartTime >= BATTERY_PAUSE_DURATION) {
                tone(BUZZER_PIN, BATTERY_BEEP_FREQ);
                buzzerState = BUZZER_BATTERY_BEEP_2;
                buzzerStateStartTime = currentMillis;
            }
            break;
        case BUZZER_BATTERY_BEEP_2:
            if (currentMillis - buzzerStateStartTime >= BATTERY_BEEP_DURATION) {
                noTone(BUZZER_PIN);
                buzzerState = BUZZER_BATTERY_PAUSE_2;
                buzzerStateStartTime = currentMillis;
            }
            break;
        case BUZZER_BATTERY_PAUSE_2:
             if (currentMillis - buzzerStateStartTime >= BATTERY_PAUSE_DURATION) {
                tone(BUZZER_PIN, BATTERY_BEEP_FREQ);
                buzzerState = BUZZER_BATTERY_BEEP_3;
                buzzerStateStartTime = currentMillis;
            }
            break;
        case BUZZER_BATTERY_BEEP_3:
            if (currentMillis - buzzerStateStartTime >= BATTERY_BEEP_DURATION) {
                noTone(BUZZER_PIN);
                buzzerState = BUZZER_IDLE;
            }
            break;

        case BUZZER_IDLE:
            // Check for Low Battery Trigger (Only if idle)
            int batLevel = getBatteryLevel();
            // Ensure we have valid readings (not -1) and it's low
            if (batLevel != -1 && batLevel <= LOW_BATTERY_THRESHOLD) {
                 if (currentMillis - lastLowBatteryWarningTime >= LOW_BATTERY_WARNING_INTERVAL) {
                     buzzerState = BUZZER_BATTERY_BEEP_1;
                     buzzerStateStartTime = currentMillis;
                     tone(BUZZER_PIN, BATTERY_BEEP_FREQ);
                     lastLowBatteryWarningTime = currentMillis;
                 }
            }
            break;
    }

    // D. Interrupt-driven Emergency Button Check
    if (buttonPressedFlag) {
        buttonPressedFlag = false; // Reset the flag immediately
        if (millis() - lastSpamTime > spamDelay) {
            Serial.println("EMERGENCY BUTTON INTERRUPT DETECTED!");
            isEmergency = true;
            // The emergency flag is now persistent. It will be sent with every
            // subsequent data transmission until the device is reset.
            sendData(); // Trigger an immediate transmission with the emergency flag set.
            lastSpamTime = millis(); // Reset spam timer
        }
    }

    // E. Timed Data Transmission
    // Check if the set interval has passed (10 seconds)
    if (currentMillis - previousMillis >= TRANSMIT_INTERVAL_MS) {
        previousMillis = currentMillis; // Reset the timer
        
        sendData(); 
    }
}