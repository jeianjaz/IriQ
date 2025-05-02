"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorInfo, setErrorInfo] = useState<{
    error?: string;
    error_code?: string;
    error_description?: string;
  }>({})
  
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Check for error parameters in the URL
    const error = searchParams.get('error')
    const error_code = searchParams.get('error_code')
    const error_description = searchParams.get('error_description')
    
    if (error) {
      setErrorInfo({
        error,
        error_code,
        error_description: error_description ? decodeURIComponent(error_description.replace(/\+/g, ' ')) : undefined
      })
    }
  }, [searchParams])

  // State to store URL hash parameters
  const [hashParams, setHashParams] = useState<{
    accessToken: string | null;
    refreshToken: string | null;
    type: string | null;
  }>({ accessToken: null, refreshToken: null, type: null })
  
  // Use useEffect to access window object safely
  useEffect(() => {
    // Get the hash fragment from the URL which contains the token
    const hash = window.location.hash
    const params = new URLSearchParams(hash.substring(1))
    
    setHashParams({
      accessToken: params.get('access_token'),
      refreshToken: params.get('refresh_token'),
      type: params.get('type')
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsLoading(true)

    // Validate passwords
    if (password !== confirmPassword) {
      setError("Passwords don't match")
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      setIsLoading(false)
      return
    }

    try {
      const { accessToken, refreshToken, type } = hashParams
      
      if (!accessToken || type !== 'recovery') {
        setError('Invalid or expired password reset link. Please request a new one.')
        return
      }
      
      // Set the session with the recovery tokens
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      })
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        setError('Invalid or expired recovery link. Please request a new password reset.')
        return
      }
      
      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })
      
      if (updateError) {
        console.error('Update error:', updateError)
        setError(updateError.message)
        return
      }
      
      setSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login?reset=success')
      }, 3000)
    } catch (err) {
      console.error('Reset password error:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/agriculture-pattern.svg')] opacity-5"></div>
      
      {/* Back to Login Link */}
      <Link 
        href="/login" 
        className="absolute top-4 left-4 text-[#002E1F] hover:text-[#7AD63D] transition-colors flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back to Login
      </Link>
      
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="text-center mb-8">
              <Link href="/">
                <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Image 
                    src="/logo.svg" 
                    alt="IriQ Logo" 
                    width={80} 
                    height={80} 
                    className="mx-auto"
                    onError={(e) => {
                      // Fallback if logo.svg is not found
                      const target = e.target as HTMLImageElement;
                      target.src = '/iriqfavicon.png';
                    }}
                  />
                </div>
              </Link>
              
              {errorInfo.error ? (
                <>
                  <h2 className="text-2xl font-bold text-[#002E1F] mb-2">Reset Link Error</h2>
                  <p className="text-red-500 mb-4">{errorInfo.error_description || 'Your password reset link is invalid or has expired.'}</p>
                  <div className="mt-4">
                    <Link 
                      href="/forgot-password" 
                      className="text-[#7AD63D] hover:text-[#5fb82f] font-medium"
                    >
                      Request a new password reset link
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-[#002E1F] mb-2">Reset Your Password</h2>
                  <p className="text-gray-600">Enter your new password below</p>
                </>
              )}
            </div>
            
            {!errorInfo.error && (
              <>
                {success ? (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
                    <p>Your password has been reset successfully! Redirecting to login...</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                        <p>{error}</p>
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#7AD63D] focus:border-[#7AD63D] bg-white text-gray-900"
                          placeholder="Enter your new password"
                          required
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Password must be at least 8 characters long</p>
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#7AD63D] focus:border-[#7AD63D] bg-white text-gray-900"
                          placeholder="Confirm your new password"
                          required
                        />
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-[#7AD63D] hover:bg-[#5fb82f] text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7AD63D] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Resetting Password...' : 'Reset Password'}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
