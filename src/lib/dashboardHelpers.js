// ===========================================
// DASHBOARD HELPERS
// ===========================================
// Helper functions for dashboard operations

import { supabase } from './supabase'

/**
 * Fetch dashboard statistics for the specified organization
 */
export async function fetchDashboardStats(organizationId) {
  try {
    if (!organizationId) throw new Error('Organization ID is required')

    // Call the Supabase RPC function
    const { data, error } = await supabase.rpc('get_dashboard_stats', {
      org_uuid: organizationId
    })

    if (error) throw error

    // Ensure all values are numbers, default to 0
    return {
      total_clients: data?.total_clients || 0,
      active_packages: data?.active_packages || 0,
      expiring_packages: data?.expiring_packages || 0,
      expired_packages: data?.expired_packages || 0,
      new_clients_this_month: data?.new_clients_this_month || 0
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    // Return safe defaults on error
    return {
      total_clients: 0,
      active_packages: 0,
      expiring_packages: 0,
      expired_packages: 0,
      new_clients_this_month: 0
    }
  }
}

/**
 * Fetch organization name for the logged-in user
 */
export async function fetchOrgName() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) throw userError
    if (!user) throw new Error('Not signed in')

    const { data, error } = await supabase
      .from('organizations')
      .select('name')
      .eq('user_id', user.id)
      .single()

    if (error) throw error

    return data?.name || 'Organization'
  } catch (error) {
    console.error('Error fetching organization name:', error)
    return 'Organization'
  }
}

/**
 * Add a new client to the logged-in user's organization
 */
export async function addClient(name, email = '', phone = '', address = '') {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) throw userError
    if (!user) throw new Error('Not signed in')

    // Get user's organization ID
    const { data: userData, error: userDataError } = await supabase
      .from('organizations')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (userDataError) throw userDataError
    if (!userData?.id) throw new Error('User not associated with an organization')

    const orgId = userData.id

    // Insert new client
    const { data, error } = await supabase
      .from('clients')
      .insert([{
        org_id: orgId,
        full_name: name,
        email,
        phone,
        address
      }])
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error adding client:', error)
    throw error
  }
}

/**
 * Add a new package to the logged-in user's organization
 */
export async function addPackage(name, duration_days, price = null, description = '') {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) throw userError
    if (!user) throw new Error('Not signed in')

    // Get user's organization ID
    const { data: userData, error: userDataError } = await supabase
      .from('organizations')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (userDataError) throw userDataError
    if (!userData?.id) throw new Error('User not associated with an organization')

    const orgId = userData.id

    // Insert new package
    const { data, error } = await supabase
      .from('packages_catalog')
      .insert([{
        org_id: orgId,
        name,
        duration_days: parseInt(duration_days),
        price: price ? parseFloat(price) : null,
        description
      }])
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error adding package:', error)
    throw error
  }
}

/**
 * Get all clients for the specified organization
 */
export async function getClients(organizationId) {
  try {
    if (!organizationId) throw new Error('Organization ID is required')

    // Fetch clients
    const { data, error } = await supabase
      .from('clients')
      .select('id, full_name, age, phone, email, package_id, status, join_date, address, created_at, updated_at')
      .eq('org_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error fetching clients:', error)
    return []
  }
}

/**
 * Get all packages for the logged-in user's organization
 */
export async function getPackages() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) throw userError
    if (!user) throw new Error('Not signed in')

    // Get user's organization ID
    const { data: userData, error: userDataError } = await supabase
      .from('organizations')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (userDataError) throw userDataError
    if (!userData?.id) throw new Error('User not associated with an organization')

    const orgId = userData.id

    // Fetch packages
    const { data, error } = await supabase
      .from('packages_catalog')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error fetching packages:', error)
    return []
  }
}