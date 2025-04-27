"use client"

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth'

// Icons
const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const MoistureIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
)

const PumpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)

const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
)

const ProfileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

type NavItem = {
  name: string
  href: string
  icon: React.ReactNode
  adminOnly?: boolean
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: <DashboardIcon /> },
  { name: 'Moisture Monitor', href: '/dashboard/moisture', icon: <MoistureIcon /> },
  { name: 'Pump Control', href: '/dashboard/pump', icon: <PumpIcon />, adminOnly: true },
  { name: 'History', href: '/dashboard/history', icon: <HistoryIcon /> },
  { name: 'Profile', href: '/dashboard/profile', icon: <ProfileIcon /> },
  { name: 'User Management', href: '/dashboard/users', icon: <UsersIcon />, adminOnly: true },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [navTooltip, setNavTooltip] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut, isLoading } = useAuth()
  
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-t-4 border-[#7AD63D] border-solid rounded-full animate-spin"></div>
          <p className="text-[#002E1F] font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  const isAdmin = user.role === 'admin'
  const filteredNavigation = navigation.filter(item => !item.adminOnly || (item.adminOnly && isAdmin))

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="relative flex flex-col h-screen bg-white overflow-hidden">
      {/* Top Header with Logo */}
      <header className="flex items-center justify-between px-6 py-3 bg-white/95 backdrop-blur-md border-b border-[#F6F8ED] z-10 sticky top-0 shadow-sm">
        <div className="flex items-center">
          <Link href="/dashboard" className="flex items-center relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-[#7AD63D]/20 to-[#F6F8ED]/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <Image
              src="/iriqlogo-removebg-preview.png"
              alt="IriQ Logo"
              width={100}
              height={100}
              className="h-14 w-auto relative"
              priority
            />
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center bg-[#F6F8ED] px-3 py-1.5 rounded-full text-sm text-[#002E1F]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-[#7AD63D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
          
          <div className="relative group">
            <div className="flex items-center cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7AD63D] to-[#5EB82D] flex items-center justify-center text-white font-semibold shadow-md">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="ml-2 hidden md:block">
                <p className="text-sm font-medium text-gray-700 line-clamp-1">{user?.full_name || user?.email?.split('@')[0]}</p>
                <p className="text-xs text-[#7AD63D] capitalize">{user?.role}</p>
              </div>
            </div>
            
            <div className="absolute right-0 w-56 mt-2 origin-top-right bg-white border border-[#F6F8ED] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
              <div className="py-3">
                <div className="px-4 py-2 text-sm">
                  <p className="font-medium text-gray-700">{user?.full_name || user?.email}</p>
                  <p className="text-xs text-[#7AD63D] font-medium capitalize">{user?.role} Account</p>
                </div>
                <hr className="my-2 border-[#F6F8ED]" />
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-[#F6F8ED] transition-colors"
                >
                  <LogoutIcon />
                  <span className="ml-2">Sign out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area with Padding Bottom for Navigation */}
      <main className="flex-1 px-4 sm:px-6 md:px-8 pb-28 pt-4 overflow-y-auto bg-gradient-to-b from-white to-[#F6F8ED]/30">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-7xl mx-auto"
        >
          {children}
        </motion.div>
      </main>

      {/* Floating Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <motion.div 
          className="flex items-center bg-white/90 backdrop-blur-md rounded-full shadow-xl px-3 py-3 border border-[#F6F8ED]"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const isAdminItem = item.adminOnly
            
            return (
              <div key={item.name} className="relative">
                <Link
                  href={item.href}
                  className={`relative flex flex-col items-center justify-center w-16 h-16 mx-1 p-2 rounded-full transition-all duration-300 ${
                    isActive
                      ? isAdminItem 
                        ? 'text-[#7AD63D] bg-[#002E1F]/10 ring-2 ring-[#7AD63D]'
                        : 'text-[#7AD63D] bg-[#F6F8ED] ring-1 ring-[#7AD63D]/30'
                      : isAdminItem
                        ? 'text-gray-600 hover:text-[#7AD63D] hover:bg-[#002E1F]/5 ring-1 ring-gray-200'
                        : 'text-gray-600 hover:text-[#7AD63D] hover:bg-[#F6F8ED]'
                  }`}
                  onMouseEnter={() => setNavTooltip(item.name)}
                  onMouseLeave={() => setNavTooltip(null)}
                >
                  <div className="text-current relative">
                    {item.icon}
                    {isAdminItem && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#7AD63D] rounded-full"></span>
                    )}
                  </div>
                  {navTooltip === item.name && (
                    <motion.div 
                      className={`absolute -top-12 left-1/2 transform -translate-x-1/2 ${isAdminItem ? 'bg-[#002E1F]' : 'bg-[#7AD63D]'} text-white text-xs px-3 py-1.5 rounded-full whitespace-nowrap font-medium shadow-md`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      {item.name}
                      {isAdminItem && (
                        <span className="ml-1 text-[8px] bg-white/20 px-1 py-0.5 rounded-sm">ADMIN</span>
                      )}
                    </motion.div>
                  )}
                </Link>
              </div>
            )
          })}
        </motion.div>
      </nav>
    </div>
  )
}
