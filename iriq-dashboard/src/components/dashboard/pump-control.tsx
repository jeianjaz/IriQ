"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'

type DeviceStatus = {
  pump_status: boolean
  automatic_mode: boolean
  updated_at: string
}

export default function PumpControl() {
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, isAdmin } = useAuth()

  useEffect(() => {
    if (!user) return

    const fetchDeviceStatus = async () => {
      try {
        setLoading(true)
        
        // Fetch the current device status
        const { data, error } = await supabase
          .from('device_status')
          .select('*')
          .eq('device_id', user.id) // Assuming device_id is the same as user_id
          .single()
        
        if (error) throw error
        
        setDeviceStatus(data as DeviceStatus)
      } catch (err) {
        console.error('Error fetching device status:', err)
        setError('Failed to fetch device status')
      } finally {
        setLoading(false)
      }
    }

    fetchDeviceStatus()

    // Set up real-time subscription
    const subscription = supabase
      .channel('device_status_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'device_status',
          filter: `device_id=eq.${user.id}`
        },
        (payload) => {
          // Update the state with the new status
          setDeviceStatus(payload.new as DeviceStatus)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  const togglePump = async () => {
    if (!user || !deviceStatus || !isAdmin) return
    
    try {
      setUpdating(true)
      setError(null)
      
      // Insert a new control command
      const { error } = await supabase
        .from('control_commands')
        .insert({
          device_id: user.id,
          pump_control: !deviceStatus.pump_status,
          automatic_mode: deviceStatus.automatic_mode,
          user_id: user.id,
          executed: false
        })
      
      if (error) throw error
      
      // Optimistically update the UI
      setDeviceStatus({
        ...deviceStatus,
        pump_status: !deviceStatus.pump_status,
        updated_at: new Date().toISOString()
      })
    } catch (err) {
      console.error('Error toggling pump:', err)
      setError('Failed to toggle pump status')
    } finally {
      setUpdating(false)
    }
  }

  const toggleMode = async () => {
    if (!user || !deviceStatus || !isAdmin) return
    
    try {
      setUpdating(true)
      setError(null)
      
      // Insert a new control command
      const { error } = await supabase
        .from('control_commands')
        .insert({
          device_id: user.id,
          pump_control: deviceStatus.pump_status,
          automatic_mode: !deviceStatus.automatic_mode,
          user_id: user.id,
          executed: false
        })
      
      if (error) throw error
      
      // Optimistically update the UI
      setDeviceStatus({
        ...deviceStatus,
        automatic_mode: !deviceStatus.automatic_mode,
        updated_at: new Date().toISOString()
      })
    } catch (err) {
      console.error('Error toggling mode:', err)
      setError('Failed to toggle automatic mode')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#7AD63D]"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p className="font-medium">Error</p>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  if (!deviceStatus) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
        <p className="font-medium">No device status available</p>
        <p className="text-sm">Device status has not been initialized yet.</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
        <p className="font-medium">View-only mode</p>
        <p className="text-sm">You need admin privileges to control the irrigation system.</p>
        <div className="mt-4 space-y-4">
          <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
            <span className="text-gray-700">Pump Status:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${deviceStatus.pump_status ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {deviceStatus.pump_status ? 'ON' : 'OFF'}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
            <span className="text-gray-700">Mode:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${deviceStatus.automatic_mode ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
              {deviceStatus.automatic_mode ? 'AUTOMATIC' : 'MANUAL'}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
            <span className="text-gray-700">Last Updated:</span>
            <span className="text-sm text-gray-500">{new Date(deviceStatus.updated_at).toLocaleString()}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Pump Control</h3>
          <div className="flex flex-col items-center">
            <div className={`h-32 w-32 rounded-full flex items-center justify-center mb-6 ${deviceStatus.pump_status ? 'bg-green-100' : 'bg-gray-100'}`}>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-16 w-16 ${deviceStatus.pump_status ? 'text-green-600' : 'text-gray-400'}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 10V3L4 14h7v7l9-11h-7z" 
                />
              </svg>
            </div>
            <span className="text-lg font-medium mb-4">
              Pump is currently {deviceStatus.pump_status ? 'ON' : 'OFF'}
            </span>
            <button
              onClick={togglePump}
              disabled={updating}
              className={`
                px-6 py-2 rounded-full font-medium transition-colors
                ${deviceStatus.pump_status 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'}
                ${updating ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {updating ? 'Updating...' : deviceStatus.pump_status ? 'Turn OFF' : 'Turn ON'}
            </button>
            <p className="mt-4 text-sm text-gray-500">
              Last updated: {new Date(deviceStatus.updated_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Operation Mode</h3>
          <div className="flex flex-col items-center">
            <div className={`h-32 w-32 rounded-full flex items-center justify-center mb-6 ${deviceStatus.automatic_mode ? 'bg-blue-100' : 'bg-purple-100'}`}>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-16 w-16 ${deviceStatus.automatic_mode ? 'text-blue-600' : 'text-purple-600'}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                {deviceStatus.automatic_mode ? (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
                  />
                ) : (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
                  />
                )}
              </svg>
            </div>
            <span className="text-lg font-medium mb-4">
              Currently in {deviceStatus.automatic_mode ? 'AUTOMATIC' : 'MANUAL'} mode
            </span>
            <button
              onClick={toggleMode}
              disabled={updating}
              className={`
                px-6 py-2 rounded-full font-medium transition-colors
                ${deviceStatus.automatic_mode 
                  ? 'bg-purple-600 text-white hover:bg-purple-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'}
                ${updating ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {updating ? 'Updating...' : `Switch to ${deviceStatus.automatic_mode ? 'MANUAL' : 'AUTOMATIC'}`}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Operation Modes Explained</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
            <div className="font-medium text-blue-700 mb-2">Automatic Mode</div>
            <p className="text-sm text-blue-600">
              The system will automatically turn the pump on when soil moisture falls below the threshold and off when it reaches optimal levels.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
            <div className="font-medium text-purple-700 mb-2">Manual Mode</div>
            <p className="text-sm text-purple-600">
              You have full control over the pump. The system will not automatically adjust the pump status based on moisture levels.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
