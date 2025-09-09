import { AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'

const OrganizationEmptyState = () => {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            Organization Not Found
          </h3>
          <p className="text-sm text-yellow-700 mb-4">
            Your user account exists but no organization is associated with it.
            This usually happens when the signup process was interrupted.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/organization/create"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              aria-label="Create Organization"
            >
              Create Organization
            </Link>
            <a
              href="mailto:support@example.com"
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              aria-label="Contact Support"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrganizationEmptyState