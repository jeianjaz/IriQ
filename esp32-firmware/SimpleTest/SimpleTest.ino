#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "JAZ 2.G";
const char* password = "jaz010204";

// Supabase configuration
const char* supabaseUrl = "https://kuybxkvgmaqqsnuzlyvy.supabase.co";
const char* supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1eWJ4a3ZnbWFxcXNudXpseXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3MjE4OTcsImV4cCI6MjA2MTI5Nzg5N30.ieiAVnotpygFOucW_INCcddE47hZKBCfUGr9y4infa4";
const String deviceId = "esp32_device_1";

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\nIriQ Simple Test - Starting up...");
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nWiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  
  // Run tests
  delay(1000);
  Serial.println("\n==== STARTING SIMPLE TESTS ====\n");
  
  // Test device_heartbeats table
  testHeartbeat();
  delay(2000);
  
  // Test sensor_readings table
  testSensorReading();
  delay(2000);
  
  // Test device_status table
  testDeviceStatus();
  
  Serial.println("\n==== TESTS COMPLETE ====");
}

void loop() {
  // Nothing to do here
  delay(10000);
}

// Test sending a heartbeat
void testHeartbeat() {
  Serial.println("TESTING HEARTBEAT TABLE...");
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["device_id"] = deviceId;
  doc["last_seen"] = getCurrentTime();
  doc["status"] = "active";
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  Serial.println("Payload: " + jsonPayload);
  
  // Send HTTP POST request to Supabase
  HTTPClient http;
  String url = String(supabaseUrl) + "/rest/v1/device_heartbeats";
  Serial.println("URL: " + url);
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", String("Bearer ") + supabaseKey);
  
  int httpResponseCode = http.POST(jsonPayload);
  
  Serial.print("Response code: ");
  Serial.println(httpResponseCode);
  
  if (httpResponseCode >= 200 && httpResponseCode < 300) {
    Serial.println("Heartbeat sent successfully!");
  } else {
    Serial.print("Error: ");
    Serial.println(http.getString());
  }
  
  http.end();
}

// Test sending a sensor reading
void testSensorReading() {
  Serial.println("TESTING SENSOR READINGS TABLE...");
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["device_id"] = deviceId;
  doc["moisture_percentage"] = 50;
  doc["moisture_digital"] = false;
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  Serial.println("Payload: " + jsonPayload);
  
  // Send HTTP POST request to Supabase
  HTTPClient http;
  String url = String(supabaseUrl) + "/rest/v1/sensor_readings";
  Serial.println("URL: " + url);
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", String("Bearer ") + supabaseKey);
  
  int httpResponseCode = http.POST(jsonPayload);
  
  Serial.print("Response code: ");
  Serial.println(httpResponseCode);
  
  if (httpResponseCode >= 200 && httpResponseCode < 300) {
    Serial.println("Sensor reading sent successfully!");
  } else {
    Serial.print("Error: ");
    Serial.println(http.getString());
  }
  
  http.end();
}

// Test updating device status
void testDeviceStatus() {
  Serial.println("TESTING DEVICE STATUS TABLE...");
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["device_id"] = deviceId;
  doc["pump_status"] = true;
  doc["automatic_mode"] = true;
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  Serial.println("Payload: " + jsonPayload);
  
  // Send HTTP POST request to Supabase
  HTTPClient http;
  String url = String(supabaseUrl) + "/rest/v1/device_status";
  Serial.println("URL: " + url);
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", String("Bearer ") + supabaseKey);
  
  int httpResponseCode = http.POST(jsonPayload);
  
  Serial.print("Response code: ");
  Serial.println(httpResponseCode);
  
  if (httpResponseCode >= 200 && httpResponseCode < 300) {
    Serial.println("Device status updated successfully!");
  } else {
    Serial.print("Error: ");
    Serial.println(http.getString());
  }
  
  http.end();
}

// Get current time as ISO string
String getCurrentTime() {
  // Since we can't get real time, just use a placeholder
  return "2025-04-30T" + String(19) + ":" + String(random(10, 59)) + ":" + String(random(10, 59)) + "Z";
}