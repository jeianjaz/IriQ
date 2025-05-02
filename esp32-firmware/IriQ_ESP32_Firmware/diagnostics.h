#ifndef DIAGNOSTICS_H
#define DIAGNOSTICS_H

#include <Arduino.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "config.h"
#include "auth.h"

// External variables from main file
extern const char* supabaseUrl;
extern const char* supabaseKey;
extern String deviceId;

// Function to check if a table exists and has the expected structure
bool checkTableStructure(const char* tableName) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Cannot check table structure: WiFi not connected");
    return false;
  }
  
  // Ensure we have a valid authentication token
  if (!isAuthenticated()) {
    Serial.println("Cannot check table structure: Authentication failed");
    return false;
  }
  
  Serial.print("Checking table structure for ");
  Serial.print(tableName);
  Serial.println("...");
  
  // Send HTTP GET request to Supabase
  HTTPClient http;
  String url = String(supabaseUrl) + "/rest/v1/" + tableName + "?limit=1";
  http.begin(url);
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + getAuthToken());
  
  int httpResponseCode = http.GET();
  bool success = false;
  
  if (httpResponseCode >= 200 && httpResponseCode < 300) {
    String response = http.getString();
    Serial.print("Table ");
    Serial.print(tableName);
    Serial.println(" exists and is accessible");
    Serial.print("Response: ");
    Serial.println(response);
    success = true;
  } else if (httpResponseCode == 401 || httpResponseCode == 403) {
    Serial.print("Authentication error accessing table ");
    Serial.println(tableName);
  } else if (httpResponseCode == 404) {
    Serial.print("Table ");
    Serial.print(tableName);
    Serial.println(" does not exist");
  } else {
    Serial.print("Error checking table ");
    Serial.print(tableName);
    Serial.print(". HTTP Response code: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
  return success;
}

// Function to run all diagnostics
void runDiagnostics() {
  Serial.println("\n\n==== RUNNING DIAGNOSTICS ====\n");
  
  // Check WiFi connection
  Serial.print("WiFi Status: ");
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("Connected");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("Disconnected");
  }
  
  // Check authentication
  Serial.print("Authentication Status: ");
  if (isAuthenticated()) {
    Serial.println("Authenticated");
  } else {
    Serial.println("Not authenticated");
  }
  
  // Check table structures
  Serial.println("\nChecking Supabase tables:");
  checkTableStructure("device_heartbeats");
  checkTableStructure("sensor_readings");
  checkTableStructure("device_status");
  checkTableStructure("control_commands");
  
  // Try sending a test heartbeat
  Serial.println("\nSending test heartbeat...");
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["device_id"] = deviceId;
  doc["last_seen"] = getISOTime();
  doc["status"] = "active";
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  // Send HTTP POST request to Supabase
  HTTPClient http;
  http.begin(String(supabaseUrl) + "/rest/v1/device_heartbeats");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + getAuthToken());
  http.addHeader("Prefer", "return=minimal");
  
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode >= 200 && httpResponseCode < 300) {
    String response = http.getString();
    Serial.println("Heartbeat sent successfully!");
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    Serial.print("Response: ");
    Serial.println(response);
  } else {
    Serial.print("Error sending heartbeat. HTTP Response code: ");
    Serial.println(httpResponseCode);
    Serial.print("Response: ");
    Serial.println(http.getString());
  }
  
  http.end();
  
  Serial.println("\n==== DIAGNOSTICS COMPLETE ====\n");
}

#endif // DIAGNOSTICS_H
