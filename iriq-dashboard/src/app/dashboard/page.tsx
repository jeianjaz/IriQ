"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import MoistureMonitor from '@/components/dashboard/moisture-monitor'
import PumpControl from '@/components/dashboard/pump-control'
import HistoryView from '@/components/dashboard/history-view'
import { DeviceStatus } from '@/components/dashboard/device-status'
import { Database } from '@/lib/database.types'

// Icons
const MoistureIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
)

const PumpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)

const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
)

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const DeviceIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
  </svg>
)

type WidgetWrapperProps = {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  delay: number
  className?: string
  fullHeight?: boolean
}

const WidgetWrapper = ({ title, icon, children, delay, className = '', fullHeight = false }: WidgetWrapperProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`bg-white rounded-xl shadow-md overflow-hidden border border-[#F6F8ED] ${fullHeight ? 'h-full' : ''} ${className}`}
    >
      <div className="p-4 border-b border-[#F6F8ED]">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-[#7AD63D] bg-opacity-20 flex items-center justify-center mr-3 text-[#002E1F]">
            {icon}
          </div>
          <h3 className="text-lg font-bold text-[#002E1F]">{title}</h3>
        </div>
      </div>
      <div className="p-4">
        {children}
      </div>
    </motion.div>
  )
}

type SystemStatusProps = {
  deviceStatus: Database['public']['Tables']['device_status']['Row'] | null
  lastReading: Database['public']['Tables']['sensor_readings']['Row'] | null
}

