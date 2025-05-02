"use client"

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Extract the hash fragment from the URL
    const hashFragment = window.location.hash
    
    // Handle the auth callback
    const handleAuthCallback = async () => {
      try {
        // If there's a hash fragment, it's likely an auth callback
        if (hashFragment) {
          // Check if it's an email verification callback
          if (hashFragment.includes('type=signup') || hashFragment.includes('type=recovery')) {
            const { data, error } = await supabase.auth.getSession()
            
            if (error) {
              console.error('Error getting session:', error)
              router.push('/login?error=verification_failed')
              return
            }
            
            if (data.session) {
              // If it's a signup verification, redirect to login with success message
              if (hashFragment.includes('type=signup')) {
                router.push('/login?verified=true')
              } 
              // If it's a password recovery, let the reset-password page handle it
              else if (hashFragment.includes('type=recovery')) {
                // The hash already contains the tokens needed for password reset
                // Just let the page render and handle it
              }
            } else {
              router.push('/login')
            }
          } else {
            // Unknown hash type, redirect to login
            router.push('/login')
          }
        } else {
          // No hash fragment, check for other query parameters
          const error = searchParams.get('error')
          const errorDescription = searchParams.get('error_description')
          
          if (error) {
            console.error('Auth error:', error, errorDescription)
            router.push(`/login?error=${error}&error_description=${errorDescription || ''}`)
          } else {
            router.push('/login')
          }
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        router.push('/login?error=unknown')
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-16 h-16 border-t-4 border-[#7AD63D] border-solid rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Processing authentication...</h2>
        <p className="text-gray-500">Please wait while we verify your account.</p>
      </div>
    </div>
  )
}
