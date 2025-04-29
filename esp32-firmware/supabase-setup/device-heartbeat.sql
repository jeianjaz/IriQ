-- IriQ Smart Irrigation System - Device Heartbeat Table
-- This script creates a table to track device online status

-- Create device_heartbeats table to track device online status
CREATE TABLE IF NOT EXISTS public.device_heartbeats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT NOT NULL REFERENCES public.devices(device_id) ON DELETE CASCADE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'online',
    ip_address TEXT,
    firmware_version TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add comment to the device_heartbeats table
COMMENT ON TABLE public.device_heartbeats IS 'Tracks online status and heartbeats from ESP32 devices';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS device_heartbeats_device_id_idx ON public.device_heartbeats(device_id);

-- Create or update the RLS policies for the device_heartbeats table
ALTER TABLE public.device_heartbeats ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own device heartbeats
CREATE POLICY "Users can view their own device heartbeats"
    ON public.device_heartbeats
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.devices
            WHERE devices.device_id = device_heartbeats.device_id
            AND devices.user_id = auth.uid()
        )
    );

-- Policy: Devices can update their own heartbeats
CREATE POLICY "Devices can update their own heartbeats"
    ON public.device_heartbeats
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.devices
            WHERE devices.device_id = device_heartbeats.device_id
            AND devices.user_id = auth.uid()
        )
    );

-- Policy: Devices can update their own heartbeats
CREATE POLICY "Devices can update their own heartbeat records"
    ON public.device_heartbeats
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.devices
            WHERE devices.device_id = device_heartbeats.device_id
            AND devices.user_id = auth.uid()
        )
    );

-- Policy: Admin users can view all device heartbeats
CREATE POLICY "Admin users can view all device heartbeats"
    ON public.device_heartbeats
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Create function to check device online status
CREATE OR REPLACE FUNCTION is_device_online(device_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    last_heartbeat TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get the last heartbeat time for the device
    SELECT last_seen INTO last_heartbeat
    FROM public.device_heartbeats
    WHERE device_heartbeats.device_id = is_device_online.device_id
    ORDER BY last_seen DESC
    LIMIT 1;
    
    -- If no heartbeat found, device is offline
    IF last_heartbeat IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if the last heartbeat was within the last 10 minutes
    -- Adjust this threshold as needed for your application
    RETURN (CURRENT_TIMESTAMP - last_heartbeat) < INTERVAL '10 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
