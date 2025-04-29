-- IriQ Smart Irrigation System - Supabase Database Setup
-- This script creates the necessary tables and functions for ESP32 integration

-- Create devices table to store registered ESP32 devices
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT NOT NULL UNIQUE,
    device_name TEXT NOT NULL,
    device_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add comment to the devices table
COMMENT ON TABLE public.devices IS 'Stores information about registered ESP32 devices';

-- Create device_auth_logs table to track authentication attempts
CREATE TABLE IF NOT EXISTS public.device_auth_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    success BOOLEAN NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add comment to the device_auth_logs table
COMMENT ON TABLE public.device_auth_logs IS 'Logs authentication attempts from ESP32 devices';

-- Create or update the RLS policies for the devices table
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own devices
CREATE POLICY "Users can view their own devices"
    ON public.devices
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can create their own devices
CREATE POLICY "Users can create their own devices"
    ON public.devices
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own devices
CREATE POLICY "Users can update their own devices"
    ON public.devices
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own devices
CREATE POLICY "Users can delete their own devices"
    ON public.devices
    FOR DELETE
    USING (auth.uid() = user_id);

-- Policy: Admin users can view all devices
CREATE POLICY "Admin users can view all devices"
    ON public.devices
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Policy: Admin users can create devices for any user
CREATE POLICY "Admin users can create devices for any user"
    ON public.devices
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Policy: Admin users can update any device
CREATE POLICY "Admin users can update any device"
    ON public.devices
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Policy: Admin users can delete any device
CREATE POLICY "Admin users can delete any device"
    ON public.devices
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Create or update the RLS policies for the device_status table
ALTER TABLE public.device_status ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own device status
CREATE POLICY "Users can view their own device status"
    ON public.device_status
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.devices
            WHERE devices.device_id = device_status.device_id
            AND devices.user_id = auth.uid()
        )
    );

-- Policy: Devices can update their own status
CREATE POLICY "Devices can update their own status"
    ON public.device_status
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.devices
            WHERE devices.device_id = device_status.device_id
            AND devices.user_id = auth.uid()
        )
    );

-- Policy: Admin users can view all device status
CREATE POLICY "Admin users can view all device status"
    ON public.device_status
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Create or update the RLS policies for the sensor_readings table
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own sensor readings
CREATE POLICY "Users can view their own sensor readings"
    ON public.sensor_readings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.devices
            WHERE devices.device_id = sensor_readings.device_id
            AND devices.user_id = auth.uid()
        )
    );

-- Policy: Devices can insert their own readings
CREATE POLICY "Devices can insert their own readings"
    ON public.sensor_readings
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.devices
            WHERE devices.device_id = sensor_readings.device_id
            AND devices.user_id = auth.uid()
        )
    );

-- Policy: Admin users can view all sensor readings
CREATE POLICY "Admin users can view all sensor readings"
    ON public.sensor_readings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Create or update the RLS policies for the control_commands table
ALTER TABLE public.control_commands ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own control commands
CREATE POLICY "Users can view their own control commands"
    ON public.control_commands
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.devices
            WHERE devices.device_id = control_commands.device_id
            AND devices.user_id = auth.uid()
        )
    );

-- Policy: Users can create control commands for their own devices
CREATE POLICY "Users can create control commands for their own devices"
    ON public.control_commands
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.devices
            WHERE devices.device_id = control_commands.device_id
            AND devices.user_id = auth.uid()
        )
    );

-- Policy: Devices can update their own commands (to mark as executed)
CREATE POLICY "Devices can update their own commands"
    ON public.control_commands
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.devices
            WHERE devices.device_id = control_commands.device_id
            AND devices.user_id = auth.uid()
        )
    );

-- Policy: Admin users can view all control commands
CREATE POLICY "Admin users can view all control commands"
    ON public.control_commands
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Policy: Admin users can create control commands for any device
CREATE POLICY "Admin users can create control commands for any device"
    ON public.control_commands
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Create a stored procedure for device authentication
CREATE OR REPLACE FUNCTION authenticate_device(device_id TEXT, device_type TEXT)
RETURNS JSON AS $$
DECLARE
    device_record RECORD;
    result JSON;
BEGIN
    -- Check if device exists
    SELECT * INTO device_record FROM public.devices
    WHERE devices.device_id = authenticate_device.device_id;
    
    IF device_record IS NULL THEN
        RETURN json_build_object('error', 'Device not authorized');
    END IF;
    
    -- Check if device is linked to a user
    IF device_record.user_id IS NULL THEN
        RETURN json_build_object('error', 'Device not linked to a user');
    END IF;
    
    -- In a real implementation, we would generate a JWT token here
    -- For now, we'll just return a success message
    RETURN json_build_object(
        'success', true,
        'device_id', device_record.device_id,
        'user_id', device_record.user_id,
        'message', 'Authentication successful'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
