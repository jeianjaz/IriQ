#ifndef TEST_CONNECTION_H
#define TEST_CONNECTION_H

#include <Arduino.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "config.h"
#include "auth.h"

// External variables from main file
extern const char* supabaseUrl;
extern const char* supabaseKey;
extern String deviceId;

// Function to test direct heartbeat insertion
bool testHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Cannot test heartbeat: WiFi not connected");
    return false;
  }
  
  // Ensure we have a valid authentication token
  if (!isAuthenticated()) {
    Serial.println("Cannot test heartbeat: Authentication failed");
    return false;
  }
  
  Serial.println("TESTING HEARTBEAT INSERTION...");
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["device_id"] = deviceId;
  doc["last_seen"] = getISOTime();
  doc["status"] = "active";
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  Serial.println("Heartbeat payload:");
  Serial.println(jsonPayload);
  
  // Send HTTP POST request to Supabase
  HTTPClient http;
  String url = String(supabaseUrl) + "/rest/v1/device_heartbeats";
  Serial.print("URL: ");
  Serial.println(url);
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + getAuthToken());
  http.addHeader("Prefer", "return=minimal");
  
  int httpResponseCode = http.POST(jsonPayload);
  bool success = false;
  
  Serial.print("Heartbeat response code: ");
  Serial.println(httpResponseCode);
  
  if (httpResponseCode >= 200 && httpResponseCode < 300) {
    String response = http.getString();
    Serial.println("Heartbeat sent successfully!");
    Serial.print("Response: ");
    Serial.println(response);
    success = true;
  } else {
    Serial.print("Error sending heartbeat. Response: ");
    Serial.println(http.getString());
  }
  
  http.end();
  return success;
}

// Function to test sensor reading insertion
bool testSensorReading() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Cannot test sensor reading: WiFi not connected");
    return false;
  }
  
  // Ensure we have a valid authentication token
  if (!isAuthenticated()) {
    Serial.println("Cannot test sensor reading: Authentication failed");
    return false;
  }
  
  Serial.println("TESTING SENSOR READING INSERTION...");
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["device_id"] = deviceId;
  doc["moisture_percentage"] = 50;  // Test value
  doc["moisture_digital"] = false;  // Test value
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  Serial.println("Sensor reading payload:");
  Serial.println(jsonPayload);
  
  // Send HTTP POST request to Supabase
  HTTPClient http;
  String url = String(supabaseUrl) + "/rest/v1/sensor_readings";
  Serial.print("URL: ");
  Serial.println(url);
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + getAuthToken());
  http.addHeader("Prefer", "return=minimal");
  
  int httpResponseCode = http.POST(jsonPayload);
  bool success = false;
  
  Serial.print("Sensor reading response code: ");
  Serial.println(httpResponseCode);
  
  if (httpResponseCode >= 200 && httpResponseCode < 300) {
    String response = http.getString();
    Serial.println("Sensor reading sent successfully!");
    Serial.print("Response: ");
    Serial.println(response);
    success = true;
  } else {
    Serial.print("Error sending sensor reading. Response: ");
    Serial.println(http.getString());
  }
  
  http.end();
  return success;
}

// Function to test device status update
bool testDeviceStatus() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Cannot test device status: WiFi not connected");
    return false;
  }
  
  // Ensure we have a valid authentication token
  if (!isAuthenticated()) {
    Serial.println("Cannot test device status: Authentication failed");
    return false;
  }
  
  Serial.println("TESTING DEVICE STATUS UPDATE...");
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["device_id"] = deviceId;
  doc["pump_status"] = true;  // Test value
  doc["automatic_mode"] = true;  // Test value
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  Serial.println("Device status payload:");
  Serial.println(jsonPayload);
  
  // Send HTTP POST request to Supabase
  HTTPClient http;
  String url = String(supabaseUrl) + "/rest/v1/device_status";
  Serial.print("URL: ");
  Serial.println(url);
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + getAuthToken());
  http.addHeader("Prefer", "return=minimal");
  
  int httpResponseCode = http.POST(jsonPayload);
  bool success = false;
  
  Serial.print("Device status response code: ");
  Serial.println(httpResponseCode);
  
  if (httpResponseCode >= 200 && httpResponseCode < 300) {
    String response = http.getString();
    Serial.println("Device status updated successfully!");
    Serial.print("Response: ");
    Serial.println(response);
    success = true;
  } else {
    Serial.print("Error updating device status. Response: ");
    Serial.println(http.getString());
  }
  
  http.end();
  return success;
}

// Run all tests
void runConnectionTests() {
  Serial.println("\n\n==== RUNNING CONNECTION TESTS ====\n");
  
  bool heartbeatSuccess = testHeartbeat();
  delay(1000);
  
  bool sensorSuccess = testSensorReading();
  delay(1000);
  
  bool statusSuccess = testDeviceStatus();
  
  Serial.println("\n==== CONNECTION TEST RESULTS ====");
  Serial.print("Heartbeat Test: ");
  Serial.println(heartbeatSuccess ? "SUCCESS" : "FAILED");
  
  Serial.print("Sensor Reading Test: ");
  Serial.println(sensorSuccess ? "SUCCESS" : "FAILED");
  
  Serial.print("Device Status Test: ");
  Serial.println(statusSuccess ? "SUCCESS" : "FAILED");
  
  Serial.println("==== CONNECTION TESTS COMPLETE ====\n");
}

#endif // TEST_CONNECTION_H
