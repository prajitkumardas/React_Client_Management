import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { dbHelpers } from '../lib/supabase'
import { dateUtils } from '../lib/utils'
import QrScanner from 'react-qr-scanner'
import { 
  QrCode, 
  Camera, 
  User, 
  Clock, 
  CheckCircle,
  XCircle,
  Search,
  Smartphone
} from 'lucide-react'

const CheckIn = () => {
  const { organization } = useAuth()
  const [scannerActive, setScannerActive] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [manualClientId, setManualClientId] = useState('')
  const [clients, setClients] = useState([])
  const [recentCheckIns, setRecentCheckIns] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (organization?.id) {
      fetchClients()
      fetchRecentCheckIns()
    }
  }, [organization])

  const fetchClients = async () => {
    try {
      const { data, error } = await dbHelpers.getClients(organization.id)
      if (!error && data) {
        setClients(data)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const fetchRecentCheckIns = async () => {
    try {
      // This would need to be implemented in dbHelpers
      // For now, we'll use a placeholder
      setRecentCheckIns([])
    } catch (error) {
      console.error('Error fetching recent check-ins:', error)
    }
  }

  const handleScan = async (data) => {
    if (data) {
      setScanResult(data)
      setScannerActive(false)
      await processCheckIn(data, 'qr')
    }
  }

  const handleScanError = (err) => {
    console.error('QR Scanner error:', err)
    setError('Camera access denied or not available')
  }

  const handleManualCheckIn = async () => {
    if (!manualClientId.trim()) {
      setError('Please enter a client ID')
      return
    }
    
    await processCheckIn(manualClientId.trim(), 'manual')
    setManualClientId('')
  }

  const processCheckIn = async (clientId, method) => {
    try {
      setLoading(true)
      setError('')

      // Find client by ID or name
      const client = clients.find(c => 
        c.id === clientId || 
        c.name.toLowerCase().includes(clientId.toLowerCase()) ||
        c.phone === clientId ||
        c.email === clientId
      )

      if (!client) {
        setError('Client not found. Please check the ID or register the client first.')
        return
      }

      // Record attendance
      const { data, error } = await dbHelpers.recordAttendance(client.id, method)
      
      if (error) {
        setError('Failed to record check-in: ' + error.message)
        return
      }

      // Success
      setScanResult({
        success: true,
        client: client,
        timestamp: new Date(),
        method: method
      })

      // Refresh recent check-ins
      await fetchRecentCheckIns()

    } catch (error) {
      setError('An error occurred during check-in')
      console.error('Check-in error:', error)
    } finally {
      setLoading(false)
    }
  }

  const startScanner = () => {
    setScannerActive(true)
    setScanResult(null)
    setError('')
  }

  const stopScanner = () => {
    setScannerActive(false)
  }

  const resetScan = () => {
    setScanResult(null)
    setError('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Client Check-In</h1>
        <p className="mt-1 text-sm text-gray-500">
          Scan QR code or manually enter client information
        </p>
      </div>

      {/* Check-in Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Scanner */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <QrCode className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">QR Code Scanner</h2>
          </div>

          {!scannerActive && !scanResult && (
            <div className="text-center py-8">
              <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <button
                onClick={startScanner}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Camera className="h-4 w-4 mr-2" />
                Start Camera
              </button>
            </div>
          )}

          {scannerActive && (
            <div className="space-y-4">
              <div className="relative">
                <QrScanner
                  delay={300}
                  onError={handleScanError}
                  onScan={handleScan}
                  style={{ width: '100%' }}
                />
              </div>
              <div className="text-center">
                <button
                  onClick={stopScanner}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Stop Scanner
                </button>
              </div>
            </div>
          )}

          {scanResult && (
            <div className="text-center py-4">
              {scanResult.success ? (
                <div className="space-y-3">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                  <div>
                    <h3 className="text-lg font-medium text-green-900">Check-in Successful!</h3>
                    <p className="text-sm text-gray-600">{scanResult.client.name}</p>
                    <p className="text-xs text-gray-500">
                      {dateUtils.formatDateTime(scanResult.timestamp)}
                    </p>
                  </div>
                  <button
                    onClick={resetScan}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                  >
                    Scan Another
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <XCircle className="mx-auto h-12 w-12 text-red-500" />
                  <div>
                    <h3 className="text-lg font-medium text-red-900">Check-in Failed</h3>
                    <p className="text-sm text-gray-600">Please try again</p>
                  </div>
                  <button
                    onClick={resetScan}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Manual Check-in */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Smartphone className="h-6 w-6 text-green-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Manual Check-In</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client ID, Name, Phone, or Email
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={manualClientId}
                  onChange={(e) => setManualClientId(e.target.value)}
                  placeholder="Enter client information..."
                  className="flex-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleManualCheckIn()}
                />
                <button
                  onClick={handleManualCheckIn}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <User className="h-4 w-4 mr-2" />
                      Check In
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Client suggestions */}
            {manualClientId && (
              <div className="border border-gray-200 rounded-md max-h-40 overflow-y-auto">
                {clients
                  .filter(client => 
                    client.name.toLowerCase().includes(manualClientId.toLowerCase()) ||
                    (client.phone && client.phone.includes(manualClientId)) ||
                    (client.email && client.email.toLowerCase().includes(manualClientId.toLowerCase()))
                  )
                  .slice(0, 5)
                  .map(client => (
                    <button
                      key={client.id}
                      onClick={() => {
                        setManualClientId(client.name)
                        processCheckIn(client.id, 'manual')
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="text-sm font-medium text-gray-900">{client.name}</div>
                      <div className="text-xs text-gray-500">
                        {client.phone || client.email}
                      </div>
                    </button>
                  ))
                }
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <XCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Check-ins */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Check-ins
          </h3>
          {recentCheckIns.length > 0 ? (
            <div className="space-y-3">
              {recentCheckIns.map((checkIn, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{checkIn.client_name}</p>
                      <p className="text-sm text-gray-500">
                        {checkIn.method === 'qr' ? 'QR Code' : 'Manual'} check-in
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{dateUtils.formatDateTime(checkIn.checkin_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No recent check-ins</p>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <QrCode className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">How to use Check-In</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Use QR Scanner for quick check-ins with client QR codes</li>
                <li>Use Manual Check-in by entering client name, phone, or email</li>
                <li>All check-ins are automatically recorded with timestamp</li>
                <li>Recent check-ins are displayed for reference</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckIn