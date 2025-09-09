import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const OrganizationCreate = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!user) throw new Error('No authenticated user')

      // Get the current user info (includes UUID)
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()

      if (userError) throw userError
      if (!currentUser) throw new Error('User not found')

      // 1) Create organization with user_id attached
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert([
          {
            name: name,                    // ✅ required
            timezone: "Asia/Kolkata",     // ✅ default value
            user_id: currentUser.id       // ✅ logged-in user's UUID
          }
        ])
        .select('*')
        .single()

      if (orgError) throw orgError

      // 2) Link user to organization (owner)
      const { error: linkError } = await supabase
        .from('users')
        .update({ org_id: org.id })
        .eq('id', currentUser.id)

      if (linkError) throw linkError

      navigate('/dashboard')
    } catch (e) {
      console.error('Error creating organization:', e)
      setError(e.message ?? 'Failed to create organization')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create Your Organization
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Set up your organization to get started with Smart Client Manager
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleCreate}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Organization Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your organization name"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default OrganizationCreate