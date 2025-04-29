/*
 * IriQ Smart Irrigation System - Authentication Header
 * 
 * Header file for the authentication module.
 */

#ifndef AUTH_H
#define AUTH_H

#include <Arduino.h>
#include <WiFi.h>

// External variables that need to be defined in the main file
extern String deviceId;

// Function declarations
bool initAuth();                // Initialize authentication module
bool authenticateWithSupabase(); // Authenticate with Supabase
bool isDeviceAuthenticated();    // Check if device is authenticated
String getAuthToken();          // Get authentication token
void clearAuth();               // Clear authentication data
bool ensureValidAuth();         // Helper function to check token validity and refresh if needed

#endif // AUTH_H
