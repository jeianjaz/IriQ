/*
 * IriQ Smart Irrigation System - Heartbeat Module
 * 
 * This module handles device heartbeat functionality.
 */

#include "supabase_api.h"
#include "auth.h"
#include <HTTPClient.h>
#include <ArduinoJson.h>

// External variables
extern const char* supabaseUrl;
extern const char* supabaseKey;
extern String deviceId;

// Send heartbeat to Supabase to indicate device is online
bool sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Cannot send heartbeat: WiFi not connected");
    return false;
  }
  
  // Ensure we have a valid authentication token
  if (!isAuthenticated()) {
    Serial.println("Cannot send heartbeat: Authentication failed");
    return false;
  }
  
  Serial.println("Sending heartbeat to Supabase...");
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["device_id"] = deviceId;
  doc["timestamp"] = getISOTime();
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  // Send HTTP POST request to Supabase
  HTTPClient http;
  http.begin(String(supabaseUrl) + "/rest/v1/device_heartbeats");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + getAuthToken());
  http.addHeader("Prefer", "resolution=merge-duplicates");
  
  int httpResponseCode = http.POST(jsonPayload);
  bool success = false;
  
  if (httpResponseCode >= 200 && httpResponseCode < 300) {
    Serial.println("Heartbeat sent successfully. HTTP Response code: " + String(httpResponseCode));
    success = true;
  } else if (httpResponseCode == 401 || httpResponseCode == 403) {
    // Authentication error - try to refresh token
    Serial.println("Authentication error. Clearing token and will retry next time.");
    clearAuth();
  } else {
    Serial.println("Error sending heartbeat. HTTP Response code: " + String(httpResponseCode));
  }
  
  http.end();
  return success;
}
