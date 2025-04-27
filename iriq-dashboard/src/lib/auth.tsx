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

          if (profileError) throw profileError

          setUser({
            id: session.user.id,
            email: session.user.email!,
            role: data.role,
            full_name: data.full_name
          })
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
              console.error('Error fetching profile:', error)
              setUser(null)
              return
            }

            console.log('Profile fetched successfully:', data)
            setUser({
              id: session.user.id,
              email: session.user.email!,
              role: data.role,
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      console.log('Sign in response:', data ? 'Success' : 'Failed', error ? error : 'No error')
      
      if (error) {
        console.error('Sign in error:', error)
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) return { error }

      if (data.user) {
        // Create a profile entry with default role 'user'
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email,
            full_name: fullName,
            role: 'user',
          })

        if (profileError) return { error: profileError }
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      return { error }
    } catch (error) {
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
