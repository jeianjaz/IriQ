"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from './supabase'
import { useRouter } from 'next/navigation'

type User = {
  id: string
  email: string
  role: 'admin' | 'user'
  full_name: string | null
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updateProfile: (data: { full_name?: string }) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          throw error
        }

        if (session?.user) {
          // Fetch user profile data including role
          const { data, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profileError) {
            console.log('Initial profile check: Profile not found, using user metadata instead')
            // Use metadata from the user object as fallback
            const userData = session.user.user_metadata
            
            setUser({
              id: session.user.id,
              email: session.user.email!,
              role: userData?.role || 'user',
              full_name: userData?.full_name || ''
            })
          } else {
            setUser({
              id: session.user.id,
              email: session.user.email!,
              role: data.role || 'user',
              full_name: data.full_name
            })
          }
        }
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session ? 'Session exists' : 'No session')
        
        if (session?.user) {
          console.log('User in session:', session.user.id, session.user.email)
          
          try {
            // Fetch user profile data including role
            console.log('Fetching profile for user:', session.user.id)
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (error) {
              console.log('Profile not found, using user metadata instead')
              // Use metadata from the user object as fallback
              const userData = session.user.user_metadata
              
              setUser({
                id: session.user.id,
                email: session.user.email!,
                role: userData?.role || 'user',
                full_name: userData?.full_name || ''
              })
              return
            }

            console.log('Profile fetched successfully:', data)
            setUser({
              id: session.user.id,
              email: session.user.email!,
              role: data.role || 'user',
              full_name: data.full_name
            })
          } catch (err) {
            console.error('Exception while fetching profile:', err)
            setUser(null)
          }
        } else {
          console.log('No user in session')
          setUser(null)
        }
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in with:', email)
      
      // We'll skip user existence check as it requires admin privileges
      // Just log that we're attempting to sign in
      console.log('Proceeding with login attempt for:', email)
      
      // Attempt to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      console.log('Sign in response:', data ? 'Success' : 'Failed', error ? error : 'No error')
      
      if (error) {
        console.error('Sign in error:', error)
        
        // Handle specific error cases
        if (error.message.includes('Invalid login credentials')) {
          console.log('This could be due to unconfirmed email or incorrect password')
        }
      } else if (data.user) {
        console.log('User signed in successfully:', data.user.id)
      }
      
      return { error }
    } catch (error) {
      console.error('Exception during sign in:', error)
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log('Starting signup process for:', email)
      
      // Create the auth user with metadata and auto-confirm for development
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'user', // Store role in user metadata
          },
          // For development, we'll auto-confirm users
          emailRedirectTo: `${window.location.origin}/login`,
        },
      })

      if (error) {
        console.error('Signup error:', error)
        return { error }
      }

      if (data.user) {
        console.log('User created successfully:', data.user.id, 'Session:', data.session ? 'Yes' : 'No')
        
        // For development purposes, let's try to immediately sign in the user
        // This is a workaround for the email confirmation requirement
        if (!data.session) {
          console.log('Attempting immediate login for development...')
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          })
          
          if (signInError) {
            console.log('Immediate login failed, user will need to verify email:', signInError)
          } else {
            console.log('Immediate login successful for development')
          }
        }
      }

      return { error: null }
    } catch (error) {
      console.error('Signup exception:', error)
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const resetPassword = async (email: string) => {
    try {
      console.log('Requesting password reset for:', email)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      
      if (error) {
        console.error('Password reset error:', error)
      } else {
        console.log('Password reset email sent successfully')
      }
      
      return { error }
    } catch (error) {
      console.error('Exception during password reset:', error)
      return { error: error as Error }
    }
  }

  const updateProfile = async (data: { full_name?: string }) => {
    try {
      if (!user) return { error: new Error('No user logged in') }

      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id)

      if (!error) {
        setUser({
          ...user,
          ...data,
        })
      }

      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const isAdmin = user?.role === 'admin'

  const value = {
    user,
    isLoading,
    isAdmin,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
