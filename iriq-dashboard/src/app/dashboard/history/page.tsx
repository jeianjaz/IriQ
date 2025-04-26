"use client"

import { motion } from 'framer-motion'
import HistoryView from '@/components/dashboard/history-view'

export default function HistoryPage() {
  return (
    <div>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-[#002E1F] mb-2">History View</h1>
        <p className="text-gray-600">
          View historical moisture data and irrigation events.
        </p>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <HistoryView />
      </motion.div>
    </div>
  )
}
