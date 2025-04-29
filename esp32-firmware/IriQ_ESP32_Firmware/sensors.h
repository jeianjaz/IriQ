/*
 * IriQ Smart Irrigation System - Sensors Header
 * 
 * Header file for the sensors module.
 */

#ifndef SENSORS_H
#define SENSORS_H

#include <Arduino.h>

// External variables from main file
extern const int moistureSensorPin;
extern const int pumpRelayPin;
extern const int ledPin;
extern bool pumpStatus;
extern bool automaticMode;

// Initialize sensors
void initSensors();

// Read moisture sensor
int readMoistureSensor();

// Set pump status
void setPumpStatus(bool status);

// Set automatic mode
void setAutomaticMode(bool mode);

// Blink LED to indicate status
void blinkLED(int times, int delayMs);

#endif // SENSORS_H
