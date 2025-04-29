/*
 * IriQ Smart Irrigation System - Debug Test Module
 * 
 * This module contains test functions to help debug Supabase integration.
 */

#include "supabase_api.h"
#include "auth.h"
#include <HTTPClient.h>
#include <ArduinoJson.h>

// External variables
extern const char* supabaseUrl;
extern const char* supabaseKey;
extern String deviceId;

// Forward declaration
bool testSensorInsert();

// Test function to check sensor_readings table structure
bool testSensorReadingsTable() {
  Serial.println("\n[DEBUG TEST] Starting sensor readings table test...");
  
  // Give WiFi and auth some time to stabilize
  delay(2000);
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[DEBUG TEST] Cannot test: WiFi not connected");
    return false;
  }
  
  // Ensure we have a valid authentication token
  if (!isAuthenticated()) {
    Serial.println("[DEBUG TEST] Cannot test: Authentication failed");
    return false;
  }
  
  Serial.println("[DEBUG TEST] Testing sensor_readings table structure...");
  
  // Send HTTP GET request to Supabase to check table structure
  HTTPClient http;
  String url = String(supabaseUrl) + "/rest/v1/sensor_readings?limit=1";
  Serial.println("[DEBUG TEST] GET URL: " + url);
  http.begin(url);
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + getAuthToken());
  
  Serial.println("[DEBUG TEST] Sending GET request to check table structure...");
  int httpResponseCode = http.GET();
  
  if (httpResponseCode >= 200 && httpResponseCode < 300) {
    String response = http.getString();
    Serial.println("[DEBUG TEST] Table structure response code: " + String(httpResponseCode));
    Serial.println("[DEBUG TEST] Table structure response: " + response);
    
    // Try a simple insert with minimal fields
    Serial.println("[DEBUG TEST] Now trying a simple insert test...");
    testSensorInsert();
    return true;
  } else {
    Serial.println("[DEBUG TEST] Error checking table structure. HTTP Response code: " + String(httpResponseCode));
    Serial.println("[DEBUG TEST] Response: " + http.getString());
    return false;
  }
}

// Test function to try a minimal sensor reading insert
bool testSensorInsert() {
  Serial.println("[DEBUG TEST] Testing minimal sensor reading insert...");
  
  // Create minimal JSON payload with correct column names
  DynamicJsonDocument doc(1024);
  doc["device_id"] = deviceId;
  doc["moisture_percentage"] = 50.0; // Test value as float
  doc["moisture_digital"] = false; // Test value
  
  // Try different timestamp formats
  time_t now;
  time(&now);
  char timeStr[30];
  strftime(timeStr, sizeof(timeStr), "%Y-%m-%dT%H:%M:%SZ", gmtime(&now));
  doc["created_at"] = String(timeStr);
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  Serial.println("[DEBUG TEST] Test payload: " + jsonPayload);
  
  // Send HTTP POST request to Supabase
  HTTPClient http;
  String url = String(supabaseUrl) + "/rest/v1/sensor_readings";
  Serial.println("[DEBUG TEST] POST URL: " + url);
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + getAuthToken());
  http.addHeader("Prefer", "return=minimal");
  
  Serial.println("[DEBUG TEST] Sending POST request with test data...");
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode >= 200 && httpResponseCode < 300) {
    Serial.println("[DEBUG TEST] Test insert successful! HTTP Response code: " + String(httpResponseCode));
    return true;
  } else {
    Serial.println("[DEBUG TEST] Test insert failed. HTTP Response code: " + String(httpResponseCode));
    Serial.println("[DEBUG TEST] Error response: " + http.getString());
    
    // Try one more time with a simpler payload
    Serial.println("[DEBUG TEST] Trying again with simpler payload (no timestamp)...");
    DynamicJsonDocument doc2(1024);
    doc2["device_id"] = deviceId;
    doc2["moisture_percentage"] = 50.0;  // Use moisture_percentage instead of moisture_level
    
    String jsonPayload2;
    serializeJson(doc2, jsonPayload2);
    Serial.println("[DEBUG TEST] Simpler payload: " + jsonPayload2);
    
    int httpResponseCode2 = http.POST(jsonPayload2);
    if (httpResponseCode2 >= 200 && httpResponseCode2 < 300) {
      Serial.println("[DEBUG TEST] Simpler test insert successful! HTTP Response code: " + String(httpResponseCode2));
      return true;
    } else {
      Serial.println("[DEBUG TEST] Simpler test insert also failed. HTTP Response code: " + String(httpResponseCode2));
      Serial.println("[DEBUG TEST] Error response: " + http.getString());
      return false;
    }
  }
}
