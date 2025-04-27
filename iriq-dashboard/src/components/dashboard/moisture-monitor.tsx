"use client"

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { calculateMoistureStatus, getMoistureStatusColor } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'

type MoistureData = {
  moisture_percentage: number
  moisture_digital: boolean
  created_at: string
}

export default function MoistureMonitor({ compact = false }: { compact?: boolean } = {}) {
  const [moistureData, setMoistureData] = useState<MoistureData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const fetchMoistureData = async () => {
      try {
        setLoading(true)
        
        // Fetch the latest moisture reading for the user's device
        const { data, error } = await supabase
          .from('sensor_readings')
          .select('*')
          .eq('device_id', user.id) // Assuming device_id is the same as user_id
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        if (error) throw error
        
        setMoistureData(data as MoistureData)
      } catch (err) {
        console.error('Error fetching moisture data:', err)
        setError('Failed to fetch moisture data')
      } finally {
        setLoading(false)
      }
    }

    fetchMoistureData()

    // Set up real-time subscription
    const subscription = supabase
      .channel('sensor_readings_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_readings',
          filter: `device_id=eq.${user.id}`
        },
        (payload) => {
          // Update the state with the new reading
          setMoistureData(payload.new as MoistureData)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

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

  if (!moistureData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
        <p className="font-medium">No data available</p>
        <p className="text-sm">No moisture readings have been recorded yet.</p>
      </div>
    )
  }

  const moistureStatus = calculateMoistureStatus(moistureData.moisture_percentage)
  const statusColor = getMoistureStatusColor(moistureStatus)
  const lastUpdated = new Date(moistureData.created_at).toLocaleString()

  // Render a compact version for the dashboard widget
  if (compact) {
    return (
      <div className="h-full flex flex-col justify-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-32 h-32">
            <CircularProgressbar
              value={moistureData.moisture_percentage}
              text={`${moistureData.moisture_percentage}%`}
              styles={buildStyles({
                textSize: '16px',
                pathColor: statusColor,
                textColor: '#002E1F',
                trailColor: '#F6F8ED',
              })}
            />
          </div>
        </div>
        <div className="text-center">
          <motion.span 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${statusColor === '#7AD63D' ? 'bg-green-100 text-green-800' : statusColor === '#F59E0B' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}
          >
            {moistureStatus}
          </motion.span>
          <p className="text-xs text-gray-500 mt-2">Last updated: {lastUpdated}</p>
        </div>
      </div>
    )
  }

  // Full version
  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-[0_10px_20px_rgba(0,46,31,0.05)] overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#7AD63D] to-[#7AD63D]/60"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1 font-medium">Current Moisture</p>
              <div className="flex items-baseline">
                <h3 className="text-3xl font-bold text-[#002E1F]">{moistureData.moisture_percentage}</h3>
                <span className="text-xl text-[#002E1F]/70 ml-1">%</span>
              </div>
            </div>
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="h-14 w-14 bg-[#F6F8ED] rounded-full flex items-center justify-center shadow-inner"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[#7AD63D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </motion.div>
          </div>
          <div className="mt-6">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${moistureData.moisture_percentage}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className="h-2 rounded-full bg-gradient-to-r from-[#7AD63D] to-[#7AD63D]/60 mb-2"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
          <div className="mt-4">
            <motion.span 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm"
              style={{ backgroundColor: `${statusColor}20`, color: statusColor, boxShadow: `0 0 10px ${statusColor}30` }}
            >
              <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: statusColor, boxShadow: `0 0 5px ${statusColor}` }}></span>
              {moistureStatus.charAt(0).toUpperCase() + moistureStatus.slice(1)}
            </motion.span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-[0_10px_20px_rgba(0,46,31,0.05)] overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-300"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1 font-medium">Digital Reading</p>
              <h3 className="text-3xl font-bold text-[#002E1F]">{moistureData.moisture_digital ? 'Dry' : 'Wet'}</h3>
            </div>
            <motion.div 
              whileHover={{ scale: 1.1, rotate: -5 }}
              className="h-14 w-14 bg-[#F6F8ED] rounded-full flex items-center justify-center shadow-inner"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>
          </div>
          <div className="mt-6 flex justify-center">
            <div className="relative w-16 h-8 flex items-center bg-gray-200 rounded-full px-1 py-1">
              <motion.div 
                animate={{ 
                  x: moistureData.moisture_digital ? 32 : 0,
                  backgroundColor: moistureData.moisture_digital ? '#f87171' : '#4ade80'
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="w-6 h-6 rounded-full shadow-md z-10"
              />
              <div className="absolute inset-0 flex justify-between items-center px-2">
                <span className="text-[10px] font-medium text-green-800">Wet</span>
                <span className="text-[10px] font-medium text-red-800">Dry</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <motion.span 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.6 }}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm ${moistureData.moisture_digital ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}
              style={{ boxShadow: moistureData.moisture_digital ? '0 0 10px rgba(248, 113, 113, 0.3)' : '0 0 10px rgba(74, 222, 128, 0.3)' }}
            >
              <span className={`w-2 h-2 rounded-full mr-1.5 ${moistureData.moisture_digital ? 'bg-red-500' : 'bg-green-500'}`} style={{ boxShadow: moistureData.moisture_digital ? '0 0 5px rgba(248, 113, 113, 0.5)' : '0 0 5px rgba(74, 222, 128, 0.5)' }}></span>
              {moistureData.moisture_digital ? 'Needs Water' : 'Adequately Watered'}
            </motion.span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-[0_10px_20px_rgba(0,46,31,0.05)] overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-300"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1 font-medium">Last Updated</p>
              <h3 className="text-2xl font-bold text-[#002E1F] truncate">{new Date(moistureData.created_at).toLocaleTimeString()}</h3>
            </div>
            <motion.div 
              animate={{ rotate: [0, 5, 0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="h-14 w-14 bg-[#F6F8ED] rounded-full flex items-center justify-center shadow-inner"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>
          </div>
          <div className="mt-6 flex justify-center">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Last data received</div>
              <div className="bg-[#F6F8ED] px-4 py-2 rounded-lg font-mono text-sm text-[#002E1F]">
                {new Date(moistureData.created_at).toLocaleString()}
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-purple-50 text-purple-600"
            >
              <span className="w-2 h-2 rounded-full bg-purple-500 mr-1.5 animate-pulse"></span>
              Real-time monitoring active
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Moisture Gauge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="md:col-span-1 bg-white rounded-xl p-6 shadow-[0_10px_20px_rgba(0,46,31,0.05)] overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#7AD63D] to-[#7AD63D]/60"></div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-[#002E1F]">Moisture Gauge</h3>
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="h-8 w-8 bg-[#F6F8ED] rounded-full flex items-center justify-center shadow-inner"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#7AD63D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>
          </div>
          <div className="flex items-center justify-center py-2">
            <div className="w-48 h-48 relative">
              <CircularProgressbar
                value={moistureData.moisture_percentage}
                text={`${moistureData.moisture_percentage}%`}
                circleRatio={0.75}
                styles={buildStyles({
                  rotation: 1 / 2 + 1 / 8,
                  strokeLinecap: 'round',
                  textSize: '16px',
                  pathTransitionDuration: 1,
                  pathColor: statusColor,
                  textColor: '#002E1F',
                  trailColor: '#F6F8ED',
                })}
              />
              <motion.div 
                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-md border border-gray-100"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                <span className="text-sm font-medium" style={{ color: statusColor }}>{moistureStatus}</span>
              </motion.div>
            </div>
          </div>
          <div className="mt-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-blue-50 p-2 rounded-lg">
                <div className="text-xs text-blue-500 font-medium">Wet</div>
                <div className="text-sm text-blue-700">80-100%</div>
              </div>
              <div className="bg-green-50 p-2 rounded-lg">
                <div className="text-xs text-green-500 font-medium">Ideal</div>
                <div className="text-sm text-green-700">40-80%</div>
              </div>
              <div className="bg-red-50 p-2 rounded-lg">
                <div className="text-xs text-red-500 font-medium">Dry</div>
                <div className="text-sm text-red-700">0-40%</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Moisture History Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="md:col-span-2 bg-white rounded-xl p-6 shadow-[0_10px_20px_rgba(0,46,31,0.05)] overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#7AD63D] to-[#7AD63D]/60"></div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-[#002E1F]">Moisture History</h3>
            <div className="flex space-x-2">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-1 text-xs font-medium bg-[#F6F8ED] text-[#002E1F] rounded-full hover:bg-[#7AD63D]/20"
              >
                Day
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-1 text-xs font-medium bg-[#7AD63D]/20 text-[#002E1F] rounded-full hover:bg-[#7AD63D]/30"
              >
                Week
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-1 text-xs font-medium bg-[#F6F8ED] text-[#002E1F] rounded-full hover:bg-[#7AD63D]/20"
              >
                Month
              </motion.button>
            </div>
          </div>
          <div className="h-64 bg-gradient-to-b from-[#F6F8ED]/50 to-white rounded-lg flex items-center justify-center border border-[#F6F8ED]">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#7AD63D] mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-[#002E1F] font-medium">Historical data chart will be displayed here</p>
                <p className="text-sm text-gray-500 mt-2">Connect your device to see moisture trends</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-4 px-4 py-2 bg-[#7AD63D] text-white rounded-lg text-sm font-medium shadow-md hover:bg-[#7AD63D]/90"
                >
                  Connect Device
                </motion.button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Additional Information */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-white rounded-xl p-6 shadow-[0_10px_20px_rgba(0,46,31,0.05)] overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#7AD63D] to-[#7AD63D]/60"></div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-[#002E1F]">Moisture Details</h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-xs px-3 py-1 bg-[#F6F8ED] text-[#002E1F] rounded-full flex items-center space-x-1 hover:bg-[#7AD63D]/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </motion.button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-[#F6F8ED]/50 to-white border border-[#F6F8ED]"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-[#F6F8ED] flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#7AD63D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm text-[#002E1F]">Moisture Status</span>
              </div>
              <span 
                className="font-medium text-sm px-3 py-1 rounded-full"
                style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
              >
                {moistureStatus.charAt(0).toUpperCase() + moistureStatus.slice(1)}
              </span>
            </motion.div>
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-[#F6F8ED]/50 to-white border border-[#F6F8ED]"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-[#F6F8ED] flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm text-[#002E1F]">Digital Reading</span>
              </div>
              <span className={`font-medium text-sm px-3 py-1 rounded-full ${moistureData.moisture_digital ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {moistureData.moisture_digital ? 'Dry (1)' : 'Wet (0)'}
              </span>
            </motion.div>
          </div>
          <div className="space-y-4">
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-[#F6F8ED]/50 to-white border border-[#F6F8ED]"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-[#F6F8ED] flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#7AD63D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <span className="text-sm text-[#002E1F]">Analog Reading</span>
              </div>
              <span className="font-medium text-sm px-3 py-1 rounded-full bg-[#002E1F]/10 text-[#002E1F]">{moistureData.moisture_percentage}%</span>
            </motion.div>
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-[#F6F8ED]/50 to-white border border-[#F6F8ED]"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-[#F6F8ED] flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm text-[#002E1F]">Last Updated</span>
              </div>
              <span className="font-medium text-sm px-3 py-1 rounded-full bg-[#002E1F]/10 text-[#002E1F]">{new Date(moistureData.created_at).toLocaleTimeString()}</span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 shadow-sm">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="font-medium text-blue-700">Wet (80-100%)</div>
          </div>
          <p className="text-sm text-blue-600 ml-10">Soil is very wet, avoid watering to prevent root rot and fungal diseases.</p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200 shadow-sm">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="font-medium text-green-700">Ideal (40-80%)</div>
          </div>
          <p className="text-sm text-green-600 ml-10">Soil moisture is optimal for most plants, providing good growing conditions.</p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200 shadow-sm">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-full bg-red-200 flex items-center justify-center mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="font-medium text-red-700">Dry (0-40%)</div>
          </div>
          <p className="text-sm text-red-600 ml-10">Soil is dry, plants may be stressed. Consider watering soon to prevent wilting.</p>
        </div>
      </motion.div>
    </div>
  )
}
