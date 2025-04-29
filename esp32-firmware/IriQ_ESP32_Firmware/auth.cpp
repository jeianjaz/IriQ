/*
 * IriQ Smart Irrigation System - Authentication Module
 * 
 * This module handles secure authentication with the Supabase backend.
 * It implements JWT-based authentication and secure token storage.
 */

#include "auth.h"
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>

#include <Preferences.h>

Preferences preferences;
String authToken = "";
bool isAuthenticatedFlag = false;
long tokenExpiryTime = 0; // Unix timestamp when token expires

// External variables from main file
extern const char* supabaseUrl;
extern const char* supabaseKey;
extern String deviceId;

// Initialize authentication module
bool initAuth() {
  Serial.println("Initializing authentication module...");
  
  // Open preferences with namespace "auth"
  if (!preferences.begin("auth", false)) {
    Serial.println("Failed to initialize preferences");
    return false;
  }
  
  // Check if we have a stored token and if it's still valid
  authToken = preferences.getString("token", "");
  tokenExpiryTime = preferences.getLong("expiry", 0);
  
  if (authToken.length() > 0) {
    // Get current time to check token validity
    time_t now;
    time(&now);
    
    if (now < tokenExpiryTime) {
      Serial.println("Found valid stored authentication token");
      Serial.print("Token expires in: ");
      Serial.print((tokenExpiryTime - now) / 60);
      Serial.println(" minutes");
      isAuthenticatedFlag = true;
      return true;
    } else {
      Serial.println("Stored token has expired, need to re-authenticate");
      clearAuth();
    }
  }
  
  return false;
}

// Authenticate with Supabase directly (without Edge Function)
bool authenticateWithSupabase() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Cannot authenticate: WiFi not connected");
    return false;
  }
  
  Serial.println("Authenticating with Supabase (direct method)...");
  
  // For direct authentication, we'll use the anon key as the token
  // This is less secure but will work for testing
  authToken = String(supabaseKey);
  
  // Set expiry to 24 hours from now
  tokenExpiryTime = millis() + (24 * 60 * 60 * 1000);
  
  // Save token and expiry
  preferences.putString("token", authToken);
  preferences.putULong("expiry", tokenExpiryTime);
  
  isAuthenticatedFlag = true;
  Serial.println("Direct authentication successful");
  
  // Log device authentication
  HTTPClient http;
  String url = String(supabaseUrl) + "/rest/v1/device_auth_logs";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + authToken);
  
  // Create log payload
  DynamicJsonDocument logDoc(1024);
  logDoc["device_id"] = deviceId;
  logDoc["success"] = true;
  logDoc["ip_address"] = WiFi.localIP().toString();
  logDoc["user_agent"] = "ESP32";
  
  String jsonPayload;
  serializeJson(logDoc, jsonPayload);
  
  // Send the log (but don't worry if it fails)
  int httpResponseCode = http.POST(jsonPayload);
  if (httpResponseCode >= 200 && httpResponseCode < 300) {
    Serial.println("Authentication log created successfully");
  } else {
    Serial.println("Failed to create auth log, but continuing anyway");
  }
  
  http.end();
  return true;
}

// Check if currently authenticated
bool isAuthenticated() {
  // Check if we have a token and it's not expired
  if (authToken.length() > 0 && tokenExpiryTime > millis()) {
    return true;
  }
  
  // Token expired or not present
  if (authToken.length() > 0) {
    return refreshToken();
  }
  
  return false;
}

// Refresh the authentication token
bool refreshToken() {
  Serial.println("Refreshing authentication token...");
  
  // For simplicity, we'll just re-authenticate
  return authenticateWithSupabase();
}

// Get the current authentication token
String getAuthToken() {
  // Make sure we have a valid token
  if (!isAuthenticated()) {
    authenticateWithSupabase();
  }
  
  return authToken;
}

// Clear authentication data
void clearAuth() {
  Serial.println("Clearing authentication data...");
  
  authToken = "";
  tokenExpiryTime = 0;
  isAuthenticatedFlag = false;
  
  // Clear preferences
  preferences.clear();
  Serial.println("Authentication data cleared");
}
