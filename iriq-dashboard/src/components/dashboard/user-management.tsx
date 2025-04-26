"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'

type UserProfile = {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'user'
  created_at: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const { user, isAdmin } = useAuth()

  useEffect(() => {
    if (!user || !isAdmin) return

    const fetchUsers = async () => {
      try {
        setLoading(true)
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        
        setUsers(data as UserProfile[])
      } catch (err) {
        console.error('Error fetching users:', err)
        setError('Failed to fetch users')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [user, isAdmin])

  const updateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    if (!user || !isAdmin) return
    
    try {
      setUpdating(true)
      setError(null)
      
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)
      
      if (error) throw error
      
      // Update the local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ))
    } catch (err) {
      console.error('Error updating user role:', err)
      setError('Failed to update user role')
    } finally {
      setUpdating(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
        <p className="font-medium">Access Denied</p>
        <p className="text-sm">You need administrator privileges to manage users.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#7AD63D]"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p className="font-medium">Error</p>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">User Management</h3>
        <p className="text-gray-600 mb-4">
          As an administrator, you can manage user roles and access levels.
        </p>
        
        {users.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
            <p className="font-medium">No users found</p>
            <p className="text-sm">There are no users registered in the system.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((userProfile) => (
                  <tr key={userProfile.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {userProfile.full_name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{userProfile.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        userProfile.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {userProfile.role === 'admin' ? 'Administrator' : 'Regular User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(userProfile.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {userProfile.id !== user?.id && (
                        <button
                          onClick={() => updateUserRole(
                            userProfile.id, 
                            userProfile.role === 'admin' ? 'user' : 'admin'
                          )}
                          disabled={updating}
                          className="text-[#7AD63D] hover:text-[#69c52c]"
                        >
                          {updating ? 'Updating...' : `Make ${userProfile.role === 'admin' ? 'User' : 'Admin'}`}
                        </button>
                      )}
                      {userProfile.id === user?.id && (
                        <span className="text-gray-400">Current User</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Role Permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
            <div className="font-medium text-purple-700 mb-2">Administrator</div>
            <ul className="text-sm text-purple-600 space-y-1 list-disc pl-5">
              <li>View real-time moisture data</li>
              <li>Control irrigation system (pump)</li>
              <li>View historical data</li>
              <li>Manage user accounts</li>
              <li>Change system settings</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
            <div className="font-medium text-blue-700 mb-2">Regular User</div>
            <ul className="text-sm text-blue-600 space-y-1 list-disc pl-5">
              <li>View real-time moisture data</li>
              <li>View historical data</li>
              <li>Update personal profile</li>
              <li>Cannot control irrigation system</li>
              <li>Cannot manage other users</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
