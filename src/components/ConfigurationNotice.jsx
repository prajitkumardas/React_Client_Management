import { AlertTriangle, ExternalLink, Database, Key } from 'lucide-react'

const ConfigurationNotice = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Configuration Required
          </h1>
          <p className="text-gray-600">
            Please configure your Supabase credentials to use Smart Client Manager
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Setup Instructions
            </h2>
            
            <ol className="space-y-4 text-sm text-blue-800">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                  1
                </span>
                <div>
                  <p className="font-medium">Create a Supabase Project</p>
                  <p className="text-blue-700 mt-1">
                    Go to{' '}
                    <a 
                      href="https://supabase.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-900 inline-flex items-center"
                    >
                      supabase.com
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                    {' '}and create a new project
                  </p>
                </div>
              </li>
              
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                  2
                </span>
                <div>
                  <p className="font-medium">Get Your Credentials</p>
                  <p className="text-blue-700 mt-1">
                    In your Supabase dashboard, go to <strong>Settings → API</strong> and copy:
                  </p>
                  <ul className="list-disc list-inside mt-2 ml-4 space-y-1 text-blue-700">
                    <li>Project URL</li>
                    <li>anon/public key</li>
                  </ul>
                </div>
              </li>
              
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                  3
                </span>
                <div>
                  <p className="font-medium">Set Up Database</p>
                  <p className="text-blue-700 mt-1">
                    In the SQL Editor, run the schema from <code className="bg-blue-100 px-1 rounded">database-schema.sql</code>
                  </p>
                </div>
              </li>
              
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                  4
                </span>
                <div>
                  <p className="font-medium">Update Environment Variables</p>
                  <p className="text-blue-700 mt-1">
                    Update the <code className="bg-blue-100 px-1 rounded">.env.local</code> file with your credentials
                  </p>
                </div>
              </li>
            </ol>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <Key className="h-5 w-5 mr-2" />
              Environment Variables
            </h3>
            
            <p className="text-sm text-gray-600 mb-3">
              Update your <code className="bg-gray-200 px-1 rounded">.env.local</code> file:
            </p>
            
            <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm overflow-x-auto">
              <div>VITE_SUPABASE_URL=https://your-project-id.supabase.co</div>
              <div>VITE_SUPABASE_ANON_KEY=your-anon-key-here</div>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Replace the placeholder values with your actual Supabase credentials
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <strong>Note:</strong> After updating the environment variables, the page will automatically reload 
              and you'll be able to access the application.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfigurationNotice