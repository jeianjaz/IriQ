/*
 * IriQ Smart Irrigation System - Supabase API Header
 * 
 * Header file for the Supabase API module.
 */

#ifndef SUPABASE_API_H
#define SUPABASE_API_H

#include <Arduino.h>
#include <WiFi.h>

// External variables that need to be defined in the main file
extern String deviceId;

// Structure to hold control command data
struct ControlCommand {
  String id;
  bool pumpControl;
  bool automaticMode;
  String userId;
  bool valid;
};

// Helper function to get ISO formatted time
String getISOTime();

// Function declarations
bool sendSensorReading(int moistureLevel);
bool updateDeviceStatus(bool pumpStatus, bool automaticMode);
bool insertDeviceStatus(bool pumpStatus, bool automaticMode);
ControlCommand checkForCommands();
bool markCommandAsExecuted(String commandId);
bool sendHeartbeat();
bool ensureValidAuth();

#endif // SUPABASE_API_H
