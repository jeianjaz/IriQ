# IriQ Smart Irrigation System - Integration Guide

This comprehensive guide will walk you through the complete integration of the ESP32 microcontroller with the IriQ Smart Irrigation Dashboard and Supabase backend. By following these steps, you'll have a fully functional smart irrigation system with secure authentication, real-time monitoring, and remote control capabilities.

## System Architecture Overview

The IriQ Smart Irrigation System consists of three main components:

1. **ESP32 Firmware**: Handles sensor readings, pump control, and communication with the backend
2. **Supabase Backend**: Provides authentication, database storage, and real-time updates
3. **Next.js Dashboard**: Offers a modern UI for monitoring and controlling the irrigation system

The system uses a secure communication flow:
- ESP32 authenticates with Supabase using JWT tokens
- Sensor data is sent to Supabase tables
- Control commands are received from the dashboard via Supabase
- Real-time updates are pushed to the dashboard using Supabase's realtime capabilities

## Step 1: Supabase Setup

### 1.1 Database Tables

Execute the SQL scripts in the Supabase SQL Editor to create the necessary tables:

1. Run `esp32-firmware/supabase-setup/database-setup.sql` to create:
   - `devices` table
   - `device_auth_logs` table
   - Row Level Security (RLS) policies

2. Run `esp32-firmware/supabase-setup/device-heartbeat.sql` to create:
   - `device_heartbeats` table
   - Additional RLS policies
   - `is_device_online` function

### 1.2 Edge Function Deployment

Deploy the authentication Edge Function to handle secure device authentication:

```bash
# Install Supabase CLI if needed
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

### 1.3 Register Your First Device

Insert a record for your ESP32 device in the `devices` table:

```sql
INSERT INTO devices (device_id, device_name, device_type, user_id)
VALUES (
  'esp32_device_1',           -- Same as in config.h
  'Main Garden Irrigation',   -- Descriptive name
  'ESP32',                    -- Device type
  'auth-user-id'              -- User ID from auth.users table
);
```

Replace `'auth-user-id'` with your actual user ID from the Supabase auth system.

## Step 2: ESP32 Firmware Setup

### 2.1 Hardware Requirements

- ESP32 development board
- Soil moisture sensor (analog)
- Relay module for pump control
- Jumper wires
- Power supply

### 2.2 Wiring Diagram

```
ESP32 GPIO34 -----> Moisture Sensor Signal
ESP32 GPIO26 -----> Relay Module Input
ESP32 GPIO2  -----> Status LED
ESP32 5V     -----> Sensor VCC, Relay VCC
ESP32 GND    -----> Sensor GND, Relay GND
```

### 2.3 Software Setup

1. Install Arduino IDE and required libraries:
   - WiFi
   - HTTPClient
   - ArduinoJson (version 6.x)
   - Preferences
   - Time

2. Clone or download the IriQ ESP32 firmware from your repository

3. Create a `config.h` file with your specific settings:

```cpp
// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Supabase configuration
const char* supabaseUrl = "https://kuybxkvgmaqqsnuzlyvy.supabase.co";
const char* supabaseKey = "YOUR_SUPABASE_ANON_KEY";
const String deviceId = "esp32_device_1"; // Must match the ID in Supabase

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

4. Upload the firmware to your ESP32:
   - Open `IriQ_ESP32_Firmware.ino` in Arduino IDE
   - Select your ESP32 board from Tools > Board menu
   - Select the correct port from Tools > Port menu
   - Click Upload

5. Verify operation using the Serial Monitor (115200 baud):
   - Check for successful WiFi connection
   - Verify authentication with Supabase
   - Confirm sensor readings are being sent
   - Check for heartbeat messages

## Step 3: Dashboard Integration

### 3.1 Update Database Types

Ensure your database types in the dashboard project include the new tables:

