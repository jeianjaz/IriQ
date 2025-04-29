"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { CheckCircle, PlusCircle, RefreshCw, Trash2, WifiOff } from 'lucide-react'

interface Device {
  id: string;
  device_id: string;
  device_name: string;
  device_type: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  last_seen?: string;
  status?: string;
  online?: boolean;
}

export default function DevicesPage() {
  const { user } = useAuth()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function fetchDevices() {
      try {
        setLoading(true)
        
        // Get devices for the current user
        const { data: deviceData, error: deviceError } = await supabase
          .from('devices')
          .select('*')
          .eq('device_id', 'esp32_device_1')
          .order('created_at', { ascending: false })
        
        if (deviceError) {
          throw deviceError
        }
        
        // If no devices found, create a virtual entry for the ESP32
        let finalDeviceData = deviceData || []
        if (finalDeviceData.length === 0) {
          finalDeviceData = [{
            id: 'virtual-esp32',
            device_id: 'esp32_device_1',
            device_name: 'ESP32 Smart Irrigation Controller',
            device_type: 'irrigation_controller',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: user?.id || 'system',
            online: false
          }]
        }

        // Get the latest heartbeat for each device
        const deviceIds = finalDeviceData.map((device) => device.device_id)
        
        let heartbeatData: any[] = []
        if (deviceIds.length > 0) {
          const { data: heartbeats, error: heartbeatError } = await supabase
            .from('device_heartbeats')
            .select('*')
            .in('device_id', deviceIds)
            .order('last_seen', { ascending: false })
            .limit(deviceIds.length)
          
          if (heartbeatError) {
            throw heartbeatError
          }
          
          heartbeatData = heartbeats || []
        }
        
        // Process the data
        const now = new Date()
        const processedDevices = finalDeviceData.map((device) => {
          const latestHeartbeat = heartbeatData.find(
            (hb) => hb.device_id === device.device_id
          )
          
          let online = false
          if (latestHeartbeat) {
            const lastSeen = new Date(latestHeartbeat.last_seen)
            // Consider device online if heartbeat is within the last 10 minutes
            online = now.getTime() - lastSeen.getTime() < 10 * 60 * 1000
          }
          
          return {
            ...device,
            last_seen: latestHeartbeat?.last_seen,
            status: latestHeartbeat?.status,
            online,
          }
        })
        
        setDevices(processedDevices)
      } catch (err: any) {
        console.error('Error fetching devices:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchDevices()
  }, [user])

  // Format time ago function
  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    
    // Less than a minute
    if (diffMs < 60 * 1000) {
      return 'Just now'
    }
    
    // Less than an hour
    const diffMins = Math.floor(diffMs / (60 * 1000))
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    }
    
    // Less than a day
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000))
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    }
    
    // More than a day
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000))
    return `${days} day${days !== 1 ? 's' : ''} ago`
  }

  if (!user) return null

  return (
    <div className="container mx-auto py-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-[#002E1F] mb-2">Device Management</h1>
        <p className="text-gray-600">
          Manage your IriQ Smart Irrigation devices.
        </p>
      </motion.div>

      {/* Simplified Device Management Page */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Devices</h2>
          <button 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-1"
            onClick={() => alert('Add device functionality is temporarily unavailable.')}
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add Device</span>
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium mb-2">No devices found</h3>
            <p className="text-gray-500 mb-4">Add your first irrigation device to get started.</p>
            <button 
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-1 mx-auto"
              onClick={() => alert('Add device functionality is temporarily unavailable.')}
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add Device</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
              <div key={device.id} className="border rounded-lg overflow-hidden">
                <div className="p-4 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{device.device_name}</h3>
                      <p className="text-sm text-gray-500">ID: {device.device_id}</p>
                    </div>
                    {device.online ? (
                      <div className="flex items-center text-green-500">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span className="text-xs">Online</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-amber-500">
                        <WifiOff className="h-4 w-4 mr-1" />
                        <span className="text-xs">Offline</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Type:</span>
                      <span>{device.device_type}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Last Seen:</span>
                      <span>{device.last_seen ? formatTimeAgo(new Date(device.last_seen)) : 'Never'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Status:</span>
                      <span>{device.status || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t flex justify-between">
                  <button 
                    className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-sm flex items-center gap-1"
                    onClick={() => alert('Refresh functionality is temporarily unavailable.')}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    <span>Refresh</span>
                  </button>
                  <button 
                    className="bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1 rounded text-sm flex items-center gap-1"
                    onClick={() => alert('Delete functionality is temporarily unavailable.')}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Device Configuration</h2>
        <div className="p-4 bg-[#F6F8ED] bg-opacity-50 rounded-xl">
          <div className="flex items-start">
            <div>
              <h3 className="text-md font-semibold text-[#002E1F] mb-1">Configuration Tip</h3>
              <p className="text-gray-700 text-sm">
                Make sure the Device ID in your ESP32 firmware's <code>config.h</code> file matches 
                the Device ID you see here (esp32_device_1). Each device needs a unique identifier to properly
                connect to this dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