const SystemStatus = ({ deviceStatus, lastReading }: SystemStatusProps) => {
  if (!deviceStatus || !lastReading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-center">
        <p className="text-gray-500">Loading system status...</p>
      </div>
    )
  }
  
  // Calculate moisture status
  let moistureStatus = 'Normal'
  let moistureColor = 'text-green-600'
  // Use moisture_percentage if available, otherwise use moisture_level (for backward compatibility)
  const moistureLevel = 'moisture_percentage' in lastReading 
    ? lastReading.moisture_percentage 
    : ('moisture_level' in lastReading ? (lastReading as any).moisture_level : 0)
  
  if (moistureLevel < 20) {
    moistureStatus = 'Very Dry'
    moistureColor = 'text-red-600'
  } else if (moistureLevel < 40) {
    moistureStatus = 'Dry'
    moistureColor = 'text-amber-600'
  } else if (moistureLevel > 80) {
    moistureStatus = 'Very Wet'
    moistureColor = 'text-blue-600'
  } else if (moistureLevel > 60) {
    moistureStatus = 'Wet'
    moistureColor = 'text-blue-500'
  }
  
  // Pump status
  const pumpStatus = deviceStatus.pump_status ? 'Active' : 'Inactive'
  const pumpColor = deviceStatus.pump_status ? 'text-green-600' : 'text-gray-600'
  
  // Operation mode
  const operationMode = deviceStatus.automatic_mode ? 'Automatic' : 'Manual'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <span className="text-gray-600">Last Updated:</span>
        <span className="text-gray-800 font-medium">{new Date(lastReading.created_at).toLocaleString()}</span>
      </div>
      
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <span className="text-gray-600">Moisture Level:</span>
        <span className={`font-medium ${moistureColor}`}>{moistureLevel}% ({moistureStatus})</span>
      </div>
      
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <span className="text-gray-600">Pump Status:</span>
        <span className={`font-medium ${pumpColor}`}>{pumpStatus}</span>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-gray-600">Operation Mode:</span>
        <span className="text-gray-800 font-medium">{operationMode}</span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [deviceStatus, setDeviceStatus] = useState<Database['public']['Tables']['device_status']['Row'] | null>(null)
  const [lastReading, setLastReading] = useState<Database['public']['Tables']['sensor_readings']['Row'] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    if (!user) return
    
    const fetchData = async () => {
      setIsLoading(true)
      // Fetch device status for ESP32 device
      const { data: statusData, error: statusError } = await supabase
        .from('device_status')
        .select('*')
        .eq('device_id', 'esp32_device_1')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()
      
      if (statusError) {
        console.error('Error fetching device status:', statusError)
      }
      
      // Fetch latest sensor reading from ESP32 device
      const { data: readingData, error: readingError } = await supabase
        .from('sensor_readings')
        .select('*')
        .eq('device_id', 'esp32_device_1')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
        
      if (readingError) {
        console.error('Error fetching moisture data:', readingError)
      }
      
      setDeviceStatus(statusData)
      setLastReading(readingData)
      setIsLoading(false)
    }
    
    fetchData()
    
    // Set up real-time subscription
    
    const statusSubscription = supabase
      .channel('device_status_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'device_status',
        filter: `device_id=eq.esp32_device_1`
      }, (payload) => {
        setDeviceStatus(payload.new as Database['public']['Tables']['device_status']['Row'])
      })
      .subscribe()
    
    const readingsSubscription = supabase
      .channel('sensor_readings_changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'sensor_readings',
        filter: `device_id=eq.esp32_device_1`
      }, (payload) => {
        setLastReading(payload.new as Database['public']['Tables']['sensor_readings']['Row'])
      })
      .subscribe()
    
    return () => {
      statusSubscription.unsubscribe()
      readingsSubscription.unsubscribe()
    }
  }, [user])
  
  if (!user) return null
  
  const firstName = user.full_name ? user.full_name.split(' ')[0] : 'there'
  const isAdmin = user.role === 'admin'
  
  return (
    <div>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-[#002E1F] mb-2">Welcome, {firstName}!</h1>
        <p className="text-gray-600">
          Here's your IriQ Smart Irrigation dashboard overview.
        </p>
      </motion.div>
      
      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - System Status */}
        <WidgetWrapper
          title="System Status"
          icon={<InfoIcon />}
          delay={0.1}
          className="lg:col-span-1"
        >
          <SystemStatus deviceStatus={deviceStatus} lastReading={lastReading} />
        </WidgetWrapper>
        
        {/* Middle Column - Moisture Monitor */}
        <WidgetWrapper
          title="Moisture Monitor"
          icon={<MoistureIcon />}
          delay={0.2}
          className="lg:col-span-2"
          fullHeight
        >
          <div className="h-[300px]">
            <MoistureMonitor compact />
          </div>
        </WidgetWrapper>
        
        {/* Device Status */}
        <WidgetWrapper
          title="Device Status"
          icon={<DeviceIcon />}
          delay={0.3}
          className="lg:col-span-1"
        >
          <div className="h-[300px]">
            <DeviceStatus compact />
          </div>
        </WidgetWrapper>
        
        {/* Admin Only: Pump Control */}
        {isAdmin && (
          <WidgetWrapper
            title="Pump Control"
            icon={<PumpIcon />}
            delay={0.4}
            className="lg:col-span-1"
          >
            <div className="h-[300px]">
              <PumpControl compact />
            </div>
          </WidgetWrapper>
        )}
        
        {/* History View */}
        <WidgetWrapper
          title="Recent History"
          icon={<HistoryIcon />}
          delay={0.5}
          className={`${isAdmin ? 'lg:col-span-1' : 'lg:col-span-2'}`}
        >
          <div className="h-[300px]">
            <HistoryView compact />
          </div>
        </WidgetWrapper>
      </div>
      
      {/* Quick Tips */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6 p-4 bg-[#F6F8ED] bg-opacity-50 rounded-xl"
      >
        <div className="flex items-start">
          <div className="w-8 h-8 rounded-full bg-[#7AD63D] bg-opacity-30 flex items-center justify-center mr-3 text-[#002E1F]">
            <InfoIcon />
          </div>
          <div>
            <h3 className="text-md font-semibold text-[#002E1F] mb-1">Quick Tip</h3>
            <p className="text-gray-700 text-sm">
              Use the navigation bar at the bottom to access detailed views of each section. All essential information is available at a glance on this dashboard.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
