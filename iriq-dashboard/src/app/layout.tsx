import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import './custom-styles.css' // Import custom styles for gradient adjustments
import { AuthProvider } from '@/lib/auth'
import { NotificationProvider } from '@/lib/notification-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'IriQ',
  description: 'Modern dashboard for monitoring and controlling smart irrigation systems',
  icons: {
    icon: '/iriqfavicon.png',
    apple: '/iriqfavicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
