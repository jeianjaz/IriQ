# IriQ Smart Irrigation System - ESP32 Firmware

This firmware connects an ESP32 microcontroller to the IriQ Smart Irrigation Dashboard via Supabase backend. It enables real-time monitoring and control of irrigation systems.

## Features

- **Moisture Monitoring**: Reads soil moisture levels from sensors
- **Pump Control**: Controls irrigation pump based on moisture levels or user commands
- **Automatic/Manual Modes**: Supports both automatic (based on moisture threshold) and manual control
- **Secure Communication**: Implements secure authentication and encrypted communication with Supabase
- **Real-time Updates**: Sends real-time data to the dashboard and receives control commands

## Hardware Requirements

- ESP32 Development Board
- Soil Moisture Sensor (Analog)
- Relay Module (for pump control)
- Power Supply
- Jumper Wires

## Wiring Diagram

```
ESP32 GPIO34 -----> Moisture Sensor Signal
ESP32 GPIO26 -----> Relay Module Input
ESP32 GPIO2  -----> Status LED
ESP32 5V     -----> Sensor VCC, Relay VCC
ESP32 GND    -----> Sensor GND, Relay GND
```

## Software Requirements

- Arduino IDE
- Required Libraries:
  - WiFi.h
  - HTTPClient.h
  - ArduinoJson.h
  - Preferences.h
  - time.h

## Project Structure

- `IriQ_ESP32_Firmware.ino`: Main firmware file
- `config.h`: Configuration file for WiFi, Supabase, and device settings
- `auth.h/cpp`: Authentication module for secure communication
- `supabase_api.h/cpp`: API module for Supabase communication
- `sensors.h/cpp`: Sensor and actuator control module

## Setup Instructions

1. **Configure the firmware**:
   - Edit `config.h` with your WiFi credentials and Supabase details
   - Set the appropriate pin numbers for your hardware setup
   - Adjust operational parameters as needed

2. **Upload the firmware**:
   - Connect your ESP32 to your computer
   - Open the project in Arduino IDE
   - Select the correct board and port
   - Upload the firmware

3. **Link to Supabase**:
   - Create a device entry in the Supabase `device_status` table
   - Ensure the `device_id` in the firmware matches the one in Supabase
   - Set up appropriate RLS policies for device access

## Security Considerations

- Store sensitive information securely using the ESP32's Preferences library
- Use JWT authentication for secure communication with Supabase
- Implement proper error handling and validation
- Consider using HTTPS for all communications
- Regularly update firmware to address security vulnerabilities

## Troubleshooting

- **WiFi Connection Issues**: Check your WiFi credentials and signal strength
- **Authentication Errors**: Verify your Supabase URL and API key
- **Sensor Reading Problems**: Calibrate your moisture sensor for your specific soil type
- **Communication Failures**: Check your internet connection and Supabase service status

## Integration with IriQ Dashboard

This firmware is designed to work seamlessly with the IriQ Smart Irrigation Dashboard. It:

1. Sends moisture readings to the `sensor_readings` table
2. Updates device status in the `device_status` table
3. Checks for control commands in the `control_commands` table
4. Executes commands and marks them as executed

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Contact

For any questions or support, please contact the IriQ team.
