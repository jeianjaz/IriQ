// Supabase Edge Function: authenticate-device
// This function authenticates ESP32 devices and issues JWT tokens

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Handle the request
Deno.serve(async (req) => {
  // Get request data
  const { device_id, device_type } = await req.json()
  
  // Validate request
  if (!device_id || !device_type) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { headers: { 'Content-Type': 'application/json' }, status: 400 }
    )
  }
  
  // Initialize Supabase client with service role key
  // IMPORTANT: This uses the service role key which has admin privileges
  // In production, implement proper security measures
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  )
  
  try {
    // Check if device exists in the database
    const { data: deviceData, error: deviceError } = await supabaseAdmin
      .from('devices')
      .select('*')
      .eq('device_id', device_id)
      .single()
    
    if (deviceError || !deviceData) {
      console.error('Device not found:', deviceError)
      return new Response(
        JSON.stringify({ error: 'Device not authorized' }),
        { headers: { 'Content-Type': 'application/json' }, status: 401 }
      )
    }
    
    // Check if device is linked to a user
    if (!deviceData.user_id) {
      return new Response(
        JSON.stringify({ error: 'Device not linked to a user' }),
        { headers: { 'Content-Type': 'application/json' }, status: 401 }
      )
    }
    
    // Generate a JWT token for the device
    // This token will have limited permissions based on the device's role
    const { data: tokenData, error: tokenError } = await supabaseAdmin.auth.admin.createToken({
      user_id: deviceData.user_id,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
    })
    
    if (tokenError) {
      console.error('Token generation error:', tokenError)
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { headers: { 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    
    // Log the authentication attempt
    await supabaseAdmin
      .from('device_auth_logs')
      .insert({
        device_id: device_id,
        user_id: deviceData.user_id,
        success: true,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      })
    
    // Return the token
    return new Response(
      JSON.stringify({
        token: tokenData.token,
        expires_in: 86400, // 24 hours in seconds
        user_id: deviceData.user_id
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
    
  } catch (error) {
    console.error('Authentication error:', error)
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