```typescript
// In src/lib/database.types.ts
export interface Database {
  public: {
    Tables: {
      // Existing tables...
      
      // Add these new tables
      devices: {
        Row: {
          id: string
          device_id: string
          device_name: string
          device_type: string
          user_id: string
          created_at: string
          updated_at: string
        }
        // ... other type definitions
      }
      device_heartbeats: {
        Row: {
          id: string
          device_id: string
          last_seen: string
          status: string
          ip_address: string | null
          firmware_version: string | null
          created_at: string
          updated_at: string
        }
        // ... other type definitions
      }
      device_auth_logs: {
        Row: {
          id: string
          device_id: string
          user_id: string
          success: boolean
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        // ... other type definitions
      }
    }
    // ... other definitions
  }
}
```

### 3.2 Device Management Page

The device management page (`/devices`) has been created to:
- View all registered devices and their status
- Add new devices
- Remove devices
- Monitor device online/offline status

### 3.3 Dashboard Integration

The main dashboard now includes:
- Device status widget showing online/offline status
- System status with moisture levels and pump status
- Real-time updates from the ESP32

## Step 4: Testing the Integration

### 4.1 Verify Data Flow

1. **ESP32 to Supabase**:
   - Check the `sensor_readings` table for new entries
   - Verify the `device_status` table shows the correct status
   - Confirm `device_heartbeats` are being received

2. **Dashboard to ESP32**:
   - Log in to the IriQ Dashboard
   - Navigate to the Pump Control section
   - Try turning the pump on/off manually
   - Switch between automatic and manual modes
   - Verify the ESP32 responds correctly (check Serial Monitor)

### 4.2 Test Authentication

1. Restart the ESP32 and observe the authentication process
2. Check the `device_auth_logs` table for successful authentication entries
3. Verify token refresh is working by keeping the ESP32 running for more than 24 hours

## Step 5: Security Considerations

### 5.1 Secure Authentication

- The system uses JWT tokens for authentication
- Tokens are stored securely in ESP32's Preferences
- Automatic token refresh prevents expiration issues
- Device-specific authentication prevents unauthorized access

### 5.2 Data Security

- All communication uses HTTPS
- Row Level Security (RLS) ensures users can only access their own data
- Admin users have extended permissions for management functions
- No hardcoded secrets in the codebase (all in config.h, which is gitignored)

### 5.3 Physical Security

- Protect the ESP32 from environmental damage
- Secure power supply with battery backup if needed
- Implement watchdog timers for reliability

## Step 6: Maintenance and Monitoring

### 6.1 Regular Checks

- Monitor device heartbeats to ensure system is online
- Check moisture sensor calibration periodically
- Update firmware with security patches as needed
- Clean sensor probes if necessary

### 6.2 Troubleshooting

**WiFi Connection Issues**:
- Verify WiFi credentials
- Check signal strength at device location
- Consider a WiFi range extender if needed

**Authentication Problems**:
- Verify Supabase URL and API key
- Check device registration in the `devices` table
- Ensure user ID is correctly linked

**Sensor Reading Issues**:
- Calibrate moisture sensor for your soil type
- Check wiring connections
- Verify analog readings in Serial Monitor

**Command Execution Failures**:
- Check RLS policies in Supabase
- Verify command format in the `control_commands` table
- Check authentication token validity

## Step 7: Future Enhancements

Consider these enhancements to further improve your IriQ Smart Irrigation System:

1. **Multiple Sensor Zones**:
   - Add support for multiple moisture sensors
   - Create zone-based irrigation control

2. **Weather Integration**:
   - Connect to weather APIs
   - Adjust irrigation based on forecast

3. **Mobile Notifications**:
   - Add push notifications for critical events
   - Create a mobile app for on-the-go control

4. **Water Usage Tracking**:
   - Add a flow meter to monitor water consumption
   - Generate water usage reports

5. **OTA Updates**:
   - Implement Over-The-Air firmware updates
   - Remotely manage ESP32 devices

## Conclusion

You now have a fully integrated IriQ Smart Irrigation System with:

- Secure ESP32 to Supabase communication
- Real-time monitoring and control
- Modern dashboard interface
- Device management capabilities
- Automatic and manual irrigation modes

This system provides a solid foundation for smart irrigation that can be expanded with additional features as needed.

---

For additional support, refer to the documentation in the `README.md` files or contact the IriQ development team.
