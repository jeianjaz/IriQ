"use client"

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { formatDate, getMoistureStatusColor, calculateMoistureStatus } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'

type SensorReading = {
  id: string
  created_at: string
  moisture_percentage: number
  moisture_digital: boolean
}

type DateRange = '24h' | '7d' | '30d' | 'custom'

export default function HistoryView() {
  const [readings, setReadings] = useState<SensorReading[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>('24h')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const fetchHistoricalData = async () => {
      try {
        setLoading(true)
        
        let query = supabase
          .from('sensor_readings')
          .select('*')
          .eq('device_id', user.id)
          .order('created_at', { ascending: true })
        
        // Apply date filtering
        const now = new Date()
        let fromDate: Date | null = null
        
        if (dateRange === '24h') {
          fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        } else if (dateRange === '7d') {
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        } else if (dateRange === '30d') {
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        } else if (dateRange === 'custom' && startDate && endDate) {
          fromDate = new Date(startDate)
          const toDate = new Date(endDate)
          toDate.setHours(23, 59, 59, 999) // End of the day
          query = query.lte('created_at', toDate.toISOString())
        }
        
        if (fromDate) {
          query = query.gte('created_at', fromDate.toISOString())
        }
        
        const { data, error: fetchError } = await query
        
        if (fetchError) throw fetchError
        
        setReadings(data as SensorReading[])
      } catch (err) {
        console.error('Error fetching historical data:', err)
        setError('Failed to fetch historical data')
      } finally {
        setLoading(false)
      }
    }

    fetchHistoricalData()
  }, [user, dateRange, startDate, endDate])

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range)
  }

  const chartData = readings.map(reading => ({
    time: formatDate(reading.created_at),
    moisture: reading.moisture_percentage,
    status: calculateMoistureStatus(reading.moisture_percentage)
  }))

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
            Loading moisture history...
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

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-md overflow-hidden border border-[#F6F8ED]"
      >
        <div className="bg-gradient-to-r from-[#F6F8ED] to-white p-4 border-b border-[#F6F8ED]">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-[#F6F8ED] flex items-center justify-center mr-3 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#7AD63D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#002E1F]">Moisture History</h3>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[#002E1F]/70 mb-4 md:mb-0"
            >
              Select a time period to view moisture data
            </motion.p>
            
            <div className="flex flex-wrap gap-2 bg-[#F6F8ED]/30 p-2 rounded-lg border border-[#F6F8ED]">
              <motion.button
                whileHover={{ scale: dateRange === '24h' ? 1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDateRangeChange('24h')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  dateRange === '24h' 
                    ? 'bg-[#7AD63D] text-white shadow-md' 
                    : 'bg-white text-[#002E1F] hover:bg-[#F6F8ED] shadow-sm'
                }`}
              >
                Last 24 Hours
              </motion.button>
              <motion.button
                whileHover={{ scale: dateRange === '7d' ? 1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDateRangeChange('7d')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  dateRange === '7d' 
                    ? 'bg-[#7AD63D] text-white shadow-md' 
                    : 'bg-white text-[#002E1F] hover:bg-[#F6F8ED] shadow-sm'
                }`}
              >
                Last 7 Days
              </motion.button>
              <motion.button
                whileHover={{ scale: dateRange === '30d' ? 1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDateRangeChange('30d')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  dateRange === '30d' 
                    ? 'bg-[#7AD63D] text-white shadow-md' 
                    : 'bg-white text-[#002E1F] hover:bg-[#F6F8ED] shadow-sm'
                }`}
              >
                Last 30 Days
              </motion.button>
              <motion.button
                whileHover={{ scale: dateRange === 'custom' ? 1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDateRangeChange('custom')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  dateRange === 'custom' 
                    ? 'bg-[#7AD63D] text-white shadow-md' 
                    : 'bg-white text-[#002E1F] hover:bg-[#F6F8ED] shadow-sm'
                }`}
              >
                Custom Range
              </motion.button>
            </div>
          </div>

        {dateRange === 'custom' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 overflow-hidden"
          >
            <div className="bg-white rounded-lg p-4 shadow-sm border border-[#F6F8ED]">
              <label htmlFor="startDate" className="block text-sm font-medium text-[#002E1F] mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#F6F8ED] focus:outline-none focus:ring-2 focus:ring-[#7AD63D]/50 focus:border-[#7AD63D]"
              />
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-[#F6F8ED]">
              <label htmlFor="endDate" className="block text-sm font-medium text-[#002E1F] mb-2">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#F6F8ED] focus:outline-none focus:ring-2 focus:ring-[#7AD63D]/50 focus:border-[#7AD63D]"
              />
            </div>
          </motion.div>
        )}

        {chartData.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 text-amber-700 px-6 py-4 rounded-xl shadow-md"
          >
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-semibold text-lg">No Data Available</p>
            </div>
            <p className="ml-11 text-sm">No moisture readings found for the selected time period.</p>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg p-4 shadow-sm border border-[#F6F8ED] h-80"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="moistureGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7AD63D" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#7AD63D" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F6F8ED" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12, fill: '#002E1F' }}
                  tickFormatter={(value) => {
                    // Simplify the date format for display
                    const date = new Date(value)
                    return date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  }}
                  stroke="#002E1F"
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fontSize: 12, fill: '#002E1F' }}
                  label={{ 
                    value: 'Moisture (%)', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: '#002E1F' }
                  }}
                  stroke="#002E1F"
                />
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, 'Moisture']}
                  labelFormatter={(label) => `Time: ${label}`}
                  contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #F6F8ED' }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="moisture"
                  stroke="#7AD63D"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#moistureGradient)"
                  activeDot={{ r: 8, strokeWidth: 0, fill: '#002E1F' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}
        </div>
      </motion.div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-xl shadow-md overflow-hidden border border-[#F6F8ED]"
      >
        <div className="bg-gradient-to-r from-[#F6F8ED] to-white p-4 border-b border-[#F6F8ED]">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-[#F6F8ED] flex items-center justify-center mr-3 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#7AD63D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#002E1F]">Readings Table</h3>
          </div>
        </div>

        <div className="p-6">
        {chartData.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 text-amber-700 px-6 py-4 rounded-xl shadow-md"
          >
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-semibold text-lg">No Data Available</p>
            </div>
            <p className="ml-11 text-sm">No moisture readings found for the selected time period.</p>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="overflow-x-auto bg-[#F6F8ED]/10 rounded-xl border border-[#F6F8ED]"
          >
            <table className="min-w-full divide-y divide-[#F6F8ED]">
              <thead>
                <tr className="bg-[#F6F8ED]/30">
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#002E1F] uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#002E1F] uppercase tracking-wider">
                    Moisture (%)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#002E1F] uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#F6F8ED]/50">
                {readings.slice().reverse().map((reading, index) => {
                  const status = calculateMoistureStatus(reading.moisture_percentage)
                  const statusColor = getMoistureStatusColor(status)
                  
                  return (
                    <motion.tr 
                      key={reading.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + (index * 0.05), duration: 0.3 }}
                      className="hover:bg-[#F6F8ED]/20 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-[#002E1F]/70">
                        {formatDate(reading.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 h-3 bg-gray-200 rounded-full overflow-hidden mr-2">
                            <div 
                              className="h-full rounded-full" 
                              style={{ 
                                width: `${reading.moisture_percentage}%`,
                                backgroundColor: statusColor
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-[#002E1F]">
                            {reading.moisture_percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                          style={{ 
                            backgroundColor: `${statusColor}20`, 
                            color: statusColor 
                          }}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </motion.div>
        )}
        </div>
      </motion.div>
    </motion.div>
  )
}
