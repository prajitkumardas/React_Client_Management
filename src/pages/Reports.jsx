import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { dbHelpers } from '../lib/supabase'
import { exportUtils, dateUtils, uiUtils } from '../lib/utils'
import { 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  Package,
  TrendingUp,
  Filter
} from 'lucide-react'

const Reports = () => {
  const { organization } = useAuth()
  const [clients, setClients] = useState([])
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [reportType, setReportType] = useState('clients')

  useEffect(() => {
    if (organization?.id) {
      fetchData()
    }
  }, [organization])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [clientsResult, packagesResult] = await Promise.all([
        dbHelpers.getClients(organization.id),
        dbHelpers.getPackages(organization.id)
      ])

      if (!clientsResult.error && clientsResult.data) {
        setClients(clientsResult.data)
      }

      if (!packagesResult.error && packagesResult.data) {
        setPackages(packagesResult.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredClients = () => {
    return clients.filter(client => {
      const clientDate = new Date(client.created_at)
      const startDate = new Date(dateRange.startDate)
      const endDate = new Date(dateRange.endDate)
      return clientDate >= startDate && clientDate <= endDate
    })
  }

  const getClientStats = () => {
    const filteredClients = getFilteredClients()
    const totalClients = filteredClients.length
    const activePackages = filteredClients.reduce((sum, client) => 
      sum + (client.client_packages?.filter(cp => cp.status === 'active').length || 0), 0
    )
    const expiringPackages = filteredClients.reduce((sum, client) => 
      sum + (client.client_packages?.filter(cp => cp.status === 'expiring_soon').length || 0), 0
    )
    const expiredPackages = filteredClients.reduce((sum, client) => 
      sum + (client.client_packages?.filter(cp => cp.status === 'expired').length || 0), 0
    )

    return {
      totalClients,
      activePackages,
      expiringPackages,
      expiredPackages
    }
  }

  const getRevenueStats = () => {
    const filteredClients = getFilteredClients()
    let totalRevenue = 0
    let activeRevenue = 0

    filteredClients.forEach(client => {
      client.client_packages?.forEach(cp => {
        const packagePrice = packages.find(p => p.id === cp.package_id)?.price || 0
        totalRevenue += packagePrice
        if (cp.status === 'active') {
          activeRevenue += packagePrice
        }
      })
    })

    return { totalRevenue, activeRevenue }
  }

  const handleExportClients = () => {
    const filteredClients = getFilteredClients()
    exportUtils.exportClientsToExcel(filteredClients, `clients-report-${dateRange.startDate}-to-${dateRange.endDate}.xlsx`)
  }

  const handleExportPackages = () => {
    exportUtils.exportPackagesToExcel(packages, `packages-report-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleExportSummary = () => {
    const stats = getClientStats()
    const revenue = getRevenueStats()
    
    const summaryData = [
      { Metric: 'Total Clients', Value: stats.totalClients },
      { Metric: 'Active Packages', Value: stats.activePackages },
      { Metric: 'Expiring Soon', Value: stats.expiringPackages },
      { Metric: 'Expired Packages', Value: stats.expiredPackages },
      { Metric: 'Total Revenue', Value: revenue.totalRevenue },
      { Metric: 'Active Revenue', Value: revenue.activeRevenue },
      { Metric: 'Report Period', Value: `${dateRange.startDate} to ${dateRange.endDate}` }
    ]

    const worksheet = XLSX.utils.json_to_sheet(summaryData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Summary')
    XLSX.writeFile(workbook, `summary-report-${dateRange.startDate}-to-${dateRange.endDate}.xlsx`)
  }

  const stats = getClientStats()
  const revenue = getRevenueStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Generate and export reports for your business
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Report Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="clients">Clients Report</option>
              <option value="packages">Packages Report</option>
              <option value="revenue">Revenue Report</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Clients
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalClients}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Packages
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.activePackages}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Revenue
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {uiUtils.formatCurrency(revenue.totalRevenue)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Revenue
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {uiUtils.formatCurrency(revenue.activeRevenue)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Export Reports</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleExportClients}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-5 w-5 mr-2" />
            Export Clients
          </button>
          
          <button
            onClick={handleExportPackages}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-5 w-5 mr-2" />
            Export Packages
          </button>
          
          <button
            onClick={handleExportSummary}
            className="flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm bg-blue-600 text-sm font-medium text-white hover:bg-blue-700"
          >
            <FileText className="h-5 w-5 mr-2" />
            Export Summary
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Activity
          </h3>
          
          <div className="space-y-3">
            {getFilteredClients().slice(0, 10).map((client) => (
              <div key={client.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{client.name}</p>
                  <p className="text-sm text-gray-500">
                    {client.client_packages?.length || 0} package{(client.client_packages?.length || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-xs text-gray-400">
                  {dateUtils.formatDate(client.created_at)}
                </div>
              </div>
            ))}
          </div>
          
          {getFilteredClients().length === 0 && (
            <p className="text-sm text-gray-500">No activity in selected date range</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Reports