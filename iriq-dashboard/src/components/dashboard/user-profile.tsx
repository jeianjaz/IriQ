"use client"

import { useState } from 'react'
import { useAuth } from '@/lib/auth'

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
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
        <p className="font-medium">Not logged in</p>
        <p className="text-sm">Please log in to view your profile.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            <p className="font-medium">Success</p>
            <p className="text-sm">{success}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={user.email}
              disabled
              className="input w-full bg-gray-50"
            />
            <p className="mt-1 text-xs text-gray-500">
              Your email address cannot be changed
            </p>
          </div>
          
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input w-full"
            />
          </div>
          
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Account Role
            </label>
            <input
              type="text"
              id="role"
              value={user.role === 'admin' ? 'Administrator' : 'Regular User'}
              disabled
              className="input w-full bg-gray-50"
            />
            <p className="mt-1 text-xs text-gray-500">
              Account roles can only be changed by administrators
            </p>
          </div>
          
          <div className="pt-2">
            <button
              type="submit"
              disabled={updating}
              className="btn-primary"
            >
              {updating ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
      
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Account Security</h3>
        <p className="text-gray-600 mb-4">
          To change your password, use the "Forgot Password" feature from the login page to receive a password reset link via email.
        </p>
        <div className="flex">
          <a href="/forgot-password" target="_blank" rel="noopener noreferrer" className="btn-secondary">
            Reset Password
          </a>
        </div>
      </div>
      
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Device Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Device ID:</span>
            <span className="font-mono text-sm bg-white px-3 py-1 rounded border border-gray-200">
              {user.id}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Access Level:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              user.role === 'admin' 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {user.role === 'admin' ? 'Full Access' : 'View Only'}
            </span>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Your device ID is used to associate sensor readings and control commands with your account.
        </p>
      </div>
    </div>
  )
}
