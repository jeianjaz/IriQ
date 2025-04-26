"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { formatDate, getMoistureStatusColor, calculateMoistureStatus } from '@/lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
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

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h3 className="text-lg font-semibold mb-4 md:mb-0">Moisture History</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleDateRangeChange('24h')}
              className={`px-3 py-1 rounded-md text-sm ${
                dateRange === '24h' 
                  ? 'bg-[#7AD63D] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 24 Hours
            </button>
            <button
              onClick={() => handleDateRangeChange('7d')}
              className={`px-3 py-1 rounded-md text-sm ${
                dateRange === '7d' 
                  ? 'bg-[#7AD63D] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => handleDateRangeChange('30d')}
              className={`px-3 py-1 rounded-md text-sm ${
                dateRange === '30d' 
                  ? 'bg-[#7AD63D] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => handleDateRangeChange('custom')}
              className={`px-3 py-1 rounded-md text-sm ${
                dateRange === 'custom' 
                  ? 'bg-[#7AD63D] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custom Range
            </button>
          </div>
        </div>

        {dateRange === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input w-full"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input w-full"
              />
            </div>
          </div>
        )}

        {chartData.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
            <p className="font-medium">No data available</p>
            <p className="text-sm">No moisture readings found for the selected time period.</p>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
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
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fontSize: 12 }}
                  label={{ 
                    value: 'Moisture (%)', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' }
                  }}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, 'Moisture']}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="moisture"
                  stroke="#7AD63D"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Readings Table</h3>
        {chartData.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
            <p className="font-medium">No data available</p>
            <p className="text-sm">No moisture readings found for the selected time period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Moisture (%)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {readings.slice().reverse().map((reading) => {
                  const status = calculateMoistureStatus(reading.moisture_percentage)
                  const statusColor = getMoistureStatusColor(status)
                  
                  return (
                    <tr key={reading.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(reading.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {reading.moisture_percentage}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                          style={{ 
                            backgroundColor: `${statusColor}20`, 
                            color: statusColor 
                          }}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
