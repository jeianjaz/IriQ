"use client"

import { motion } from 'framer-motion'
import MoistureMonitor from '@/components/dashboard/moisture-monitor'

export default function MoisturePage() {
  return (
    <div>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-[#002E1F] mb-2">Moisture Monitor</h1>
        <p className="text-gray-600">
          View real-time soil moisture levels and status information.
        </p>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <MoistureMonitor />
      </motion.div>
    </div>
  )
}
