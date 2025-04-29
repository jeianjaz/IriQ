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

Preferences preferences;
String authToken = "";
bool isAuthenticated = false;
long tokenExpiryTime = 0; // Unix timestamp when token expires

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
      isAuthenticated = true;
      return true;
    } else {
      Serial.println("Stored token has expired, need to re-authenticate");
      clearAuth();
    }
  }
  
  return false;
}

// Authenticate with Supabase using Edge Function
bool authenticateWithSupabase() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Cannot authenticate: WiFi not connected");
    return false;
  }
  
  Serial.println("Authenticating with Supabase...");
  
  // Create authentication request payload
  DynamicJsonDocument doc(1024);
  doc["device_id"] = deviceId;
  doc["device_type"] = "ESP32";
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  // Send HTTP POST request to Supabase Edge Function
  HTTPClient http;
  String url = String(supabaseUrl) + "/functions/v1/authenticate-device";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode == 200) {
    String response = http.getString();
    
    // Parse JSON response
    DynamicJsonDocument respDoc(1024);
    DeserializationError error = deserializeJson(respDoc, response);
    
    if (!error) {
      // Extract token and expiry
      currentToken = respDoc["token"].as<String>();
      // Convert expiry from seconds to milliseconds and add to current time
      unsigned long expirySeconds = respDoc["expires_in"].as<unsigned long>();
      tokenExpiryTime = millis() + (expirySeconds * 1000);
      
      // Save token and expiry
      authPreferences.putString("token", currentToken);
      authPreferences.putULong("expiry", tokenExpiryTime);
      
      isAuthenticated = true;
      Serial.println("Authentication successful");
      return true;
    } else {
      Serial.println("Error parsing authentication response");
    }
  } else {
    Serial.println("Authentication failed. HTTP Response code: " + String(httpResponseCode));
    Serial.println("Response: " + http.getString());
  }
  
  http.end();
  return false;
}

// Check if currently authenticated
bool isAuthValid() {
  // Check if we have a token and it's not expired
  if (currentToken.length() > 0 && tokenExpiryTime > millis()) {
    return true;
  }
  
  // If token is expired, try to refresh it
  if (currentToken.length() > 0) {
    return refreshToken();
  }
  
  return false;
}

// Refresh the authentication token
bool refreshToken() {
  Serial.println("Refreshing authentication token...");
  
  // In a real implementation, we would send the refresh token
  // For simplicity, we'll just re-authenticate
  return authenticate();
}

// Get the current authentication token
String getAuthToken() {
  if (!isAuthValid()) {
    authenticate();
  }
  
  return currentToken;
}

// Clear authentication data
void clearAuth() {
  currentToken = "";
  tokenExpiryTime = 0;
  isAuthenticated = false;
  
  authPreferences.clear();
  Serial.println("Authentication data cleared");
}
