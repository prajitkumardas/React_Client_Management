import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [organization, setOrganization] = useState(null)
  const [orgLoading, setOrgLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchUserOrganization(session.user.id)
      } else {
        setOrgLoading(false)
      }

      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchUserOrganization(session.user.id)
        } else {
          setOrganization(null)
          setOrgLoading(false)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserOrganization = async (userId) => {
    try {
      setOrgLoading(true)

      // Fetch organization directly by user_id
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', userId)
        .limit(1)

      if (error) throw error

      if (orgs && orgs.length > 0) {
        setOrganization(orgs[0]) // ✅ found organization
      } else {
        setOrganization(null) // ❌ no organization found
      }
    } catch (error) {
      console.error('Error fetching user organization:', error)
      setOrganization(null)
    } finally {
      setOrgLoading(false)
    }
  }

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signUp = async (email, password, organizationName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })

      if (error) throw error

      // Create organization and user record using database function
      if (data.user) {
        const { data: signupResult, error: signupError } = await supabase.rpc(
          'handle_user_signup',
          {
            user_id: data.user.id,
            user_email: data.user.email,
            org_name: organizationName
          }
        )

        if (signupError) {
          console.error('Signup error:', signupError)
          throw signupError
        }

        if (signupResult && !signupResult.success) {
          console.error('Signup failed:', signupResult.error)
          throw new Error(signupResult.error || 'Signup failed')
        }
      }

      return { data, error: null }
    } catch (error) {
      console.error('SignUp error:', error)
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setOrganization(null)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const value = {
    user,
    organization,
    loading,
    orgLoading,
    signIn,
    signUp,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}