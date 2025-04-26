"use client"

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/auth'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsLoading(true)

    try {
      const { error } = await resetPassword(email)
      
      if (error) {
        setError(error.message)
        return
      }
      
      setSuccess(true)
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
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

      <div className="w-full max-w-md z-10">
        <div className="bg-[#F6F8ED] rounded-2xl shadow-xl overflow-hidden border border-[#7AD63D]/20">
          <div className="px-6 pt-10 pb-8 text-center">
            <div className="flex justify-center mb-6">
              <Image 
                src="/iriqlogo-removebg-preview.png" 
                alt="IriQ Logo" 
                width={150} 
                height={150} 
                priority
                className="drop-shadow-md"
              />
            </div>
            <h2 className="text-3xl font-bold text-[#002E1F] mb-2">
              Reset Password
            </h2>
            <p className="text-gray-600 text-base">
              We'll send you a link to reset your password
            </p>
          </div>
          
          <div className="p-8 bg-white rounded-t-3xl border-t border-[#7AD63D]/10">
            {success ? (
              <div className="bg-green-50 border border-green-200 text-green-700 px-5 py-4 rounded-lg" role="alert">
                <div className="flex items-center mb-2">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-bold">Password reset email sent</p>
                </div>
                <p className="text-sm">Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.</p>
                <div className="mt-4">
                  <Link href="/login" className="inline-flex items-center font-medium text-[#7AD63D] hover:text-[#69c52c]">
                    <span>Return to sign in</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
                    <span className="block sm:inline">{error}</span>
                  </div>
                )}
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7AD63D] focus:border-transparent"
                      placeholder="you@example.com"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500 pl-1">
                    Enter the email address associated with your account and we'll send you a link to reset your password.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#7AD63D] hover:bg-[#69c52c] text-white font-medium py-2.5 px-4 rounded-lg transition-colors shadow-md flex justify-center items-center"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : 'Send Reset Link'}
                  </button>
                </div>
                
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600">
                    Remember your password?{' '}
                    <Link href="/login" className="font-medium text-[#7AD63D] hover:text-[#69c52c]">
                      Sign in
                    </Link>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
