import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

interface Application {
  id: string; org_name: string; contact_email: string; event_name: string
  charity_name: string; ein: string | null; website: string | null
  expected_riders: number | null; status: string; reviewed_at: string | null
  denial_reason: string | null; created_at: string
}

interface Stats {
  pending: string; approved: string; denied: string; approved_this_year: string
}

export default function AdminSponsorships() {
  const { token } = useAuth()
  const [apps, setApps] = useState<Application[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [annualCap, setAnnualCap] = useState(50)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('pending')

  const load = () => {
    if (!token) return
    fetch('/api/sponsorships/admin', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setApps(data.applications || [])
        setStats(data.stats || null)
        setAnnualCap(data.annual_cap || 50)
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [token])

  const handleAction = async (id: string, action: 'approve' | 'deny') => {
    if (!token) return
    setActionLoading(id)
    try {
      await fetch(`/api/sponsorships/admin/${id}/${action}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(action === 'deny' ? { reason: 'Does not meet criteria' } : {}),
      })
      load()
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = apps.filter(a => filter === 'all' || a.status === filter)
  const approvedThisYear = parseInt(stats?.approved_this_year || '0')

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/dashboard" className="text-sm text-gray-400 no-underline hover:text-gray-600">&larr; Dashboard</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Community Sponsorships</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Pending" value={parseInt(stats?.pending || '0')} accent="amber" />
        <StatCard label="Approved" value={parseInt(stats?.approved || '0')} accent="green" />
        <StatCard label="Denied" value={parseInt(stats?.denied || '0')} />
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Annual Cap</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {approvedThisYear} / {annualCap}
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2">
            <div className="h-1.5 bg-green-500 rounded-full"
              style={{ width: `${Math.min(approvedThisYear / annualCap * 100, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4">
        {(['pending', 'approved', 'denied', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              filter === f ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Applications */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-gray-200">
            No {filter === 'all' ? '' : filter} applications
          </div>
        )}
        {filtered.map(app => (
          <div key={app.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">{app.event_name}</h3>
                  <StatusPill status={app.status} />
                </div>
                <p className="text-sm text-gray-600">{app.org_name} &middot; {app.contact_email}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Charity: <strong>{app.charity_name}</strong>
                  {app.ein && <span className="text-gray-400"> (EIN: {app.ein})</span>}
                </p>
                <div className="flex gap-4 mt-1 text-xs text-gray-400">
                  {app.website && <span>{app.website}</span>}
                  {app.expected_riders && <span>{app.expected_riders} expected riders</span>}
                  <span>Applied {new Date(app.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {app.status === 'pending' && (
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleAction(app.id, 'approve')}
                    disabled={actionLoading === app.id || approvedThisYear >= annualCap}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
                    {actionLoading === app.id ? '...' : 'Approve'}
                  </button>
                  <button onClick={() => handleAction(app.id, 'deny')}
                    disabled={actionLoading === app.id}
                    className="px-3 py-1.5 bg-red-50 text-red-600 text-sm rounded-lg font-medium hover:bg-red-100 disabled:opacity-50">
                    Deny
                  </button>
                </div>
              )}
            </div>
            {app.denial_reason && (
              <div className="mt-2 text-xs text-red-500">Denial reason: {app.denial_reason}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  const colors: Record<string, string> = { amber: 'text-amber-600', green: 'text-green-600' }
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${accent ? colors[accent] : 'text-gray-900'}`}>{value}</div>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    denied: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}
