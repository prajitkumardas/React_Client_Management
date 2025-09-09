import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { dbHelpers } from '../lib/supabase'
import { fetchDashboardStats, fetchOrgName, getClients } from '../lib/dashboardHelpers'
import { Users, Package, AlertTriangle, XCircle, TrendingUp } from 'lucide-react'
import OrganizationEmptyState from '../components/OrganizationEmptyState'

const Dashboard = () => {
  const { organization, orgLoading } = useAuth()
  const [stats, setStats] = useState({
    totalClients: 0,
    activePackages: 0,
    expiringPackages: 0,
    expiredPackages: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentClients, setRecentClients] = useState([])

  useEffect(() => {
    if (orgLoading) return
    if (!organization?.id) {
      setLoading(false)
      return
    }
    fetchDashboardData()
  }, [organization?.id, orgLoading])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch dashboard stats using the helper function
      const statsData = await fetchDashboardStats(organization.id)

      // Update stats with safe defaults
      setStats({
        totalClients: statsData.total_clients,
        activePackages: statsData.active_packages,
        expiringPackages: statsData.expiring_packages,
        expiredPackages: statsData.expired_packages
      })

      // Fetch recent clients using the helper function
      const clients = await getClients(organization.id)
      if (clients && Array.isArray(clients)) {
        // Sort by created date and take last 5
        const recent = clients
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5)
        setRecentClients(recent)
      } else {
        setRecentClients([])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Set safe defaults on any error
      setStats({
        totalClients: 0,
        activePackages: 0,
        expiringPackages: 0,
        expiredPackages: 0
      })
      setRecentClients([])
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Clients',
      value: stats.totalClients,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Active Packages',
      value: stats.activePackages,
      icon: Package,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Expiring Soon',
      value: stats.expiringPackages,
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Expired Packages',
      value: stats.expiredPackages,
      icon: XCircle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    }
  ]

  if (orgLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!organization) {
    return <OrganizationEmptyState />
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-blue-100 truncate">
                    Welcome back to
                  </dt>
                  <dd className="text-xl font-bold text-white">
                    {organization?.name || 'Smart Client Manager'}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm">Today's Overview</p>
              <p className="text-white text-lg font-semibold">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => (
          <div key={card.title} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${card.bgColor} rounded-md p-3`}>
                    <card.icon className={`h-6 w-6 ${card.textColor}`} />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {card.title}
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {card.value}
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${card.bgColor}`}
                      style={{ width: `${Math.min((card.value / 100) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-xs text-gray-500">
                    {index === 0 ? 'Active' : index === 1 ? 'This Month' : index === 2 ? 'Urgent' : 'Expired'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
              <span className="mr-2">⚡</span>
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Link
                to="/clients"
                className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors block"
              >
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="text-sm font-medium text-blue-900">Add New Client</span>
                </div>
              </Link>
              <Link
                to="/packages"
                className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors block"
              >
                <div className="flex items-center">
                  <Package className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-sm font-medium text-green-900">Manage Packages</span>
                </div>
              </Link>
              <Link
                to="/checkin"
                className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors block"
              >
                <div className="flex items-center">
                  <span className="text-purple-600 mr-3">📱</span>
                  <span className="text-sm font-medium text-purple-900">Check-in System</span>
                </div>
              </Link>
              <Link
                to="/reports"
                className="w-full text-left px-4 py-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors block"
              >
                <span className="text-orange-600 mr-3">📊</span>
                <span className="text-sm font-medium text-orange-900">Export Reports</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📋</span>
              Recent Activity
            </h3>
            <div className="space-y-3">
              {recentClients.length > 0 ? (
                recentClients.slice(0, 5).map((client) => (
                  <div key={client.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-xs font-medium text-blue-600">
                          {client.full_name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{client.full_name}</p>
                        <p className="text-xs text-gray-500">New client added</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(client.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-gray-400">📋</span>
                  </div>
                  <p className="text-sm text-gray-500">No recent activity</p>
                  <p className="text-xs text-gray-400 mt-1">Activity will appear here as you add clients</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pro Tips */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
              <span className="mr-2">💡</span>
              Pro Tips
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium">📅 Set Renewal Reminders</p>
                <p className="text-xs text-yellow-700 mt-1">Configure automatic reminders 7 days before package expiry</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">📊 Track Attendance</p>
                <p className="text-xs text-blue-700 mt-1">Monitor client check-ins to identify engagement patterns</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800 font-medium">🎯 Create Membership Packages</p>
                <p className="text-xs text-green-700 mt-1">Offer different packages to cater to various client needs</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {stats.expiringPackages > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Attention Required
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  You have {stats.expiringPackages} package{stats.expiringPackages > 1 ? 's' : ''} expiring soon. 
                  Consider reaching out to these clients for renewal.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard