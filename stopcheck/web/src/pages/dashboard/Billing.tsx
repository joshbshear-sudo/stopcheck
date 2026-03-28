import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

interface BillingStatus {
  plan: string
  plan_expires_at: string | null
  sponsored: boolean
  sponsor_charity_name: string | null
}

const TIER_DISPLAY: Record<string, { name: string; price: string; desc: string }> = {
  free: { name: 'Free', price: '$0', desc: 'Up to 50 riders per event' },
  starter: { name: 'Starter', price: '$29', desc: '51-150 riders, one event' },
  event_pass: { name: 'Event Pass', price: '$49', desc: 'Unlimited riders, one event' },
  season_pro: { name: 'Season Pro', price: '$299/yr', desc: 'Unlimited riders & events' },
  series: { name: 'Series', price: '$799/yr', desc: 'Unlimited everything, priority support' },
  sponsored: { name: 'Community Partner', price: '$0', desc: 'Verified charity — full access' },
}

export default function Billing() {
  const { token } = useAuth()
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    fetch('/api/billing/status', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setStatus)
      .finally(() => setLoading(false))
  }, [token])

  const handlePortal = async () => {
    if (!token) return
    const res = await fetch('/api/billing/portal', { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  const handleSubscribe = async (plan: string) => {
    if (!token) return
    const res = await fetch('/api/billing/create-subscription', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>

  const currentPlan = status?.plan || 'free'
  const display = TIER_DISPLAY[currentPlan] || TIER_DISPLAY.free

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/dashboard" className="text-sm text-gray-400 no-underline hover:text-gray-600">&larr; Dashboard</Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">Billing & Plan</h1>

      {/* Current plan */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Current Plan</div>
            <div className="text-xl font-bold text-gray-900 mt-1">{display.name}</div>
            <div className="text-sm text-gray-500 mt-1">{display.desc}</div>
            {status?.plan_expires_at && (
              <div className="text-xs text-gray-400 mt-2">
                Renews {new Date(status.plan_expires_at).toLocaleDateString()}
              </div>
            )}
          </div>
          <div className="text-2xl font-bold text-green-600">{display.price}</div>
        </div>
        {status?.sponsored && (
          <div className="mt-3 px-3 py-2 bg-green-50 rounded-lg text-sm text-green-700">
            Community Partner — benefiting {status.sponsor_charity_name}
          </div>
        )}
        {(currentPlan === 'season_pro' || currentPlan === 'series') && (
          <button onClick={handlePortal}
            className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
            Manage Billing
          </button>
        )}
      </div>

      {/* Upgrade options (hidden for sponsored and paid subscribers) */}
      {!status?.sponsored && currentPlan === 'free' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upgrade</h2>
          <div className="space-y-3">
            <PlanCard name="Season Pro" price="$299/yr" desc="Unlimited riders & events for one year"
              onSelect={() => handleSubscribe('season_pro')} highlight />
            <PlanCard name="Series" price="$799/yr" desc="Everything in Season Pro plus priority support"
              onSelect={() => handleSubscribe('series')} />
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">
            Per-event pricing (Starter $29, Event Pass $49) available when adding riders.
          </p>
        </div>
      )}
    </div>
  )
}

function PlanCard({ name, price, desc, onSelect, highlight }: {
  name: string; price: string; desc: string; onSelect: () => void; highlight?: boolean
}) {
  return (
    <div className={`rounded-xl border-2 p-5 flex items-center justify-between ${
      highlight ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
    }`}>
      <div>
        <div className="font-semibold text-gray-900">{name}</div>
        <div className="text-sm text-gray-500">{desc}</div>
      </div>
      <div className="text-right">
        <div className="font-bold text-gray-900">{price}</div>
        <button onClick={onSelect}
          className="mt-1 px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700">
          Subscribe
        </button>
      </div>
    </div>
  )
}
