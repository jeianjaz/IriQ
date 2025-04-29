"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Database } from '@/lib/database.types'

type DeviceStatus = Database['public']['Tables']['device_status']['Row']

export default function PumpControl({ compact = false }: { compact?: boolean } = {}) {
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (!user) return
 
    const fetchDeviceStatus = async () => {
      try {
        setLoading(true)
        
        // Fetch the current device status for the ESP32 device
        const { data, error } = await supabase
          .from('device_status')
          .select('*')
          .eq('device_id', 'esp32_device_1')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single()
        
        if (error) throw error
        
        setDeviceStatus(data)
      } catch (err) {
        console.error('Error fetching device status:', err)
        setError('Failed to fetch device status')
      } finally {
        setLoading(false)
      }
    }

    fetchDeviceStatus()

    // Set up real-time subscription for ESP32 device
    const statusSubscription = supabase
      .channel('device_status_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'device_status',
        filter: `device_id=eq.esp32_device_1`
      }, (payload) => {
        setDeviceStatus(payload.new as DeviceStatus)
      })
      .subscribe()

    return () => {
      statusSubscription.unsubscribe()
    }
  }, [user])

  const togglePump = async () => {
    if (!user || !deviceStatus || !isAdmin) return
    
    try {
      setIsUpdating(true)
      setError(null)
      
      // Insert a new control command
      const newStatus = !deviceStatus.pump_status
      const { error } = await supabase
        .from('control_commands')
        .insert({
          device_id: deviceStatus.device_id,
          pump_control: newStatus,
          automatic_mode: deviceStatus.automatic_mode,
          user_id: user.id,
          executed: false
        })
      
      if (error) throw error
      
      // Optimistically update the UI
      setDeviceStatus({
        ...deviceStatus,
        pump_status: newStatus,
        updated_at: new Date().toISOString()
      })
    } catch (err) {
      console.error('Error toggling pump:', err)
      setError('Failed to toggle pump status')
    } finally {
      setIsUpdating(false)
    }
  }

  const toggleMode = async () => {
    if (!user || !deviceStatus || !isAdmin) return
    
    try {
      setIsUpdating(true)
      setError(null)
      
      // Insert a new control command
      const newMode = !deviceStatus.automatic_mode
      const { error } = await supabase
        .from('control_commands')
        .insert({
          device_id: deviceStatus.device_id,
          pump_control: deviceStatus.pump_status,
          automatic_mode: newMode,
          user_id: user.id,
          executed: false
        })
      
      if (error) throw error
      
      // Optimistically update the UI
      setDeviceStatus({
        ...deviceStatus,
        automatic_mode: newMode,
        updated_at: new Date().toISOString()
      })
    } catch (err) {
      console.error('Error toggling mode:', err)
      setError('Failed to toggle automatic mode')
    } finally {
      setIsUpdating(false)
    }
  }

  // Loading state - optimized for both full and compact views
  if (loading) {
    return (
      <div className={`flex justify-center items-center ${compact ? 'h-full' : 'h-64'}`}>
        <div className="text-center">
          <div className={`${compact ? 'w-8 h-8' : 'w-12 h-12'} mx-auto mb-3 border-t-2 border-[#7AD63D] border-solid rounded-full animate-spin`}></div>
          <p className={`text-[#002E1F] font-medium ${compact ? 'text-xs' : 'text-sm'}`}>
            {compact ? 'Loading...' : 'Loading irrigation system status...'}
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 text-red-700 ${compact ? 'p-3 text-xs' : 'p-4'} rounded-lg`}>
        <div className="flex items-center mb-1">
          <div className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-red-100 flex items-center justify-center mr-2`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-red-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="font-medium">Error</p>
        </div>
        <p className={`${compact ? 'text-xs ml-8' : 'text-sm ml-10'}`}>{error}</p>
        <button
          className={`${compact ? 'ml-8 mt-2 px-2 py-1 text-xs' : 'ml-10 mt-3 px-3 py-1.5 text-sm'} bg-white text-red-600 rounded-md font-medium hover:bg-red-50 transition-colors`}
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    )
  }

  // No data state
  if (!deviceStatus) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 text-yellow-700 ${compact ? 'p-3 text-xs' : 'p-4'} rounded-lg`}>
        <div className="flex items-center mb-1">
          <div className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-yellow-100 flex items-center justify-center mr-2`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-yellow-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="font-medium">No Data Available</p>
        </div>
        <p className={`${compact ? 'text-xs ml-8' : 'text-sm ml-10'}`}>The irrigation system hasn't been initialized yet.</p>
        <button
          className={`${compact ? 'ml-8 mt-2 px-2 py-1 text-xs' : 'ml-10 mt-3 px-3 py-1.5 text-sm'} bg-white text-yellow-600 rounded-md font-medium hover:bg-yellow-50 transition-colors`}
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      </div>
    )
  }

  // Non-admin compact view - simplified status indicator
  if (!isAdmin && compact) {
    return (
      <div className="h-full flex flex-col justify-center items-center text-center p-2">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="text-sm font-medium mb-1">Pump Status</div>
        <div className={`text-xs font-semibold px-2 py-1 rounded-full ${deviceStatus.pump_status 
          ? 'bg-green-100 text-green-800' 
          : 'bg-gray-100 text-gray-800'}`}>
          {deviceStatus.pump_status ? 'ACTIVE' : 'INACTIVE'}
        </div>
        <div className="text-xs text-gray-500 mt-2">
          {deviceStatus.automatic_mode ? 'Auto Mode' : 'Manual Mode'}
        </div>
      </div>
    )
  }

  // Non-admin full view - detailed status display
  if (!isAdmin) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b border-blue-200">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-blue-900">Irrigation System Status</h3>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-[#F6F8ED] flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#7AD63D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-medium">Pump Status</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${deviceStatus.pump_status ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {deviceStatus.pump_status ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 ml-11">
                {deviceStatus.pump_status 
                  ? 'The irrigation pump is currently running and water is flowing through the system.' 
                  : 'The irrigation pump is currently off. No water is flowing through the system.'}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-[#F6F8ED] flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#7AD63D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-medium">Operation Mode</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${deviceStatus.automatic_mode ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                  {deviceStatus.automatic_mode ? 'AUTOMATIC' : 'MANUAL'}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 ml-11">
                {deviceStatus.automatic_mode 
                  ? 'The system is operating in automatic mode based on soil moisture levels.' 
                  : 'The system is in manual mode and requires direct control.'}
              </div>
            </div>
          </div>
          
          <div className="mt-6 bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
            <div className="flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">System Information</span>
            </div>
            <p className="ml-7">
              Last updated: {new Date(deviceStatus.updated_at).toLocaleString()}
            </p>
            <p className="ml-7 mt-1">
              Contact your administrator for any changes to the irrigation system settings.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Admin view - full control panel
  return (
    <div className={compact ? "space-y-4" : "grid gap-6 md:grid-cols-2"}>
      {/* Pump Control Card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#F6F8ED] to-white p-4 border-b border-[#F6F8ED]">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-[#F6F8ED] flex items-center justify-center mr-3 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#7AD63D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#002E1F]">Pump Control</h3>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[#002E1F] font-medium">Current Status:</span>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${deviceStatus.pump_status ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {deviceStatus.pump_status ? 'ACTIVE' : 'INACTIVE'}
            </div>
          </div>
          
          <div className="flex flex-col space-y-4">
            <button
              className={`px-4 py-3 rounded-lg text-white font-medium transition-all ${
                deviceStatus.pump_status 
                  ? 'bg-gray-200 text-gray-600 cursor-default' 
                  : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
              }`}
              onClick={() => !deviceStatus.pump_status && togglePump()}
              disabled={deviceStatus.pump_status || isUpdating}
            >
              Turn Pump ON
            </button>
            
            <button
              className={`px-4 py-3 rounded-lg text-white font-medium transition-all ${
                !deviceStatus.pump_status 
                  ? 'bg-gray-200 text-gray-600 cursor-default' 
                  : 'bg-red-600 hover:bg-red-700 active:bg-red-800'
              }`}
              onClick={() => deviceStatus.pump_status && togglePump()}
              disabled={!deviceStatus.pump_status || isUpdating}
            >
              Turn Pump OFF
            </button>
          </div>
          
          {isUpdating && (
            <div className="mt-4 flex items-center justify-center text-sm text-gray-600">
              <div className="w-4 h-4 border-t-2 border-[#7AD63D] border-solid rounded-full animate-spin mr-2"></div>
              Updating...
            </div>
          )}
        </div>
      </div>
  
      {/* Operation Mode Card */}
      {!compact && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#F6F8ED] to-white p-4 border-b border-[#F6F8ED]">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-[#F6F8ED] flex items-center justify-center mr-3 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#7AD63D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#002E1F]">Operation Mode</h3>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[#002E1F] font-medium">Current Mode:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${deviceStatus.automatic_mode ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                {deviceStatus.automatic_mode ? 'AUTOMATIC' : 'MANUAL'}
              </span>
            </div>
            
            <button
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-medium transition-all disabled:bg-gray-300 disabled:text-gray-500"
              onClick={toggleMode}
              disabled={isUpdating}
            >
              Switch to {deviceStatus.automatic_mode ? 'MANUAL' : 'AUTOMATIC'} Mode
            </button>
            
            <div className="mt-6 bg-blue-50 rounded-lg p-4 text-sm">
              <div className="font-medium mb-2 text-blue-800">Mode Information:</div>
              <p className="text-blue-700 mb-2">
                <span className="font-medium">Automatic Mode:</span> The system will automatically control the pump based on soil moisture levels.
              </p>
              <p className="text-blue-700">
                <span className="font-medium">Manual Mode:</span> You have full control over when the pump is turned on or off.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Compact Admin Mode Toggle */}
      {compact && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-[#F6F8ED] flex items-center justify-center mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#7AD63D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-[#002E1F]">Mode</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${deviceStatus.automatic_mode ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                {deviceStatus.automatic_mode ? 'AUTO' : 'MANUAL'}
              </span>
            </div>
            
            <button
              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-all disabled:bg-gray-300 disabled:text-gray-500"
              onClick={toggleMode}
              disabled={isUpdating}
            >
              Switch Mode
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
