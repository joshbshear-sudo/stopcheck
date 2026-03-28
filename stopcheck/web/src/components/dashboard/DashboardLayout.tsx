import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const PLAN_BADGES: Record<string, { label: string; color: string }> = {
  free: { label: 'Free', color: 'bg-gray-100 text-gray-600' },
  starter: { label: 'Starter', color: 'bg-blue-100 text-blue-700' },
  event_pass: { label: 'Event Pass', color: 'bg-blue-100 text-blue-700' },
  season_pro: { label: 'Season Pro', color: 'bg-green-100 text-green-700' },
  series: { label: 'Series', color: 'bg-purple-100 text-purple-700' },
}

export default function DashboardLayout() {
  const { org, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const plan = org?.sponsored ? 'sponsored' : (org?.plan || 'free')
  const badge = PLAN_BADGES[plan]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-green-700 font-bold text-lg no-underline">
            <span className="text-xl">&#128721;</span> StopCheck
          </Link>
          <div className="flex items-center gap-3">
            {org?.sponsored ? (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                Community Partner
              </span>
            ) : badge ? (
              <Link to="/billing" className={`text-xs font-semibold px-2 py-0.5 rounded-full no-underline ${badge.color}`}>
                {badge.label}
              </Link>
            ) : null}
            <span className="text-sm text-gray-500">{org?.name}</span>
            <Link to="/billing" className="text-sm text-gray-400 no-underline hover:text-gray-600">Billing</Link>
            <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-600">
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
