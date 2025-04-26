"use client"

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'

// Icons
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

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
)

type DashboardCardProps = {
  title: string
  description: string
  icon: React.ReactNode
  href: string
  delay: number
  adminOnly?: boolean
}

const DashboardCard = ({ title, description, icon, href, delay, adminOnly = false }: DashboardCardProps) => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  
  if (adminOnly && !isAdmin) return null
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-xl shadow-md overflow-hidden border border-[#F6F8ED] hover:shadow-lg transition-shadow duration-300"
    >
      <Link href={href} className="block">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-full bg-[#7AD63D] bg-opacity-20 flex items-center justify-center mr-4 text-[#002E1F]">
              {icon}
            </div>
            <h3 className="text-xl font-bold text-[#002E1F]">{title}</h3>
          </div>
          <p className="text-gray-600 mb-6">{description}</p>
          <div className="flex justify-end">
            <motion.div
              whileHover={{ x: 5 }}
              className="flex items-center text-[#7AD63D] font-medium"
            >
              <span className="mr-2">View</span>
              <ArrowRightIcon />
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  
  if (!user) return null
  
  const firstName = user.full_name ? user.full_name.split(' ')[0] : 'there'
  
  return (
    <div>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-[#002E1F] mb-2">Welcome, {firstName}!</h1>
        <p className="text-gray-600">
          Monitor and control your IriQ Smart Irrigation system from this dashboard.
        </p>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard
          title="Moisture Monitor"
          description="View real-time soil moisture levels and status information."
          icon={<MoistureIcon />}
          href="/dashboard/moisture"
          delay={0.1}
        />
        
        <DashboardCard
          title="Pump Control"
          description="Control your irrigation pump and set operation modes."
          icon={<PumpIcon />}
          href="/dashboard/pump"
          delay={0.2}
          adminOnly={true}
        />
        
        <DashboardCard
          title="History View"
          description="View historical moisture data and irrigation events."
          icon={<HistoryIcon />}
          href="/dashboard/history"
          delay={0.3}
        />
        
        <DashboardCard
          title="User Profile"
          description="Manage your personal information and account settings."
          icon={<ProfileIcon />}
          href="/dashboard/profile"
          delay={0.4}
        />
        
        <DashboardCard
          title="User Management"
          description="Manage users and their access permissions."
          icon={<UsersIcon />}
          href="/dashboard/users"
          delay={0.5}
          adminOnly={true}
        />
      </div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 p-6 bg-[#F6F8ED] bg-opacity-50 rounded-xl"
      >
        <div className="flex items-start">
          <div className="w-10 h-10 rounded-full bg-[#7AD63D] bg-opacity-30 flex items-center justify-center mr-4 text-[#002E1F]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#002E1F] mb-2">Quick Tip</h3>
            <p className="text-gray-700">
              Use the sidebar navigation to quickly access different sections of your dashboard. Regular users can view moisture data and history, while administrators have additional control options.  
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
