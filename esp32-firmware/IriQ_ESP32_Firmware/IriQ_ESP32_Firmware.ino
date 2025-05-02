/*
 * IriQ Smart Irrigation System - ESP32 Firmware
 * 
 * This firmware connects the ESP32 to the Supabase backend for the IriQ Smart Irrigation Dashboard.
 * It handles:
 * - Reading moisture sensor data
 * - Controlling the irrigation pump
 * - Sending data to Supabase
 * - Receiving control commands from the dashboard
 * 
 * Security features:
 * - Encrypted communication using HTTPS
 * - JWT authentication with Supabase
 * - Secure storage of credentials
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include <Preferences.h>
#include "config.h"
#include "auth.h"
#include "supabase_api.h"
#include "sensors.h"
#include "debug_test.h"
#include "device_status_test.h"
#include "diagnostics.h"
#include "test_connection.h"

// WiFi credentials - loaded from config.h
const char* ssid = "JAZ 2.G";
const char* password = "jaz010204";

// Supabase configuration
const char* supabaseUrl = "https://kuybxkvgmaqqsnuzlyvy.supabase.co";
const char* supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1eWJ4a3ZnbWFxcXNudXpseXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3MjE4OTcsImV4cCI6MjA2MTI5Nzg5N30.ieiAVnotpygFOucW_INCcddE47hZKBCfUGr9y4infa4"; // We'll use a more secure approach later
const char* ntpServer = "pool.ntp.org";

// Device configuration
String deviceId = DEVICE_ID; // This will be linked to a user account
const int moistureSensorPin = MOISTURE_SENSOR_PIN;  // Analog pin for moisture sensor
const int pumpRelayPin = PUMP_RELAY_PIN;           // Digital pin for pump relay control
const int ledPin = LED_PIN;                        // Built-in LED for status indication

// Operational variables
bool pumpStatus = false;
bool automaticMode = true;
int moistureLevel = 0;
int moistureThreshold = MOISTURE_THRESHOLD; // Threshold for automatic irrigation (0-100, where 0 is dry)
unsigned long lastReadingTime = 0;
unsigned long lastCommandCheckTime = 0;
unsigned long lastHeartbeatTime = 0;
unsigned long lastSensorReadTime = 0;
const unsigned long readingInterval = READING_INTERVAL;        // Read sensor every 1 minute
const unsigned long commandCheckInterval = COMMAND_CHECK_INTERVAL; // Check for commands every 5 seconds
const unsigned long heartbeatInterval = 10000;    // Send heartbeat every 10 seconds (for better responsiveness)

// Authentication and security

void setup() {
  // Initialize serial communication
  Serial.begin(115200);
  delay(1000);
  
  // Add a small delay for stability
  delay(100);
  
  Serial.println();
  Serial.println();
  Serial.println("IriQ Smart Irrigation System - Starting up...");
  Serial.println("Version: 1.0.0");
  Serial.println("Build Date: " + String(__DATE__) + " " + String(__TIME__));
  Serial.println();
  
  Serial.println("Configuration:");
  Serial.println("Device ID: " + deviceId);
  Serial.println("Moisture Sensor Pin: " + String(moistureSensorPin));
  Serial.println("Pump Relay Pin: " + String(pumpRelayPin));
  Serial.println("LED Pin: " + String(ledPin));
  Serial.println("Moisture Threshold: " + String(MOISTURE_THRESHOLD));
  Serial.println();
  
  // Initialize pins
  pinMode(ledPin, OUTPUT);
  pinMode(pumpRelayPin, OUTPUT);
  digitalWrite(pumpRelayPin, LOW); // Ensure pump is off at startup
  
  // Connect to WiFi
  connectToWifi();
  
  // Sync time with NTP server
  syncTime();
  
  // Initialize authentication
  Preferences preferences;
  if (initAuth()) {
    Serial.println("Authentication initialized with stored credentials");
  } else {
    Serial.println("No stored authentication, will authenticate when needed");
    // Try to authenticate now
    if (authenticateWithSupabase()) {
      Serial.println("Successfully authenticated with Supabase");
    } else {
      Serial.println("Initial authentication failed, will retry later");
    }
  }
  
  // Initialize sensors
  initSensors();
  
  // Read initial moisture level
  moistureLevel = readMoistureSensor();
  Serial.print("Initial moisture level: ");
  Serial.print(moistureLevel);
  Serial.println("%");
  
  // Set initial pump status based on moisture level (if in automatic mode)
  if (automaticMode && moistureLevel < MOISTURE_THRESHOLD) {
    setPumpStatus(true);
  }
  
  // Update device status in Supabase
  if (updateDeviceStatus(pumpStatus, automaticMode)) {
    Serial.println("Initial device status updated in Supabase");
  } else {
    Serial.println("Failed to update initial device status");
  }
  
  // Run connection tests to verify Supabase communication
  Serial.println("\n\n==== STARTING CONNECTION TESTS ====\n");
  delay(3000);  // Give system time to stabilize
  Serial.println("Testing direct communication with Supabase...");
  
  // Run the connection tests
  runConnectionTests();
  
  // Run the original debug tests
  // Test sensor readings
  if (testSensorReadingsTable()) {
    Serial.println("\nSensor readings table test successful!\n");
  } else {
    Serial.println("\nSensor readings table test failed!\n");
  }
  
  // Test device status
  if (testDeviceStatusTable()) {
    Serial.println("\nDevice status table test successful!\n");
  } else {
    Serial.println("\nDevice status table test failed!\n");
  }
  
  Serial.println("==== DEBUG TESTS COMPLETE ====\n");
  
  // Blink LED to indicate successful setup
  blinkLED(5, 200);
  
  Serial.println("Setup complete! Starting main loop...");
}

// Global variables to track if we've run the tests
bool directTestRun = false;
bool diagnosticsRun = false;

void loop() {
  // Add a small delay to stabilize the loop
  delay(50);
  
  // Run diagnostics once after authentication
  if (!diagnosticsRun && WiFi.status() == WL_CONNECTED && isAuthenticated()) {
    Serial.println("\n\n==== RUNNING DIAGNOSTICS FROM LOOP ====\n");
    runDiagnostics();
    diagnosticsRun = true;
    Serial.println("\n==== LOOP DIAGNOSTICS COMPLETE ====\n");
    delay(2000);
  }
  
  // Run a direct test for sensor readings once
  if (!directTestRun && WiFi.status() == WL_CONNECTED && isAuthenticated()) {
    Serial.println("\n\n==== RUNNING DIRECT SENSOR READING TEST ====\n");
    // Try sending a test sensor reading
    if (sendSensorReading(50)) { // Test with value 50
      Serial.println("Direct test: Sensor reading sent successfully!");
    } else {
      Serial.println("Direct test: Failed to send sensor reading");
    }
    directTestRun = true;
    Serial.println("\n==== DIRECT TEST COMPLETE ====\n");
    delay(2000);
  }
  
  // Check WiFi connection and reconnect if needed
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi connection lost, reconnecting...");
    connectToWifi();
    
    // If reconnected, sync time again
    if (WiFi.status() == WL_CONNECTED) {
      syncTime();
    }
  }
  
  // Read moisture sensor at regular intervals
  if (millis() - lastSensorReadTime >= READING_INTERVAL) {
    // Read moisture level
    moistureLevel = readMoistureSensor();
    Serial.print("Current moisture level: ");
    Serial.print(moistureLevel);
    Serial.println("%");
    
    // Send sensor reading to Supabase
    if (sendSensorReading(moistureLevel)) {
      Serial.println("Sensor reading sent to Supabase");
    } else {
      Serial.println("Failed to send sensor reading");
    }
    
    // Handle automatic mode
    if (automaticMode) {
      handleAutomaticMode();
    }
    
    lastSensorReadTime = millis();
  }
  
  // Check for commands at regular intervals
  if (millis() - lastCommandCheckTime >= COMMAND_CHECK_INTERVAL) {
    Serial.println("\n==== Checking for control commands... ====");
    Serial.print("Current pump status: ");
    Serial.println(pumpStatus ? "ON" : "OFF");
    Serial.print("Current mode: ");
    Serial.println(automaticMode ? "AUTOMATIC" : "MANUAL");
    
    ControlCommand command = checkForCommands();
    
    if (command.valid) {
      Serial.println("Received valid command, executing...");
      Serial.print("Command pump status: ");
      Serial.println(command.pumpControl ? "ON" : "OFF");
      Serial.print("Command mode: ");
      Serial.println(command.automaticMode ? "AUTOMATIC" : "MANUAL");
      
      // Execute command
      // First handle mode changes, as they affect pump behavior
      if (command.automaticMode != automaticMode) {
        Serial.print("Changing mode from ");
        Serial.print(automaticMode ? "AUTOMATIC" : "MANUAL");
        Serial.print(" to ");
        Serial.println(command.automaticMode ? "AUTOMATIC" : "MANUAL");
        
        // Set the mode first
        setAutomaticMode(command.automaticMode);
        
        // If switching to automatic mode, immediately apply automatic logic
        if (command.automaticMode) {
          Serial.println("Applying automatic mode logic immediately");
          handleAutomaticMode();
          // Skip pump control command since automatic mode will handle it
          Serial.println("Skipping manual pump control as automatic mode is now active");
        } else {
          // If switching to manual mode, apply the requested pump status
          Serial.print("Switching to manual mode with pump ");
          Serial.println(command.pumpControl ? "ON" : "OFF");
          setPumpStatus(command.pumpControl);
        }
      } 
      // Only handle pump control commands in manual mode
      else if (!automaticMode) {
        // Always apply pump control in manual mode, even if it appears to match current status
        // This ensures the physical relay state matches the command
        Serial.print("Manual mode: Setting pump to ");
        Serial.println(command.pumpControl ? "ON" : "OFF");
        
        // Force the pump status to change with extra verification
        setPumpStatus(command.pumpControl);
        
        // Double-check that the pump status was actually applied
        delay(200); // Wait for relay to stabilize
        if (pumpStatus != command.pumpControl) {
          Serial.println("WARNING: Pump status doesn't match command! Trying again...");
          setPumpStatus(command.pumpControl); // Try again
        }
      } else if (automaticMode) {
        Serial.println("Ignoring pump control command in automatic mode");
      }
      
      // Mark command as executed
      if (markCommandAsExecuted(command.id)) {
        Serial.println("Command marked as executed");
      } else {
        Serial.println("Failed to mark command as executed");
      }
    } else {
      Serial.println("No new commands found");
    }
    
    lastCommandCheckTime = millis();
    Serial.println("==== Command check complete ====");
  }
  
  // Send heartbeat at regular intervals
  if (millis() - lastHeartbeatTime >= HEARTBEAT_INTERVAL) {
    Serial.println("Sending heartbeat...");
    
    if (sendHeartbeat()) {
      Serial.println("Heartbeat sent successfully");
    } else {
      Serial.println("Failed to send heartbeat, updating device status instead");
      updateDeviceStatus(pumpStatus, automaticMode);
    }
    
    lastHeartbeatTime = millis();
  }
  
  // Small delay to prevent excessive CPU usage
  delay(100);
}

// Connect to WiFi network
void connectToWifi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  
  // Wait for connection with timeout
  int timeout = 0;
  while (WiFi.status() != WL_CONNECTED && timeout < 20) {
    delay(500);
    Serial.print(".");
    timeout++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    
    // Blink LED to indicate successful connection
    blinkLED(3, 100);
  } else {
    Serial.println("\nFailed to connect to WiFi. Will retry later.");
  }
}

// Sync time with NTP server
void syncTime() {
  Serial.println("Syncing time with NTP server...");
  
  // Configure NTP server with multiple servers for reliability
  configTime(0, 0, "pool.ntp.org", "time.nist.gov", "time.google.com");
  
  // Wait for time to be set
  time_t now = 0;
  struct tm timeinfo = { 0 };
  int retry = 0;
  const int retry_count = 15;  // Increase retry count
  
  while (timeinfo.tm_year < (2020 - 1900) && ++retry < retry_count) {
    Serial.print(".");
    delay(1000);
    time(&now);
    localtime_r(&now, &timeinfo);
  }
  
  Serial.println();
  
  if (timeinfo.tm_year >= (2020 - 1900)) {
    Serial.println("Time synchronized!");
    Serial.print("Current time: ");
    Serial.println(getISOTime());
  } else {
    Serial.println("Failed to sync time. Will use millis() as fallback.");
  }
}

// Blink LED a specified number of times
void blinkLED(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(ledPin, HIGH);
    delay(delayMs);
    digitalWrite(ledPin, LOW);
    delay(delayMs);
  }
}

// Handle automatic mode logic
void handleAutomaticMode() {
  Serial.print("Automatic mode: Current moisture level: ");
  Serial.print(moistureLevel);
  Serial.print("%, Threshold: ");
  Serial.print(MOISTURE_THRESHOLD);
  Serial.print("%, Pump status: ");
  Serial.println(pumpStatus ? "ON" : "OFF");
  
  if (moistureLevel < MOISTURE_THRESHOLD && !pumpStatus) {
    // Soil is too dry and pump is off, turn it on
    setPumpStatus(true);
    Serial.println("Automatic mode: Soil too dry, turning pump ON");
  } else if (moistureLevel >= MOISTURE_THRESHOLD && pumpStatus) {
    // Soil is wet enough and pump is on, turn it off
    setPumpStatus(false);
    Serial.println("Automatic mode: Soil wet enough, turning pump OFF");
  } else if (moistureLevel >= MOISTURE_THRESHOLD) {
    // Force pump off if moisture is above threshold, regardless of current state
    // This ensures the pump is always off when moisture is sufficient
    if (pumpStatus) {
      setPumpStatus(false);
      Serial.println("Automatic mode: Forcing pump OFF as moisture is sufficient");
    }
  }
}



