/*
 * IriQ Smart Irrigation System - Configuration File
 * 
 * IMPORTANT: This file contains sensitive information.
 * DO NOT share this file or commit it to version control.
 */

#ifndef CONFIG_H
#define CONFIG_H

// WiFi credentials
#define WIFI_SSID "JAZ 2.G"
#define WIFI_PASSWORD "jaz010204"

// Supabase configuration
#define SUPABASE_URL "https://kuybxkvgmaqqsnuzlyvy.supabase.co"
#define SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1eWJ4a3ZnbWFxcXNudXpseXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3MjE4OTcsImV4cCI6MjA2MTI5Nzg5N30.ieiAVnotpygFOucW_INCcddE47hZKBCfUGr9y4infa4"

// Device configuration
#define DEVICE_ID "esp32_device_1"  // This will be linked to a user account

// Pin configuration
#define MOISTURE_SENSOR_PIN 34  // Analog pin for moisture sensor
#define PUMP_RELAY_PIN 26       // Digital pin for pump relay control
#define LED_PIN 2               // Built-in LED for status indication

// Operational parameters
#define MOISTURE_THRESHOLD 30   // Threshold for automatic irrigation (0-100, where 0 is dry)
#define READING_INTERVAL 60000  // Read sensor every 1 minute (in milliseconds)
#define COMMAND_CHECK_INTERVAL 5000  // Check for commands every 5 seconds
#define HEARTBEAT_INTERVAL 300000    // Send heartbeat every 5 minutes

#endif // CONFIG_H
