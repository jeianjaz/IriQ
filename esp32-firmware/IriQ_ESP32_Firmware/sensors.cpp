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
  // For active LOW relay, HIGH turns it OFF
  digitalWrite(pumpRelayPin, HIGH);
  pumpStatus = false;
  
  Serial.println("Sensors initialized");
  Serial.println("Pump relay initialized to OFF state (pin set HIGH for active LOW relay)");
}

// Read moisture sensor with improved accuracy through averaging
int readMoistureSensor() {
  // Take multiple readings and average them for better accuracy
  const int numReadings = 5;
  int readings[numReadings];
  int total = 0;
  
  // Collect multiple samples
  for (int i = 0; i < numReadings; i++) {
    readings[i] = analogRead(moistureSensorPin);
    total += readings[i];
    delay(20); // Small delay between readings
  }
  
  // Calculate average
  int rawValue = total / numReadings;
  
  // Print raw value for debugging
  Serial.print("Moisture sensor raw value (averaged): ");
  Serial.println(rawValue);
  
  // Convert to percentage (0-100, where 0 is dry and 100 is wet)
  // FIXED CALIBRATION: For your specific sensor
  // If your sensor reads 4095 when dry and lower values when wet
  
  // Calibration values - adjust these based on your sensor readings
  int dryValue = 4095;    // Value when sensor is completely dry (in air)
  int wetValue = 1500;    // Value when sensor is in water
  
  // Calculate percentage with proper constraints
  int moistureLevel = 0;
  
  if (rawValue >= dryValue) {
    moistureLevel = 0;  // Completely dry
  } else if (rawValue <= wetValue) {
    moistureLevel = 100; // Completely wet
  } else {
    // Map the value to a percentage
    moistureLevel = map(rawValue, dryValue, wetValue, 0, 100);
  }
  
  // Apply a small amount of smoothing with previous readings (if available)
  static int lastMoistureLevel = -1;
  if (lastMoistureLevel != -1) {
    // 70% current reading, 30% previous reading for smoothing
    moistureLevel = (moistureLevel * 7 + lastMoistureLevel * 3) / 10;
  }
  lastMoistureLevel = moistureLevel;
  
  Serial.print("Moisture level (smoothed): ");
  Serial.print(moistureLevel);
  Serial.println("%");
  Serial.print("Moisture threshold for pump: ");
  Serial.print(MOISTURE_THRESHOLD);
  Serial.println("%");
  
  return moistureLevel;
}

// Set pump status
void setPumpStatus(bool status) {
  // Update the global variable
  pumpStatus = status;
  
  // Set the physical pin - ensure it's properly initialized
  pinMode(pumpRelayPin, OUTPUT);
  
  // Force a reset of the pin state to ensure reliable operation
  digitalWrite(pumpRelayPin, HIGH); // Turn OFF first
  delay(100); // Longer delay for relay to stabilize
  
  // Most relay modules are active LOW, so we invert the logic
  // This means LOW turns the relay ON, HIGH turns it OFF
  digitalWrite(pumpRelayPin, status ? LOW : HIGH);
  
  // Double-check that the pin is in the correct state with multiple attempts
  for (int i = 0; i < 3; i++) { // Try multiple times to ensure the relay responds
    delay(50);
    digitalWrite(pumpRelayPin, status ? LOW : HIGH);
  }
  
  // Physically verify the pin state
  int pinState = digitalRead(pumpRelayPin);
  Serial.print("Verified relay pin state: ");
  Serial.println(pinState == LOW ? "LOW (ON)" : "HIGH (OFF)");
  
  // If the pin state doesn't match what we want, try again with more force
  if ((status && pinState != LOW) || (!status && pinState != HIGH)) {
    Serial.println("Relay state verification failed! Trying again with more force...");
    pinMode(pumpRelayPin, OUTPUT); // Re-initialize pin
    digitalWrite(pumpRelayPin, status ? LOW : HIGH); // Set state again
    delay(100); // Longer delay
    digitalWrite(pumpRelayPin, status ? LOW : HIGH); // And again
  }
  
  // Blink LED to indicate pump status change
  for (int i = 0; i < (status ? 2 : 1); i++) {
    digitalWrite(ledPin, HIGH);
    delay(100);
    digitalWrite(ledPin, LOW);
    delay(100);
  }
  
  Serial.print("Pump status set to: ");
  Serial.println(status ? "ON" : "OFF");
  Serial.print("Pump relay pin ");
  Serial.print(pumpRelayPin);
  Serial.print(" set to ");
  Serial.println(status ? "LOW (ON)" : "HIGH (OFF)");
  Serial.println("Note: Relay is ACTIVE LOW - LOW turns relay ON, HIGH turns it OFF");
  
  // Update device status in Supabase immediately
  if (!updateDeviceStatus(pumpStatus, automaticMode)) {
    Serial.println("Failed to update device status in Supabase. Will retry in next loop.");
  }
}

// Set automatic mode
void setAutomaticMode(bool mode) {
  // Check if we're actually changing the mode
  if (automaticMode == mode) {
    Serial.print("Automatic mode already set to: ");
    Serial.println(mode ? "ON" : "OFF");
    return;
  }
  
  // Update the global variable
  automaticMode = mode;
  
  Serial.print("Automatic mode set to: ");
  Serial.println(mode ? "ON" : "OFF");
  
  // Blink LED to indicate mode change
  for (int i = 0; i < (mode ? 3 : 1); i++) {
    digitalWrite(ledPin, HIGH);
    delay(100);
    digitalWrite(ledPin, LOW);
    delay(100);
  }
  
  // If switching to automatic mode, we might need to immediately
  // adjust the pump based on moisture levels
  if (mode) {
    Serial.println("Switching to automatic mode - pump will be controlled based on moisture levels");
  } else {
    Serial.println("Switching to manual mode - pump will be controlled by user commands");
  }
  
  // Update device status in Supabase
  updateDeviceStatus(pumpStatus, automaticMode);
}

// Use blinkLED function from main file
extern void blinkLED(int times, int delayMs);
