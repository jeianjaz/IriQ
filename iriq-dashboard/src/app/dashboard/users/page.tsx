"use client"

import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth'
import UserManagement from '@/components/dashboard/user-management'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function UserManagementPage() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  
  // Redirect non-admin users
  useEffect(() => {
    if (user && !isAdmin) {
      router.push('/dashboard')
    }
  }, [user, isAdmin, router])
  
  if (!user || !isAdmin) return null
  
  return (
    <div>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-[#002E1F] mb-2">User Management</h1>
        <p className="text-gray-600">
          Manage users and their access permissions.
        </p>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <UserManagement />
      </motion.div>
    </div>
  )
}
