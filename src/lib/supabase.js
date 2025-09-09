import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if environment variables are properly configured
const isConfigured = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project-id.supabase.co' && 
  supabaseAnonKey !== 'your-anon-key-here'

let supabase = null

if (isConfigured) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
  // Create a mock client that shows configuration instructions
  console.warn('⚠️ Supabase not configured. Please update your .env.local file with valid credentials.')
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ 
        data: null, 
        error: { message: 'Please configure Supabase credentials in .env.local' }
      }),
      signUp: () => Promise.resolve({ 
        data: null, 
        error: { message: 'Please configure Supabase credentials in .env.local' }
      }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: () => ({
      select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
      insert: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
      update: () => ({ eq: () => ({ select: () => Promise.resolve({ data: [], error: null }) }) }),
      delete: () => ({ eq: () => Promise.resolve({ data: [], error: null }) })
    }),
    rpc: () => Promise.resolve({ data: null, error: null })
  }
}

export { supabase }

// Database helper functions
export const dbHelpers = {
  // Client operations
  async getClients(orgId) {
    if (!isConfigured) {
      return { data: [], error: null }
    }
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        client_packages (
          *,
          packages_catalog (*)
        )
      `)
      .eq('org_id', orgId)
    return { data, error }
  },

  async createClient(clientData) {
    if (!isConfigured) {
      return { data: [], error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('clients')
      .insert(clientData)
      .select()
    return { data, error }
  },

  async updateClient(id, updates) {
    if (!isConfigured) {
      return { data: [], error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  async deleteClient(id) {
    if (!isConfigured) {
      return { data: [], error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
    return { data, error }
  },

  // Package operations
  async getPackages(orgId) {
    if (!isConfigured) {
      return { data: [], error: null }
    }
    const { data, error } = await supabase
      .from('packages_catalog')
      .select('*')
      .eq('org_id', orgId)
    return { data, error }
  },

  async createPackage(packageData) {
    if (!isConfigured) {
      return { data: [], error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('packages_catalog')
      .insert(packageData)
      .select()
    return { data, error }
  },

  async updatePackage(id, updates) {
    if (!isConfigured) {
      return { data: [], error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('packages_catalog')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  async deletePackage(id) {
    if (!isConfigured) {
      return { data: [], error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('packages_catalog')
      .delete()
      .eq('id', id)
    return { data, error }
  },

  // Client package operations
  async assignPackageToClient(clientPackageData) {
    if (!isConfigured) {
      return { data: [], error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('client_packages')
      .insert(clientPackageData)
      .select()
    return { data, error }
  },

  // Dashboard stats
  async getDashboardStats(orgId) {
    if (!isConfigured) {
      return {
        totalClients: 0,
        activePackages: 0,
        expiringPackages: 0,
        expiredPackages: 0,
        error: null
      }
    }

    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id')
      .eq('org_id', orgId)

    const { data: activePackages, error: activeError } = await supabase
      .from('client_packages')
      .select('*, clients!inner(*)')
      .eq('clients.org_id', orgId)
      .eq('status', 'active')

    const { data: expiringPackages, error: expiringError } = await supabase
      .from('client_packages')
      .select('*, clients!inner(*)')
      .eq('clients.org_id', orgId)
      .eq('status', 'expiring_soon')

    const { data: expiredPackages, error: expiredError } = await supabase
      .from('client_packages')
      .select('*, clients!inner(*)')
      .eq('clients.org_id', orgId)
      .eq('status', 'expired')

    return {
      totalClients: clients?.length || 0,
      activePackages: activePackages?.length || 0,
      expiringPackages: expiringPackages?.length || 0,
      expiredPackages: expiredPackages?.length || 0,
      error: clientsError || activeError || expiringError || expiredError
    }
  },

  // Attendance
  async recordAttendance(clientId, method = 'manual') {
    if (!isConfigured) {
      return { data: [], error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('attendance_logs')
      .insert({
        client_id: clientId,
        method: method,
        checkin_at: new Date().toISOString()
      })
      .select()
    return { data, error }
  },

  // Get recent check-ins
  async getRecentCheckIns(orgId, limit = 10) {
    if (!isConfigured) {
      return { data: [], error: null }
    }
    const { data, error } = await supabase
      .from('attendance_logs')
      .select(`
        *,
        clients!inner(name, org_id)
      `)
      .eq('clients.org_id', orgId)
      .order('checkin_at', { ascending: false })
      .limit(limit)
    return { data, error }
  },

  // Update package statuses (can be called periodically)
  async updatePackageStatuses(orgId) {
    if (!isConfigured) {
      return { data: null, error: null }
    }
    const { data, error } = await supabase.rpc('update_all_package_statuses', {
      org_uuid: orgId
    })
    return { data, error }
  },

  // Get clients with expiring packages
  async getExpiringPackages(orgId, days = 3) {
    if (!isConfigured) {
      return { data: [], error: null }
    }
    const { data, error } = await supabase
      .from('client_packages')
      .select(`
        *,
        clients!inner(*),
        packages_catalog(*)
      `)
      .eq('clients.org_id', orgId)
      .eq('status', 'expiring_soon')
    return { data, error }
  }
}

// Export configuration status for components to check
export const isSupabaseConfigured = isConfigured