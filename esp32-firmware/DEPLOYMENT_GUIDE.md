# IriQ Smart Irrigation System - Deployment Guide

This guide provides step-by-step instructions for deploying the IriQ Smart Irrigation System, connecting your ESP32 device to the Supabase backend and the Next.js dashboard.

## Prerequisites

- ESP32 development board
- Soil moisture sensor
- Relay module for pump control
- Arduino IDE installed
- Access to your Supabase project (URL: https://kuybxkvgmaqqsnuzlyvy.supabase.co)
- IriQ Dashboard repository

## Step 1: Prepare the Supabase Backend

1. **Create Required Tables**
   
   Run the SQL script in `supabase-setup/database-setup.sql` in your Supabase SQL Editor to create:
   - `devices` table (for device registration)
   - `device_auth_logs` table (for authentication logging)
   - Row Level Security (RLS) policies for secure access

2. **Deploy the Authentication Edge Function**

   ```bash
   # Install Supabase CLI if you haven't already
   npm install -g supabase

   # Login to your Supabase account
   supabase login

   # Initialize Supabase in your project directory
   cd esp32-firmware
   supabase init

   # Link to your Supabase project
   supabase link --project-ref kuybxkvgmaqqsnuzlyvy

   # Deploy the authentication function
   supabase functions deploy authenticate-device
   ```

3. **Register Your Device**

   Insert a record for your ESP32 device in the `devices` table:

   ```sql
   INSERT INTO devices (device_id, device_name, device_type, user_id)
   VALUES (
     'your-device-id',           -- Same as in config.h
     'Main Garden Irrigation',   -- Descriptive name
     'ESP32',                    -- Device type
     'auth-user-id'              -- User ID from auth.users table
   );
   ```

## Step 2: Configure and Flash the ESP32

1. **Install Required Libraries**

   In Arduino IDE, install these libraries via Library Manager:
   - WiFi
   - HTTPClient
   - ArduinoJson (version 6.x)
   - Preferences
   - Time

2. **Configure Your Device**

   Create a `config.h` file with your specific settings:

   ```cpp
   // WiFi credentials
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";

   // Supabase configuration
   const char* supabaseUrl = "https://kuybxkvgmaqqsnuzlyvy.supabase.co";
   const char* supabaseKey = "YOUR_SUPABASE_ANON_KEY";
   const String deviceId = "your-device-id"; // Must match the ID in Supabase

   // Pin configuration
   const int moistureSensorPin = 34;  // Analog pin for moisture sensor
   const int pumpRelayPin = 26;       // Digital pin for pump relay
   const int ledPin = 2;              // Built-in LED

   // Operational parameters
   const int moistureThreshold = 30;  // Threshold for automatic irrigation (0-100%)
   const unsigned long sensorReadInterval = 60000;     // Read sensor every 1 minute
   const unsigned long commandCheckInterval = 10000;   // Check commands every 10 seconds
   const unsigned long heartbeatInterval = 300000;     // Send heartbeat every 5 minutes
   ```

3. **Upload the Firmware**

   - Open `IriQ_ESP32_Firmware.ino` in Arduino IDE
   - Select your ESP32 board from Tools > Board menu
   - Select the correct port from Tools > Port menu
   - Click Upload

4. **Verify Operation**

   - Open the Serial Monitor (115200 baud)
   - Verify the ESP32 connects to WiFi
   - Confirm it authenticates with Supabase
   - Check that sensor readings are being sent
   - Verify it responds to commands from the dashboard

## Step 3: Connect Hardware

1. **Wire the Moisture Sensor**

   ```
   ESP32 3.3V  --> Moisture Sensor VCC
   ESP32 GND   --> Moisture Sensor GND
   ESP32 GPIO34 --> Moisture Sensor Signal (Analog)
   ```

2. **Wire the Relay Module**

   ```
   ESP32 5V    --> Relay Module VCC
   ESP32 GND   --> Relay Module GND
   ESP32 GPIO26 --> Relay Module IN
   ```

   Then connect your pump:
   ```
   Relay COM   --> Power Supply +
   Relay NO    --> Pump +
   Power Supply - --> Pump -
   ```

3. **Connect Status LED** (optional if using built-in LED)

   ```
   ESP32 GPIO2 --> LED + (with appropriate resistor)
   ESP32 GND   --> LED -
   ```

## Step 4: Test the Integration

1. **Verify Data in Supabase**

   - Check the `sensor_readings` table for new entries
   - Verify the `device_status` table shows the correct status
   - Test sending commands through the `control_commands` table

2. **Test Dashboard Control**

   - Log in to the IriQ Dashboard
   - Navigate to the Pump Control section
   - Try turning the pump on/off manually
   - Switch between automatic and manual modes
   - Verify the ESP32 responds correctly

## Step 5: Security Hardening (Production)

For production deployment, implement these additional security measures:

1. **Secure Authentication**
   - Use the JWT authentication method instead of the anon key
   - Implement token refresh logic
   - Consider device-specific API keys

2. **Encrypted Communication**
   - Ensure all communication uses HTTPS
   - Validate server certificates

3. **Physical Security**
   - Protect the ESP32 from environmental damage
   - Secure power supply with battery backup if needed
   - Implement watchdog timers for reliability

4. **Regular Updates**
   - Plan for OTA (Over-The-Air) updates
   - Regularly check for security vulnerabilities

## Troubleshooting

### WiFi Connection Issues
- Verify WiFi credentials
- Check signal strength at device location
- Consider a WiFi range extender if needed

### Authentication Problems
- Verify Supabase URL and API key
- Check device registration in the `devices` table
- Ensure user ID is correctly linked

### Sensor Reading Issues
- Calibrate moisture sensor for your soil type
- Check wiring connections
- Verify analog readings in Serial Monitor

### Command Execution Failures
- Check RLS policies in Supabase
- Verify command format in the `control_commands` table
- Check authentication token validity

## Maintenance

- Regularly check moisture sensor calibration
- Clean sensor probes if necessary
- Update firmware with security patches
- Monitor battery levels if using battery power
- Check for water-tight seals on outdoor components

## Next Steps

- Implement multiple sensor zones
- Add temperature and humidity sensors
- Implement weather forecast integration
- Develop mobile app notifications
- Add water usage tracking

---

For additional support, refer to the documentation in the `README.md` file or contact the IriQ development team.
