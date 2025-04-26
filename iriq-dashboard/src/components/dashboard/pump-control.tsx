"use client"

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { motion, AnimatePresence } from 'framer-motion'

type DeviceStatus = {
  pump_status: boolean
  automatic_mode: boolean
  updated_at: string
}

export default function PumpControl() {
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
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

  const togglePump = async (newStatus: boolean) => {
    if (!user || !deviceStatus || !isAdmin) return
    
    try {
      setIsUpdating(true)
      setError(null)
      
      // Insert a new control command
      const { error } = await supabase
        .from('control_commands')
        .insert({
          device_id: user.id,
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
      setIsUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center"
        >
          <motion.div 
            animate={{ 
              rotate: 360,
              borderRadius: ["20%", "50%", "20%"],
              boxShadow: [
                "0 0 0 rgba(122, 214, 61, 0.2)",
                "0 0 20px rgba(122, 214, 61, 0.5)",
                "0 0 0 rgba(122, 214, 61, 0.2)"
              ]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2,
              ease: "easeInOut" 
            }}
            className="h-16 w-16 bg-[#F6F8ED] flex items-center justify-center mb-4"
          >
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="h-10 w-10 border-4 border-[#7AD63D] rounded-full"
            />
          </motion.div>
          <motion.p 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-[#002E1F] font-medium"
          >
            Loading irrigation system status...
          </motion.p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-md"
      >
        <div className="flex items-center mb-2">
          <div className="w-8 h-8 rounded-full bg-red-200 flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="font-semibold text-lg">Error</p>
        </div>
        <p className="ml-11 text-sm">{error}</p>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className="ml-11 mt-3 px-4 py-2 bg-white text-red-600 rounded-lg text-sm font-medium shadow-sm hover:bg-red-50 transition-colors"
          onClick={() => window.location.reload()}
        >
          Try Again
        </motion.button>
      </motion.div>
    )
  }

  if (!deviceStatus) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 text-amber-700 px-6 py-4 rounded-xl shadow-md"
      >
        <div className="flex items-center mb-2">
          <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="font-semibold text-lg">No Device Status Available</p>
        </div>
        <p className="ml-11 text-sm">The irrigation system hasn't been initialized yet. Please connect your device or contact support.</p>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className="ml-11 mt-3 px-4 py-2 bg-white text-amber-600 rounded-lg text-sm font-medium shadow-sm hover:bg-amber-50 transition-colors"
          onClick={() => window.location.reload()}
        >
          Refresh
        </motion.button>
      </motion.div>
    )
  }

  if (!isAdmin) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="overflow-hidden relative"
      >
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 shadow-md">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#002E1F]">View-only Mode</h3>
              <p className="text-sm text-blue-700">You need admin privileges to control the irrigation system.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-5 shadow-sm border border-blue-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-[#F6F8ED] flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#7AD63D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-[#002E1F] font-medium">Pump Status</span>
                </div>
                <motion.div 
                  animate={deviceStatus.pump_status ? { scale: [1, 1.1, 1], boxShadow: ["0 0 0 rgba(34, 197, 94, 0.2)", "0 0 10px rgba(34, 197, 94, 0.5)", "0 0 0 rgba(34, 197, 94, 0.2)"] } : {}}
                  transition={{ repeat: deviceStatus.pump_status ? Infinity : 0, duration: 2 }}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${deviceStatus.pump_status ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                >
                  {deviceStatus.pump_status ? 'ON' : 'OFF'}
                </motion.div>
              </div>
              
              <div className="h-24 flex items-center justify-center bg-[#F6F8ED]/30 rounded-lg border border-[#F6F8ED]">
                <div className={`h-16 w-16 rounded-full flex items-center justify-center ${deviceStatus.pump_status ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <motion.svg 
                    animate={deviceStatus.pump_status ? { rotate: 360 } : {}}
                    transition={{ repeat: deviceStatus.pump_status ? Infinity : 0, duration: 3, ease: "linear" }}
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-10 w-10 ${deviceStatus.pump_status ? 'text-green-600' : 'text-gray-400'}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </motion.svg>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-5 shadow-sm border border-blue-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-[#F6F8ED] flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#7AD63D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {deviceStatus.automatic_mode ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      )}
                    </svg>
                  </div>
                  <span className="text-[#002E1F] font-medium">Operation Mode</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${deviceStatus.automatic_mode ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                  {deviceStatus.automatic_mode ? 'AUTOMATIC' : 'MANUAL'}
                </span>
              </div>
              
              <div className="h-24 flex items-center justify-center bg-[#F6F8ED]/30 rounded-lg border border-[#F6F8ED]">
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-1">Current Mode</div>
                  <div className="text-lg font-medium text-[#002E1F]">
                    {deviceStatus.automatic_mode ? 'System will water automatically' : 'Manual control required'}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 bg-white rounded-xl p-5 shadow-sm border border-blue-100"
          >
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-[#F6F8ED] flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#7AD63D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-[#002E1F] font-medium">System Status</span>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-[#F6F8ED]/30 p-4 rounded-lg border border-[#F6F8ED]">
              <div>
                <div className="text-sm text-gray-500">Last Updated</div>
                <div className="font-mono text-[#002E1F]">{new Date(deviceStatus.updated_at).toLocaleString()}</div>
              </div>
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-3 md:mt-0 flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 self-start md:self-auto"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5 animate-pulse"></span>
                Real-time monitoring active
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Pump Control Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-md overflow-hidden border border-[#F6F8ED]"
      >
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
            <motion.div 
              animate={deviceStatus.pump_status ? 
                { scale: [1, 1.05, 1], boxShadow: ["0 0 0 rgba(34, 197, 94, 0.2)", "0 0 10px rgba(34, 197, 94, 0.5)", "0 0 0 rgba(34, 197, 94, 0.2)"] } : 
                {}
              }
              transition={{ repeat: deviceStatus.pump_status ? Infinity : 0, duration: 2 }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium ${deviceStatus.pump_status ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
            >
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${deviceStatus.pump_status ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                {deviceStatus.pump_status ? 'ON' : 'OFF'}
              </div>
            </motion.div>
          </div>
          
          <div className="mb-6 p-4 bg-[#F6F8ED]/20 rounded-lg border border-[#F6F8ED]">
            <div className="flex justify-center">
              <motion.div 
                animate={deviceStatus.pump_status ? 
                  { rotate: 360, opacity: 1 } : 
                  { opacity: 0.5 }
                }
                transition={{ 
                  rotate: { repeat: deviceStatus.pump_status ? Infinity : 0, duration: 3, ease: "linear" },
                  opacity: { duration: 0.5 }
                }}
                className="w-20 h-20 relative"
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <path d="M12 6.5C12 5.672 12.672 5 13.5 5C14.328 5 15 5.672 15 6.5C15 7.328 14.328 8 13.5 8C12.672 8 12 7.328 12 6.5Z" fill={deviceStatus.pump_status ? "#7AD63D" : "#9CA3AF"} />
                  <path d="M16.5 10.5C16.5 9.672 17.172 9 18 9C18.828 9 19.5 9.672 19.5 10.5C19.5 11.328 18.828 12 18 12C17.172 12 16.5 11.328 16.5 10.5Z" fill={deviceStatus.pump_status ? "#7AD63D" : "#9CA3AF"} />
                  <path d="M16.5 16.5C16.5 15.672 17.172 15 18 15C18.828 15 19.5 15.672 19.5 16.5C19.5 17.328 18.828 18 18 18C17.172 18 16.5 17.328 16.5 16.5Z" fill={deviceStatus.pump_status ? "#7AD63D" : "#9CA3AF"} />
                  <path d="M12 20.5C12 19.672 12.672 19 13.5 19C14.328 19 15 19.672 15 20.5C15 21.328 14.328 22 13.5 22C12.672 22 12 21.328 12 20.5Z" fill={deviceStatus.pump_status ? "#7AD63D" : "#9CA3AF"} />
                  <path d="M7.5 16.5C7.5 15.672 8.172 15 9 15C9.828 15 10.5 15.672 10.5 16.5C10.5 17.328 9.828 18 9 18C8.172 18 7.5 17.328 7.5 16.5Z" fill={deviceStatus.pump_status ? "#7AD63D" : "#9CA3AF"} />
                  <path d="M7.5 10.5C7.5 9.672 8.172 9 9 9C9.828 9 10.5 9.672 10.5 10.5C10.5 11.328 9.828 12 9 12C8.172 12 7.5 11.328 7.5 10.5Z" fill={deviceStatus.pump_status ? "#7AD63D" : "#9CA3AF"} />
                  <path d="M12 13.5C12 12.672 12.672 12 13.5 12C14.328 12 15 12.672 15 13.5C15 14.328 14.328 15 13.5 15C12.672 15 12 14.328 12 13.5Z" fill={deviceStatus.pump_status ? "#002E1F" : "#4B5563"} />
                </svg>
              </motion.div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-4">
            <motion.button
              whileHover={{ scale: deviceStatus.pump_status ? 1 : 1.02, boxShadow: deviceStatus.pump_status ? "none" : "0 4px 6px rgba(0, 0, 0, 0.1)" }}
              whileTap={{ scale: deviceStatus.pump_status ? 1 : 0.98 }}
              onClick={() => togglePump(true)}
              disabled={deviceStatus.pump_status || isUpdating}
              className={`py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center ${deviceStatus.pump_status ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-[#7AD63D] text-white shadow-sm'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Turn Pump ON
            </motion.button>
            
            <motion.button
              whileHover={{ scale: !deviceStatus.pump_status ? 1 : 1.02, boxShadow: !deviceStatus.pump_status ? "none" : "0 4px 6px rgba(0, 0, 0, 0.1)" }}
              whileTap={{ scale: !deviceStatus.pump_status ? 1 : 0.98 }}
              onClick={() => togglePump(false)}
              disabled={!deviceStatus.pump_status || isUpdating}
              className={`py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center ${!deviceStatus.pump_status ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Turn Pump OFF
            </motion.button>
          </div>
        </div>
      </motion.div>
  
      {/* Operation Mode Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-xl shadow-md overflow-hidden border border-[#F6F8ED]"
      >
        <div className="bg-gradient-to-r from-[#F6F8ED] to-white p-4 border-b border-[#F6F8ED]">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-[#F6F8ED] flex items-center justify-center mr-3 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#7AD63D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {deviceStatus.automatic_mode ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                )}
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
          
          <div className="mb-6 p-4 bg-[#F6F8ED]/20 rounded-lg border border-[#F6F8ED]">
            <div className="flex justify-center">
              <motion.div 
                animate={{ rotate: deviceStatus.automatic_mode ? [0, 360] : [0, 10, -10, 0] }}
                transition={{ 
                  rotate: { 
                    repeat: Infinity, 
                    duration: deviceStatus.automatic_mode ? 10 : 2,
                    ease: deviceStatus.automatic_mode ? "linear" : "easeInOut" 
                  }
                }}
                className="w-20 h-20"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-full w-full ${deviceStatus.automatic_mode ? 'text-blue-600' : 'text-purple-600'}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  {deviceStatus.automatic_mode ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  )}
                </svg>
              </motion.div>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleMode}
            disabled={isUpdating}
            className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''} ${deviceStatus.automatic_mode ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isUpdating ? 'Updating...' : `Switch to ${deviceStatus.automatic_mode ? 'MANUAL' : 'AUTOMATIC'}`}
          </motion.button>
        </div>
      </motion.div>
  
      {/* Operation Modes Explained */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="md:col-span-2 bg-white rounded-xl shadow-md overflow-hidden border border-[#F6F8ED]"
      >
        <div className="bg-gradient-to-r from-[#F6F8ED] to-white p-4 border-b border-[#F6F8ED]">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-[#F6F8ED] flex items-center justify-center mr-3 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#7AD63D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#002E1F]">Operation Modes Explained</h3>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <motion.div 
              whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
              className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200"
            >
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="font-semibold text-blue-800">Automatic Mode</div>
              </div>
              <p className="text-blue-700 ml-11">
                The system will automatically turn the pump on when soil moisture falls below the threshold and off when it reaches optimal levels.
              </p>
              <div className="ml-11 mt-4 text-sm text-blue-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Best for consistent irrigation needs
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
              className="p-5 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200"
            >
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                </div>
                <div className="font-semibold text-purple-800">Manual Mode</div>
              </div>
              <p className="text-purple-700 ml-11">
                You have full control over the pump. The system will not automatically adjust the pump status based on moisture levels.
              </p>
              <div className="ml-11 mt-4 text-sm text-purple-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Best for special watering schedules
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  ); 
}