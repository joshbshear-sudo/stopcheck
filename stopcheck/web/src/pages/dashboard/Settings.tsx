import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { TutorialReplayButton } from '../../components/dashboard/Tutorial'

export default function Settings() {
  const { org } = useAuth()

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/dashboard" className="text-sm text-gray-400 no-underline hover:text-gray-600">&larr; Dashboard</Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">Settings</h1>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Account</h2>
        <p className="text-sm text-gray-500">{org?.name} &middot; {org?.email}</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Tutorial & Onboarding</h2>
        <div className="space-y-3">
          <TutorialReplayButton />
          <Link to="/pricing"
            className="block text-sm text-blue-600 no-underline hover:text-blue-800">
            View tutorial as guide &rarr;
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Billing</h2>
        <Link to="/billing"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium no-underline hover:bg-gray-200 inline-block">
          Manage Billing &rarr;
        </Link>
      </div>
    </div>
  )
}
