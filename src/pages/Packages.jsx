import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { dbHelpers } from '../lib/supabase'
import { exportUtils, validation, uiUtils, dateUtils } from '../lib/utils'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Download, 
  Package,
  Calendar,
  DollarSign,
  Users
} from 'lucide-react'

const Packages = () => {
  const { organization } = useAuth()
  const [packages, setPackages] = useState([])
  const [filteredPackages, setFilteredPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPackage, setEditingPackage] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    duration_days: '',
    price: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (organization?.id) {
      fetchPackages()
    }
  }, [organization])

  useEffect(() => {
    // Filter packages based on search term
    const filtered = packages.filter(pkg =>
      pkg.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredPackages(filtered)
  }, [packages, searchTerm])

  const fetchPackages = async () => {
    try {
      setLoading(true)
      const { data, error } = await dbHelpers.getPackages(organization.id)
      if (!error && data) {
        setPackages(data)
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!validation.isRequired(formData.name)) {
      newErrors.name = 'Package name is required'
    }

    if (!validation.isRequired(formData.duration_days)) {
      newErrors.duration_days = 'Duration is required'
    } else if (isNaN(formData.duration_days) || parseInt(formData.duration_days) <= 0) {
      newErrors.duration_days = 'Duration must be a positive number'
    }

    if (formData.price && (isNaN(formData.price) || parseFloat(formData.price) < 0)) {
      newErrors.price = 'Price must be a valid number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      const packageData = {
        ...formData,
        org_id: organization.id,
        duration_days: parseInt(formData.duration_days),
        price: formData.price ? parseFloat(formData.price) : null
      }

      let result
      if (editingPackage) {
        result = await dbHelpers.updatePackage(editingPackage.id, packageData)
      } else {
        result = await dbHelpers.createPackage(packageData)
      }

      if (!result.error) {
        await fetchPackages()
        handleCloseModal()
      } else {
        setErrors({ submit: result.error.message })
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred while saving the package' })
    }
  }

  const handleEdit = (pkg) => {
    setEditingPackage(pkg)
    setFormData({
      name: pkg.name,
      duration_days: pkg.duration_days.toString(),
      price: pkg.price ? pkg.price.toString() : ''
    })
    setShowModal(true)
  }

  const handleDelete = async (packageId) => {
    if (window.confirm('Are you sure you want to delete this package?')) {
      try {
        const { error } = await dbHelpers.deletePackage(packageId)
        if (!error) {
          await fetchPackages()
        }
      } catch (error) {
        console.error('Error deleting package:', error)
      }
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingPackage(null)
    setFormData({ name: '', duration_days: '', price: '' })
    setErrors({})
  }

  const handleExportExcel = () => {
    exportUtils.exportPackagesToExcel(packages, 'packages.xlsx')
  }

  const getDurationText = (days) => {
    if (days >= 365) {
      const years = Math.floor(days / 365)
      const remainingDays = days % 365
      if (remainingDays === 0) {
        return `${years} year${years > 1 ? 's' : ''}`
      }
      return `${years} year${years > 1 ? 's' : ''} ${remainingDays} day${remainingDays > 1 ? 's' : ''}`
    } else if (days >= 30) {
      const months = Math.floor(days / 30)
      const remainingDays = days % 30
      if (remainingDays === 0) {
        return `${months} month${months > 1 ? 's' : ''}`
      }
      return `${months} month${months > 1 ? 's' : ''} ${remainingDays} day${remainingDays > 1 ? 's' : ''}`
    } else {
      return `${days} day${days > 1 ? 's' : ''}`
    }
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Packages</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your service packages and pricing
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Package
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search packages by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPackages.map((pkg) => (
          <div key={pkg.id} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {pkg.name}
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(pkg)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(pkg.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{getDurationText(pkg.duration_days)}</span>
                </div>
                
                {pkg.price && (
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 mr-2" />
                    <span>{uiUtils.formatCurrency(pkg.price)}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <Package className="h-4 w-4 mr-1" />
                    <span>Active package</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {dateUtils.formatDate(pkg.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPackages.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <Package className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No packages found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first package.'}
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingPackage ? 'Edit Package' : 'Add New Package'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Package Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`mt-1 block w-full border ${errors.name ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="e.g., Monthly Gym Membership"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Duration (Days) *</label>
                  <input
                    type="number"
                    value={formData.duration_days}
                    onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                    className={`mt-1 block w-full border ${errors.duration_days ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="30"
                    min="1"
                  />
                  {errors.duration_days && <p className="mt-1 text-sm text-red-600">{errors.duration_days}</p>}
                  <p className="mt-1 text-xs text-gray-500">
                    Common durations: 30 days (1 month), 90 days (3 months), 365 days (1 year)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Price (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className={`mt-1 block w-full border ${errors.price ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="1000.00"
                    min="0"
                  />
                  {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                </div>

                {errors.submit && (
                  <p className="text-sm text-red-600">{errors.submit}</p>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingPackage ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Packages