"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'
import Notification from '@/components/ui/notification'

type NotificationType = 'success' | 'error' | 'info'

interface NotificationData {
  id: string
  type: NotificationType
  message: string
  duration?: number
}

interface NotificationContextType {
  notifications: NotificationData[]
  showNotification: (type: NotificationType, message: string, duration?: number) => void
  hideNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationData[]>([])

  const showNotification = (type: NotificationType, message: string, duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9)
    setNotifications(prev => [...prev, { id, type, message, duration }])
  }

  const hideNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  return (
    <NotificationContext.Provider value={{ notifications, showNotification, hideNotification }}>
      {children}
      <div className="notification-container">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            type={notification.type}
            message={notification.message}
            duration={notification.duration}
            onClose={() => hideNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}
