"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

export default function Dashboard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return null
  }

  return (
    <div className="text-center py-8">
      <h1 className="text-2xl font-bold text-[#002E1F] mb-4">Welcome to IriQ Dashboard</h1>
      <p className="text-gray-600 mb-8">
        Use the tabs above to navigate between different sections of your dashboard.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Moisture Status</h3>
          <p className="text-gray-600">Monitor your soil moisture levels in real-time.</p>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Irrigation Control</h3>
          <p className="text-gray-600">Control your irrigation system manually or set it to automatic mode.</p>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Historical Data</h3>
          <p className="text-gray-600">View and analyze historical moisture and irrigation data.</p>
        </div>
      </div>
    </div>
  )
}
