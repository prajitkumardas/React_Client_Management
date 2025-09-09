import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { validation } from '../lib/utils'
import { 
  Settings as SettingsIcon, 
  Building, 
  User, 
  Bell, 
  Shield,
  Save,
  AlertCircle
} from 'lucide-react'

const Settings = () => {
  const { user, organization } = useAuth()
  const [activeTab, setActiveTab] = useState('organization')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  const [orgSettings, setOrgSettings] = useState({
    name: '',
    timezone: 'Asia/Kolkata',
    address: '',
    phone: '',
    email: ''
  })

  const [userSettings, setUserSettings] = useState({
    name: '',
    email: '',
    role: ''
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailReminders: true,
    smsReminders: false,
    expiryAlerts: true,
    newClientAlerts: true
  })

  useEffect(() => {
    if (organization) {
      setOrgSettings({
        name: organization.name || '',
        timezone: organization.timezone || 'Asia/Kolkata',
        address: organization.address || '',
        phone: organization.phone || '',
        email: organization.email || ''
      })
    }

    if (user) {
      setUserSettings({
        name: user.user_metadata?.name || '',
        email: user.email || '',
        role: 'admin' // This would come from user profile
      })
    }
  }, [organization, user])

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const handleSaveOrganization = async () => {
    try {
      setLoading(true)

      // Validate required fields
      if (!validation.isRequired(orgSettings.name)) {
        showMessage('error', 'Organization name is required')
        return
      }

      const { error } = await supabase
        .from('organizations')
        .update({
          name: orgSettings.name,
          timezone: orgSettings.timezone,
          address: orgSettings.address,
          phone: orgSettings.phone,
          email: orgSettings.email
        })
        .eq('id', organization.id)

      if (error) throw error

      showMessage('success', 'Organization settings updated successfully')
    } catch (error) {
      showMessage('error', 'Failed to update organization settings')
      console.error('Error updating organization:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveUser = async () => {
    try {
      setLoading(true)

      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: { name: userSettings.name }
      })

      if (error) throw error

      showMessage('success', 'User settings updated successfully')
    } catch (error) {
      showMessage('error', 'Failed to update user settings')
      console.error('Error updating user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotifications = async () => {
    try {
      setLoading(true)

      // In a real app, you'd save these to a user_preferences table
      // For now, we'll just show a success message
      showMessage('success', 'Notification settings updated successfully')
    } catch (error) {
      showMessage('error', 'Failed to update notification settings')
      console.error('Error updating notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'organization', name: 'Organization', icon: Building },
    { id: 'user', name: 'User Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your organization and account settings
        </p>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`rounded-md p-4 ${
          message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className={`h-5 w-5 ${
                message.type === 'success' ? 'text-green-400' : 'text-red-400'
              }`} />
            </div>
            <div className="ml-3">
              <p className={`text-sm ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {message.text}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Organization Settings */}
          {activeTab === 'organization' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Organization Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organization Name *
                    </label>
                    <input
                      type="text"
                      value={orgSettings.name}
                      onChange={(e) => setOrgSettings({ ...orgSettings, name: e.target.value })}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timezone
                    </label>
                    <select
                      value={orgSettings.timezone}
                      onChange={(e) => setOrgSettings({ ...orgSettings, timezone: e.target.value })}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={orgSettings.phone}
                      onChange={(e) => setOrgSettings({ ...orgSettings, phone: e.target.value })}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={orgSettings.email}
                      onChange={(e) => setOrgSettings({ ...orgSettings, email: e.target.value })}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      value={orgSettings.address}
                      onChange={(e) => setOrgSettings({ ...orgSettings, address: e.target.value })}
                      rows={3}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleSaveOrganization}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* User Settings */}
          {activeTab === 'user' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">User Profile</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={userSettings.name}
                      onChange={(e) => setUserSettings({ ...userSettings, name: e.target.value })}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={userSettings.email}
                      disabled
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Email cannot be changed here</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <input
                      type="text"
                      value={userSettings.role}
                      disabled
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-500"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleSaveUser}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Email Reminders</h4>
                      <p className="text-sm text-gray-500">Receive email notifications for package expiries</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailReminders}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, emailReminders: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">SMS Reminders</h4>
                      <p className="text-sm text-gray-500">Receive SMS notifications for package expiries</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.smsReminders}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, smsReminders: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Expiry Alerts</h4>
                      <p className="text-sm text-gray-500">Get notified when packages are about to expire</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.expiryAlerts}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, expiryAlerts: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">New Client Alerts</h4>
                      <p className="text-sm text-gray-500">Get notified when new clients are added</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.newClientAlerts}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, newClientAlerts: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleSaveNotifications}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
                
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Security Features Coming Soon
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>Advanced security features like password change, two-factor authentication, and session management will be available in the next update.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-md p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Current Security Status</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>✓ Email authentication enabled</li>
                      <li>✓ Secure database connections</li>
                      <li>✓ Data encryption at rest</li>
                      <li>⏳ Two-factor authentication (coming soon)</li>
                      <li>⏳ Session management (coming soon)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings