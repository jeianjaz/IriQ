/*
 * IriQ Smart Irrigation System - Device Status Test Module
 * 
 * This module contains test functions to help debug device status updates.
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
bool testDeviceStatusInsert();

// Test function to check device_status table structure
bool testDeviceStatusTable() {
  Serial.println("\n[DEVICE STATUS TEST] Starting device status table test...");
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[DEVICE STATUS TEST] Cannot test: WiFi not connected");
    return false;
  }
  
  // Ensure we have a valid authentication token
  if (!isAuthenticated()) {
    Serial.println("[DEVICE STATUS TEST] Cannot test: Authentication failed");
    return false;
  }
  
  // Send HTTP GET request to check table structure
  HTTPClient http;
  String url = String(supabaseUrl) + "/rest/v1/device_status?limit=1";
  Serial.println("[DEVICE STATUS TEST] GET URL: " + url);
  http.begin(url);
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + getAuthToken());
  
  int httpResponseCode = http.GET();
  
  if (httpResponseCode >= 200 && httpResponseCode < 300) {
    String response = http.getString();
    Serial.println("[DEVICE STATUS TEST] Table structure response code: " + String(httpResponseCode));
    Serial.println("[DEVICE STATUS TEST] Table structure response: " + response);
    
    // Try a simple insert with minimal fields
    return testDeviceStatusInsert();
  } else {
    Serial.println("[DEVICE STATUS TEST] Error checking table structure. HTTP Response code: " + String(httpResponseCode));
    Serial.println("[DEVICE STATUS TEST] Response: " + http.getString());
    return false;
  }
}

// Test function to try a minimal device status insert
bool testDeviceStatusInsert() {
  Serial.println("[DEVICE STATUS TEST] Testing minimal device status insert...");
  
  // Create minimal JSON payload with required fields
  DynamicJsonDocument doc(1024);
  doc["device_id"] = deviceId;
  doc["pump_status"] = true;  // Test value
  doc["automatic_mode"] = true;  // Test value
  doc["user_id"] = "2930efc2-0327-47db-9f0b-27901d2bc272";  // Admin user ID from the table structure
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  Serial.println("[DEVICE STATUS TEST] Test payload: " + jsonPayload);
  
  // Send HTTP POST request to Supabase
  HTTPClient http;
  String url = String(supabaseUrl) + "/rest/v1/device_status";
  Serial.println("[DEVICE STATUS TEST] POST URL: " + url);
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + getAuthToken());
  http.addHeader("Prefer", "return=minimal");
  
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode >= 200 && httpResponseCode < 300) {
    Serial.println("[DEVICE STATUS TEST] Test insert successful! HTTP Response code: " + String(httpResponseCode));
    return true;
  } else {
    Serial.println("[DEVICE STATUS TEST] Test insert failed. HTTP Response code: " + String(httpResponseCode));
    Serial.println("[DEVICE STATUS TEST] Error response: " + http.getString());
    
    // Try with PATCH method
    Serial.println("[DEVICE STATUS TEST] Trying with PATCH method...");
    http.end();  // End previous connection
    
    // Use PATCH to update the existing record
    String patchUrl = String(supabaseUrl) + "/rest/v1/device_status?device_id=eq." + deviceId;
    Serial.println("[DEVICE STATUS TEST] PATCH URL: " + patchUrl);
    http.begin(patchUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", supabaseKey);
    http.addHeader("Authorization", "Bearer " + getAuthToken());
    http.addHeader("Prefer", "return=minimal");
    int httpResponseCode2 = http.PATCH(jsonPayload);
    
    if (httpResponseCode2 >= 200 && httpResponseCode2 < 300) {
      Serial.println("[DEVICE STATUS TEST] PATCH test successful! HTTP Response code: " + String(httpResponseCode2));
      return true;
    } else {
      Serial.println("[DEVICE STATUS TEST] PATCH test failed. HTTP Response code: " + String(httpResponseCode2));
      Serial.println("[DEVICE STATUS TEST] Error response: " + http.getString());
      return false;
    }
  }
}
