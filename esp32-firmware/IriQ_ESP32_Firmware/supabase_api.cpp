/*
 * IriQ Smart Irrigation System - Supabase API Module
 * 
 * This module handles all API calls to the Supabase backend.
 * It implements secure communication and data validation.
 */

#include "supabase_api.h"
#include "config.h"
#include "auth.h"
#include <HTTPClient.h>
#include <ArduinoJson.h>

// External variables from main file
extern const char* supabaseUrl;
extern const char* supabaseKey;

// Get ISO formatted time string
String getISOTime() {
  struct tm timeinfo;
  if(!getLocalTime(&timeinfo)){
    Serial.println("Failed to obtain time");
    return String("2025-04-28T00:00:00Z"); // Fallback time if NTP fails
  }
  char timeStringBuff[30];
  strftime(timeStringBuff, sizeof(timeStringBuff), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(timeStringBuff);
}

// Ensure we have a valid authentication token
bool ensureValidAuth() {
  if (!isAuthenticated()) {
    Serial.println("Authentication required, attempting to authenticate...");
    return authenticateWithSupabase();
  }
  return true;
}

// Send sensor reading to Supabase
bool sendSensorReading(int moistureLevel) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Cannot send sensor reading: WiFi not connected");
    return false;
  }
  
  // Ensure we have a valid authentication token
  if (!ensureValidAuth()) {
    Serial.println("Cannot send sensor reading: Authentication failed");
    return false;
  }
  
  Serial.println("Sending moisture reading to Supabase...");
  
  // Create JSON payload - using the correct column names from Supabase schema
  DynamicJsonDocument doc(1024);
  doc["device_id"] = deviceId;
  doc["moisture_percentage"] = moistureLevel;  // Use moisture_percentage instead of moisture_level
  doc["moisture_digital"] = (moistureLevel < MOISTURE_THRESHOLD);  // Add moisture_digital field
  // Let Supabase handle the timestamp with its default value
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  // Send HTTP POST request to Supabase
  HTTPClient http;
  http.begin(String(supabaseUrl) + "/rest/v1/sensor_readings");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + getAuthToken());
  http.addHeader("Prefer", "return=minimal");  // Add Prefer header to minimize response
  
  int httpResponseCode = http.POST(jsonPayload);
  bool success = false;
  
  if (httpResponseCode >= 200 && httpResponseCode < 300) {
    String response = http.getString();
    Serial.println("HTTP Response code: " + String(httpResponseCode));
    Serial.println("Response: " + response);
    success = true;
  } else if (httpResponseCode == 401 || httpResponseCode == 403) {
    // Authentication error - try to refresh token
    Serial.println("Authentication error. Clearing token and will retry next time.");
    clearAuth();
  } else {
    Serial.println("Error sending sensor reading. HTTP Response code: " + String(httpResponseCode));
  }
  
  http.end();
  return success;
}

// Update device status in Supabase
bool updateDeviceStatus(bool pumpStatus, bool automaticMode) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Cannot update device status: WiFi not connected");
    return false;
  }
  
  // Ensure we have a valid authentication token
  if (!ensureValidAuth()) {
    Serial.println("Cannot update device status: Authentication failed");
    return false;
  }
  
  Serial.println("Updating device status in Supabase...");
  
  // Create JSON payload - match Supabase schema exactly
  DynamicJsonDocument doc(256);
  doc["device_id"] = deviceId;
  doc["pump_status"] = pumpStatus;
  doc["automatic_mode"] = automaticMode;
  doc["user_id"] = "2930efc2-0327-47db-9f0b-27901d2bc272";  // Admin user ID from the table structure
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  Serial.print("Device status payload: ");
  Serial.println(jsonPayload);
  
  // First try to update the existing record
  HTTPClient http;
  String patchUrl = String(supabaseUrl) + "/rest/v1/device_status?device_id=eq." + deviceId;
  http.begin(patchUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + getAuthToken());
  http.addHeader("Prefer", "return=minimal");
  
  // Set timeout to prevent hanging
  http.setTimeout(5000);
  
  int httpResponseCode = http.PATCH(jsonPayload);
  bool success = false;
  
  if (httpResponseCode >= 200 && httpResponseCode < 300) {
    String response = http.getString();
    Serial.println("HTTP Response code: " + String(httpResponseCode));
    Serial.println("Response: " + response);
    success = true;
    http.end();
    return true;
  } else if (httpResponseCode == 401 || httpResponseCode == 403) {
    // Authentication error - try to refresh token
    Serial.println("Authentication error. Clearing token and will retry next time.");
    clearAuth();
    http.end();
    return false;
  } else {
    Serial.println("Error updating device status. HTTP Response code: " + String(httpResponseCode));
    Serial.print("Error response: ");
    Serial.println(http.getString());
    http.end();
    
    // If update fails, try to create a new record
    return insertDeviceStatus(pumpStatus, automaticMode);
  }
}

