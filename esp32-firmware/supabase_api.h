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
};

// Function declarations
bool sendSensorReading(int moistureLevel, const String& timestamp);
bool updateDeviceStatus(bool pumpStatus, bool automaticMode, const String& timestamp);
bool checkForCommands(ControlCommand& command);
bool markCommandAsExecuted(const String& commandId);
bool sendHeartbeat();

#endif // SUPABASE_API_H
