"use client"

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { motion, AnimatePresence } from 'framer-motion'

export default function UserProfile() {
  const { user, updateProfile } = useAuth()
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setUpdating(true)

    try {
      const { error } = await updateProfile({ full_name: fullName })
      
      if (error) {
        setError(error.message)
        return
      }
      
      setSuccess('Profile updated successfully')
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setUpdating(false)
    }
  }

  if (!user) {
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
          <p className="font-semibold text-lg">Not Logged In</p>
        </div>
        <p className="ml-11 text-sm">Please log in to view and manage your profile information.</p>
        <motion.a
          href="/login"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className="ml-11 mt-3 inline-block px-4 py-2 bg-white text-amber-600 rounded-lg text-sm font-medium shadow-sm hover:bg-amber-50 transition-colors"
        >
          Go to Login
        </motion.a>
      </motion.div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Personal Information Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl shadow-md p-6 border border-[#F6F8ED]"
      >
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-[#7AD63D] bg-opacity-20 flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#002E1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-[#002E1F]">Personal Information</h3>
        </div>
        
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-md mb-6"
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
                onClick={() => setError(null)}
                className="ml-11 mt-3 px-4 py-2 bg-white text-red-600 rounded-lg text-sm font-medium shadow-sm hover:bg-red-50 transition-colors"
              >
                Dismiss
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 text-green-700 px-6 py-4 rounded-xl shadow-md mb-6"
            >
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold text-lg">Success</p>
              </div>
              <p className="ml-11 text-sm">{success}</p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSuccess(null)}
                className="ml-11 mt-3 px-4 py-2 bg-white text-green-600 rounded-lg text-sm font-medium shadow-sm hover:bg-green-50 transition-colors"
              >
                Dismiss
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#F6F8ED] bg-opacity-50 p-5 rounded-xl"
          >
            <label htmlFor="email" className="block text-sm font-semibold text-[#002E1F] mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="email"
                id="email"
                value={user.email}
                disabled
                className="pl-10 w-full py-3 bg-white bg-opacity-70 border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#7AD63D] focus:border-transparent transition-all duration-200"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Your email address cannot be changed
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-5 rounded-xl border border-[#F6F8ED] shadow-sm"
          >
            <label htmlFor="fullName" className="block text-sm font-semibold text-[#002E1F] mb-2">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-10 w-full py-3 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#7AD63D] focus:border-transparent transition-all duration-200"
                placeholder="Enter your full name"
              />
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#F6F8ED] bg-opacity-50 p-5 rounded-xl"
          >
            <label htmlFor="role" className="block text-sm font-semibold text-[#002E1F] mb-2">
              Account Role
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <input
                type="text"
                id="role"
                value={user.role === 'admin' ? 'Administrator' : 'Regular User'}
                disabled
                className="pl-10 w-full py-3 bg-white bg-opacity-70 border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#7AD63D] focus:border-transparent transition-all duration-200"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Account roles can only be changed by administrators
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="pt-2"
          >
            <motion.button
              type="submit"
              disabled={updating}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-gradient-to-r from-[#7AD63D] to-[#5BB62B] text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center"
            >
              {updating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving Changes...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </motion.button>
          </motion.div>
        </form>
      </motion.div>
      
      {/* Account Security Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white rounded-2xl shadow-md p-6 border border-[#F6F8ED]"
      >
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-[#7AD63D] bg-opacity-20 flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#002E1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-[#002E1F]">Account Security</h3>
        </div>
        
        <div className="bg-[#F6F8ED] bg-opacity-30 p-5 rounded-xl mt-4">
          <div className="flex items-start">
            <div className="mt-1 mr-3 text-[#002E1F]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-700">
              To change your password, use the "Forgot Password" feature from the login page to receive a password reset link via email.
            </p>
          </div>
        </div>
        
        <div className="flex mt-6">
          <motion.a 
            href="/forgot-password" 
            target="_blank" 
            rel="noopener noreferrer" 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center px-6 py-3 bg-white border border-[#7AD63D] text-[#002E1F] font-medium rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Reset Password
          </motion.a>
        </div>
      </motion.div>
      
      {/* Device Information Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="bg-white rounded-2xl shadow-md p-6 border border-[#F6F8ED]"
      >
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-[#7AD63D] bg-opacity-20 flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#002E1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-[#002E1F]">Device Information</h3>
        </div>
        
        <div className="space-y-4 mt-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-between items-center p-4 bg-gradient-to-r from-[#F6F8ED] to-white rounded-xl shadow-sm"
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-[#7AD63D] bg-opacity-20 flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#002E1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <span className="text-[#002E1F] font-medium">Device ID:</span>
            </div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="font-mono text-sm bg-white px-4 py-2 rounded-lg border border-[#7AD63D] border-opacity-30 shadow-sm"
            >
              {user.id}
            </motion.div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="flex justify-between items-center p-4 bg-gradient-to-r from-white to-[#F6F8ED] rounded-xl shadow-sm"
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-[#7AD63D] bg-opacity-20 flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#002E1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-[#002E1F] font-medium">Access Level:</span>
            </div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm ${
                user.role === 'admin' 
                  ? 'bg-[#002E1F] text-white' 
                  : 'bg-[#7AD63D] bg-opacity-20 text-[#002E1F]'
              }`}
            >
              {user.role === 'admin' ? 'Full Access' : 'View Only'}
            </motion.div>
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-6 p-4 bg-[#F6F8ED] bg-opacity-30 rounded-xl"
        >
          <div className="flex items-start">
            <div className="mt-1 mr-3 text-[#002E1F]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-700 text-sm">
              Your device ID is used to associate sensor readings and control commands with your account. This ensures that your irrigation system data remains private and secure.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
