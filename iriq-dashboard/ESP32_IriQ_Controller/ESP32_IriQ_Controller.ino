/*
 * IriQ Smart Irrigation System - ESP32 Controller
 * 
 * This sketch connects an ESP32 to the IriQ dashboard via Supabase.
 * It reads soil moisture data and controls a water pump based on commands
 * received from the dashboard.
 * 
 * Hardware:
 * - ESP32 development board
 * - Capacitive soil moisture sensor
 * - Relay module for pump control
 * - Optional: status LEDs
 * 
 * Connections:
 * - Soil moisture sensor analog output to GPIO 36 (ADC1_0)
 * - Soil moisture sensor digital output to GPIO 26
 * - Relay control to GPIO 27
 * - Status LED (optional) to GPIO 2
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Arduino_JSON.h>
#include <time.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Supabase configuration
const String supabaseUrl = "https://rjiofzoydiwrauvdwnyo.supabase.co";
const String supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqaW9mem95ZGl3cmF1dmR3bnlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1NzUxNjQsImV4cCI6MjA2MTE1MTE2NH0.hIm5Wo6Wf8H5Wd7z4eltWH98_QBO9-CkS-UQIDzP4WM";
const String deviceId = "ESP32_001"; // Unique ID for this device

// Pin definitions
const int moistureAnalogPin = 36;    // ADC1_0
const int moistureDigitalPin = 26;   // Digital output from moisture sensor
const int pumpRelayPin = 27;         // Relay control pin
const int statusLedPin = 2;          // Built-in LED on most ESP32 boards

// Timing variables
unsigned long lastSensorReadTime = 0;
unsigned long lastCommandCheckTime = 0;
const unsigned long sensorReadInterval = 60000;  // Read sensor every minute
const unsigned long commandCheckInterval = 5000; // Check for commands every 5 seconds

// State variables
bool pumpStatus = false;
bool automaticMode = true;
int moistureThreshold = 30;  // Percentage below which pump turns on in automatic mode

void setup() {
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(moistureDigitalPin, INPUT);
  pinMode(pumpRelayPin, OUTPUT);
  pinMode(statusLedPin, OUTPUT);
  
  // Ensure pump is off at startup
  digitalWrite(pumpRelayPin, LOW);
  
  // Connect to WiFi
  connectToWiFi();
  
  // Configure time
  configTime(0, 0, "pool.ntp.org");
  
  // Blink LED to indicate successful setup
  for (int i = 0; i < 3; i++) {
    digitalWrite(statusLedPin, HIGH);
    delay(200);
    digitalWrite(statusLedPin, LOW);
    delay(200);
  }
}

void loop() {
  // Check WiFi connection and reconnect if needed
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }
  
  // Read and send sensor data at regular intervals
  unsigned long currentMillis = millis();
  if (currentMillis - lastSensorReadTime >= sensorReadInterval) {
    lastSensorReadTime = currentMillis;
    readAndSendSensorData();
  }
  
  // Check for control commands at regular intervals
  if (currentMillis - lastCommandCheckTime >= commandCheckInterval) {
    lastCommandCheckTime = currentMillis;
    checkForCommands();
  }
  
  // Control pump based on current mode and moisture level
  controlPump();
  
  // Brief delay to prevent excessive CPU usage
  delay(100);
}

void connectToWiFi() {
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  
  // Wait for connection with timeout
  int timeout = 0;
  while (WiFi.status() != WL_CONNECTED && timeout < 20) {
    delay(500);
    Serial.print(".");
    timeout++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("");
    Serial.println("WiFi connected");
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("Failed to connect to WiFi");
  }
}

void readAndSendSensorData() {
  // Read analog moisture value
  int moistureRaw = analogRead(moistureAnalogPin);
  
  // Convert to percentage (adjust these values based on your sensor calibration)
  // Assuming 4095 is completely dry and 1000 is in water
  int moisturePercentage = map(moistureRaw, 4095, 1000, 0, 100);
  moisturePercentage = constrain(moisturePercentage, 0, 100);
  
  // Read digital moisture value (HIGH when dry, LOW when wet)
  bool moistureDigital = !digitalRead(moistureDigitalPin);
  
  Serial.print("Moisture: ");
  Serial.print(moisturePercentage);
  Serial.print("%, Digital: ");
  Serial.println(moistureDigital ? "Wet" : "Dry");
  
  // Send data to Supabase
  sendSensorData(moisturePercentage, moistureDigital);
}

void sendSensorData(int moisturePercentage, bool moistureDigital) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    // Construct the API endpoint
    String url = supabaseUrl + "/rest/v1/sensor_readings";
    
    // Prepare JSON payload
    String jsonPayload = "{";
    jsonPayload += "\"device_id\":\"" + deviceId + "\",";
    jsonPayload += "\"moisture_percentage\":" + String(moisturePercentage) + ",";
    jsonPayload += "\"moisture_digital\":" + String(moistureDigital ? "true" : "false");
    jsonPayload += "}";
    
    // Send POST request
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", supabaseKey);
    http.addHeader("Authorization", "Bearer " + supabaseKey);
    
    int httpResponseCode = http.POST(jsonPayload);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("HTTP Response code: " + String(httpResponseCode));
      Serial.println(response);
      
      // Blink LED to indicate successful data transmission
      digitalWrite(statusLedPin, HIGH);
      delay(100);
      digitalWrite(statusLedPin, LOW);
    } else {
      Serial.println("Error sending sensor data. Error code: " + String(httpResponseCode));
    }
    
    http.end();
  }
}

void checkForCommands() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    // Construct the API endpoint to get the latest unexecuted command
    String url = supabaseUrl + "/rest/v1/control_commands?device_id=eq." + deviceId + "&executed=eq.false&order=created_at.desc&limit=1";
    
    http.begin(url);
    http.addHeader("apikey", supabaseKey);
    http.addHeader("Authorization", "Bearer " + supabaseKey);
    
    int httpResponseCode = http.GET();
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Command response: " + response);
      
      // Parse JSON response
      JSONVar commandArray = JSON.parse(response);
      
      if (JSON.typeof(commandArray) == "array" && commandArray.length() > 0) {
        JSONVar command = commandArray[0];
        
        // Extract command data
        String commandId = (const char*)command["id"];
        bool newPumpControl = (bool)command["pump_control"];
        bool newAutomaticMode = (bool)command["automatic_mode"];
        
        Serial.println("New command received:");
        Serial.println("Pump control: " + String(newPumpControl ? "ON" : "OFF"));
        Serial.println("Automatic mode: " + String(newAutomaticMode ? "ON" : "OFF"));
        
        // Update local state
        pumpStatus = newPumpControl;
        automaticMode = newAutomaticMode;
        
        // Mark command as executed
        markCommandAsExecuted(commandId);
      }
    } else {
      Serial.println("Error checking commands. Error code: " + String(httpResponseCode));
    }
    
    http.end();
  }
}

void markCommandAsExecuted(String commandId) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    // Construct the API endpoint
    String url = supabaseUrl + "/rest/v1/control_commands?id=eq." + commandId;
    
    // Prepare JSON payload
    String jsonPayload = "{\"executed\":true}";
    
    // Send PATCH request
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", supabaseKey);
    http.addHeader("Authorization", "Bearer " + supabaseKey);
    http.addHeader("Prefer", "return=minimal");
    
    int httpResponseCode = http.PATCH(jsonPayload);
    
    if (httpResponseCode > 0) {
      Serial.println("Command marked as executed. HTTP Response code: " + String(httpResponseCode));
    } else {
      Serial.println("Error marking command as executed. Error code: " + String(httpResponseCode));
    }
    
    http.end();
  }
}

void controlPump() {
  if (automaticMode) {
    // In automatic mode, control pump based on moisture level
    int moistureRaw = analogRead(moistureAnalogPin);
    int moisturePercentage = map(moistureRaw, 4095, 1000, 0, 100);
    moisturePercentage = constrain(moisturePercentage, 0, 100);
    
    // Turn on pump if moisture is below threshold
    if (moisturePercentage < moistureThreshold) {
      if (!pumpStatus) {
        Serial.println("Auto mode: Turning pump ON (moisture below threshold)");
        pumpStatus = true;
      }
    } else {
      if (pumpStatus) {
        Serial.println("Auto mode: Turning pump OFF (moisture above threshold)");
        pumpStatus = false;
      }
    }
  }
  
  // Set pump relay based on pump status
  digitalWrite(pumpRelayPin, pumpStatus ? HIGH : LOW);
  
  // Update status LED - solid when pump is on, off when pump is off
  digitalWrite(statusLedPin, pumpStatus ? HIGH : LOW);
}
