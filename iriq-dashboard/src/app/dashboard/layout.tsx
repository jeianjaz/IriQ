"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'

// Import dashboard components
import MoistureMonitor from '@/components/dashboard/moisture-monitor'
import PumpControl from '@/components/dashboard/pump-control'
import HistoryView from '@/components/dashboard/history-view'
import UserProfile from '@/components/dashboard/user-profile'
import UserManagement from '@/components/dashboard/user-management'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [activeTab, setActiveTab] = useState('monitor')
  const { user, isLoading, isAdmin, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F8ED]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7AD63D]"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const tabs = [
    { id: 'monitor', label: 'Monitor', icon: 'chart-bar', adminOnly: false },
    { id: 'control', label: 'Control', icon: 'switch-horizontal', adminOnly: true },
    { id: 'history', label: 'History', icon: 'clock', adminOnly: false },
    { id: 'profile', label: 'Profile', icon: 'user', adminOnly: false },
    { id: 'users', label: 'Users', icon: 'users', adminOnly: true },
  ]

  const filteredTabs = tabs.filter(tab => !tab.adminOnly || isAdmin)

  return (
    <div className="min-h-screen bg-[#F6F8ED]">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-[#7AD63D] flex items-center justify-center mr-2">
                  <span className="text-white font-bold">I</span>
                </div>
                <Link href="/" className="text-2xl font-bold text-[#002E1F]">
                  IriQ
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-[#F6F8ED] rounded-full px-3 py-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#002E1F] mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-[#002E1F]">
                  {user.full_name || user.email}
                </span>
              </div>
              <button 
                onClick={() => signOut()}
                className="text-sm bg-[#002E1F] text-white px-3 py-1 rounded-md hover:bg-[#002E1F]/90 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard overview */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#002E1F] mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome to your IriQ Smart Irrigation control center.</p>
        </div>
        
        {/* Tabs */}
        <div className="mb-6 bg-white rounded-t-lg shadow-sm">
          <nav className="flex" aria-label="Tabs">
            {filteredTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center whitespace-nowrap py-4 px-6 font-medium text-sm flex-1 justify-center
                  ${activeTab === tab.id
                    ? 'bg-[#7AD63D]/10 text-[#002E1F] border-b-2 border-[#7AD63D]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#002E1F]'}
                  transition-colors
                `}
              >
                {/* Icon would go here */}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Dashboard content */}
        <div className="bg-white shadow rounded-b-lg p-6">
          {activeTab === 'monitor' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Moisture Monitor</h2>
              <MoistureMonitor />
            </div>
          )}

          {activeTab === 'control' && isAdmin && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Pump Control</h2>
              <PumpControl />
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">History View</h2>
              <HistoryView />
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">User Profile</h2>
              <UserProfile />
            </div>
          )}

          {activeTab === 'users' && isAdmin && (
            <div>
              <h2 className="text-xl font-semibold mb-4">User Management</h2>
              <UserManagement />
            </div>
          )}

          {/* Render children */}
          {children}
        </div>
      </div>
    </div>
  )
}
