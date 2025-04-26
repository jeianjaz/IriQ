-- Create tables for IriQ Smart Irrigation Dashboard

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create sensor_readings table
CREATE TABLE IF NOT EXISTS sensor_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_id TEXT NOT NULL,
  moisture_percentage NUMERIC NOT NULL,
  moisture_digital BOOLEAN NOT NULL
);

-- Create device_status table
CREATE TABLE IF NOT EXISTS device_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id TEXT NOT NULL UNIQUE,
  pump_status BOOLEAN NOT NULL DEFAULT FALSE,
  automatic_mode BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users NOT NULL
);

-- Create control_commands table
CREATE TABLE IF NOT EXISTS control_commands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_id TEXT NOT NULL,
  pump_control BOOLEAN NOT NULL,
  automatic_mode BOOLEAN NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  executed BOOLEAN NOT NULL DEFAULT FALSE
);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_commands ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Profiles: Users can read their own profile, admins can read all profiles
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
  ON profiles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Sensor Readings: Users can read sensor readings for their devices, admins can read all
CREATE POLICY "Users can view their device sensor readings" 
  ON sensor_readings FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM device_status
      WHERE device_status.device_id = sensor_readings.device_id
      AND device_status.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all sensor readings" 
  ON sensor_readings FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "ESP32 can insert sensor readings" 
  ON sensor_readings FOR INSERT 
  WITH CHECK (true);

-- Device Status: Users can read their own device status, admins can read all
CREATE POLICY "Users can view their device status" 
  ON device_status FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all device status" 
  ON device_status FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can update their device status" 
  ON device_status FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update all device status" 
  ON device_status FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Control Commands: Users can create commands for their devices, admins can create for all
CREATE POLICY "Users can view their control commands" 
  ON control_commands FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all control commands" 
  ON control_commands FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can create control commands for their devices" 
  ON control_commands FOR INSERT 
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM device_status
      WHERE device_status.device_id = control_commands.device_id
      AND device_status.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create control commands for any device" 
  ON control_commands FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "ESP32 can update executed status" 
  ON control_commands FOR UPDATE
  USING (true)
  WITH CHECK (
    -- Only allow updating the executed field
    (OLD.id = NEW.id) AND
    (OLD.created_at = NEW.created_at) AND
    (OLD.device_id = NEW.device_id) AND
    (OLD.pump_control = NEW.pump_control) AND
    (OLD.automatic_mode = NEW.automatic_mode) AND
    (OLD.user_id = NEW.user_id)
  );

-- Create a trigger to update device_status when a control command is inserted
CREATE OR REPLACE FUNCTION update_device_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE device_status
  SET 
    pump_status = NEW.pump_control,
    automatic_mode = NEW.automatic_mode,
    updated_at = NOW()
  WHERE device_id = NEW.device_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_control_command_inserted
AFTER INSERT ON control_commands
FOR EACH ROW
EXECUTE FUNCTION update_device_status();

-- Create a function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