// Insert device status as fallback if update fails
bool insertDeviceStatus(bool pumpStatus, bool automaticMode) {
  Serial.println("Trying to insert device status instead of update...");
  
  HTTPClient http;
  String url = String(supabaseUrl) + "/rest/v1/device_status";
  http.begin(url);
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + getAuthToken());
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Prefer", "return=minimal");
  
  // Set timeout to prevent hanging
  http.setTimeout(5000);
  
  // Create JSON payload
  DynamicJsonDocument doc(256);
  doc["device_id"] = deviceId;
  doc["pump_status"] = pumpStatus;
  doc["automatic_mode"] = automaticMode;
  doc["user_id"] = "2930efc2-0327-47db-9f0b-27901d2bc272"; // Admin user ID
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  Serial.print("Insert device status payload: ");
  Serial.println(jsonPayload);
  
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode >= 200 && httpResponseCode < 300) {
    Serial.println("Device status insert successful!");
    http.end();
    return true;
  } else {
    Serial.print("Error inserting device status. HTTP Response code: ");
    Serial.println(httpResponseCode);
    Serial.print("Error response: ");
    Serial.println(http.getString());
    http.end();
    return false;
  }
}

// Check for control commands from Supabase
ControlCommand checkForCommands() {
  ControlCommand command;
  command.valid = false;
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Cannot check for commands: WiFi not connected");
    return command;
  }
  
  // Ensure we have a valid authentication token
  if (!ensureValidAuth()) {
    Serial.println("Cannot check for commands: Authentication failed");
    return command;
  }
  
  Serial.println("Checking for control commands...");
  
  // Send HTTP GET request to Supabase
  HTTPClient http;
  String url = String(supabaseUrl) + "/rest/v1/control_commands?device_id=eq." + deviceId + "&executed=eq.false&order=created_at.desc&limit=1";
  http.begin(url);
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + getAuthToken());
  // Add caching headers to improve performance
  http.addHeader("Cache-Control", "no-cache");
  http.addHeader("Prefer", "return=minimal");
  
  Serial.print("Command URL: ");
  Serial.println(url);
  
  // Set timeout to 5 seconds for faster response if server is slow
  http.setTimeout(5000);
  
  int httpResponseCode = http.GET();
  
  if (httpResponseCode >= 200 && httpResponseCode < 300) {
    String response = http.getString();
    Serial.println("HTTP Response code: " + String(httpResponseCode));
    Serial.print("Command response: ");
    Serial.println(response);
    
    // Parse JSON response
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, response);
    
    if (!error && doc.size() > 0) {
      // Extract command data
      JsonObject jsonCommand = doc[0];
      command.id = jsonCommand["id"].as<String>();
      command.pumpControl = jsonCommand["pump_control"].as<bool>();
      Serial.print("Found command ID: ");
      Serial.println(command.id);
      Serial.print("Pump control value: ");
      Serial.println(command.pumpControl ? "ON" : "OFF");
      command.automaticMode = jsonCommand["automatic_mode"].as<bool>();
      command.valid = true;
      
      Serial.println("Received command:");
      Serial.print("Command ID: ");
      Serial.println(command.id);
      Serial.print("Pump status: ");
      Serial.println(command.pumpControl ? "ON" : "OFF");
      Serial.print("Automatic mode: ");
      Serial.println(command.automaticMode ? "ON" : "OFF");
    } else {
      Serial.println("No new commands or error parsing JSON");
    }
  } else if (httpResponseCode == 401 || httpResponseCode == 403) {
    // Authentication error - try to refresh token
    Serial.println("Authentication error. Clearing token and will retry next time.");
    clearAuth();
  } else {
    Serial.println("Error checking for commands. HTTP Response code: " + String(httpResponseCode));
  }
  
  http.end();
  return command;
}

// Mark a command as executed in Supabase
bool markCommandAsExecuted(String commandId) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Cannot mark command as executed: WiFi not connected");
    return false;
  }
  
  // Ensure we have a valid authentication token
  if (!ensureValidAuth()) {
    Serial.println("Cannot mark command as executed: Authentication failed");
    return false;
  }
  
  Serial.println("Marking command as executed...");
  Serial.print("Command ID: ");
  Serial.println(commandId);
  
  // Create JSON payload
  DynamicJsonDocument doc(256);
  doc["executed"] = true;
  doc["executed_at"] = getISOTime();
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  Serial.print("JSON Payload: ");
  Serial.println(jsonPayload);
  
  // Send HTTP PATCH request to Supabase
  HTTPClient http;
  String url = String(supabaseUrl) + "/rest/v1/control_commands?id=eq." + commandId;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + getAuthToken());
  http.addHeader("Prefer", "return=minimal");
  
  Serial.print("PATCH URL: ");
  Serial.println(url);
  
  int httpResponseCode = http.PATCH(jsonPayload);
  bool success = false;
  
  if (httpResponseCode >= 200 && httpResponseCode < 300) {
    Serial.println("Command marked as executed. HTTP Response code: " + String(httpResponseCode));
    success = true;
  } else if (httpResponseCode == 401 || httpResponseCode == 403) {
    // Authentication error - try to refresh token
    Serial.println("Authentication error. Clearing token and will retry next time.");
    clearAuth();
  } else {
    Serial.println("Error marking command as executed. HTTP Response code: " + String(httpResponseCode));
  }
  
  http.end();
  return success;
}
