"use client"

import { motion } from 'framer-motion'
import UserProfile from '@/components/dashboard/user-profile'

export default function ProfilePage() {
  return (
    <div>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-[#002E1F] mb-2">User Profile</h1>
        <p className="text-gray-600">
          Manage your personal information and account settings.
        </p>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <UserProfile />
      </motion.div>
    </div>
  )
}
