/*
 * IriQ Smart Irrigation System - Sensors Module
 * 
 * This module handles all sensor readings and pump control.
 */

#include "sensors.h"
#include "config.h"
#include "supabase_api.h"
#include <Arduino.h>

// External variables
extern const int moistureSensorPin;
extern const int pumpRelayPin;
extern bool pumpStatus;
extern bool automaticMode;
extern const int ledPin;

// Initialize sensors
void initSensors() {
  pinMode(moistureSensorPin, INPUT);
  pinMode(pumpRelayPin, OUTPUT);
  pinMode(ledPin, OUTPUT);
  
  // Ensure pump is off at startup
  digitalWrite(pumpRelayPin, LOW);
  
  Serial.println("Sensors initialized");
}

// Read moisture sensor
int readMoistureSensor() {
  // Read the analog value from the moisture sensor
  int rawValue = analogRead(moistureSensorPin);
  
  // Print raw value for debugging
  Serial.print("Moisture sensor raw value: ");
  Serial.println(rawValue);
  
  // Convert to percentage (0-100, where 0 is dry and 100 is wet)
  // Note: These values need to be calibrated for your specific sensor
  // Typical values: air ~3000-4095, water ~1000-1500
  int range = 4095 - 1000;
  int moistureLevel = map(constrain(rawValue, 1000, 4095), 4095, 1000, 0, 100);
  
  Serial.print("Moisture level: ");
  Serial.print(moistureLevel);
  Serial.println("%");
  
  return moistureLevel;
}

// Set pump status
void setPumpStatus(bool status) {
  // Update the global variable
  pumpStatus = status;
  
  // Set the physical pin
  digitalWrite(pumpRelayPin, status ? HIGH : LOW);
  
  // Blink LED to indicate pump status change
  for (int i = 0; i < (status ? 2 : 1); i++) {
    digitalWrite(ledPin, HIGH);
    delay(100);
    digitalWrite(ledPin, LOW);
    delay(100);
  }
  
  Serial.print("Pump status set to: ");
  Serial.println(status ? "ON" : "OFF");
  
  // Update device status in Supabase
  updateDeviceStatus(pumpStatus, automaticMode);
}

// Set automatic mode
void setAutomaticMode(bool mode) {
  // Update the global variable
  automaticMode = mode;
  
  Serial.print("Automatic mode set to: ");
  Serial.println(mode ? "ON" : "OFF");
  
  // Update device status in Supabase
  updateDeviceStatus(pumpStatus, automaticMode);
}

// Use blinkLED function from main file
extern void blinkLED(int times, int delayMs);
