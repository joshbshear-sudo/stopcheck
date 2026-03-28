import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

interface Props {
  eventId: string
  currentCount: number
  onClose: () => void
}

export default function UpgradeModal({ eventId, currentCount, onClose }: Props) {
  const { token } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)

  const handleCheckout = async (tier: 'starter' | 'event_pass') => {
    if (!token) return
    setLoading(tier)
    try {
      const res = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, eventId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      setLoading(null)
    }
  }

  const handleSubscription = async (plan: 'season_pro' | 'series') => {
    if (!token) return
    setLoading(plan)
    try {
      const res = await fetch('/api/billing/create-subscription', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Upgrade to Add More Riders</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Your event has <strong>{currentCount}</strong> riders.
          Free events support up to 50 riders. Choose a plan to continue:
        </p>

        <div className="space-y-3">
          {currentCount <= 150 && (
            <TierOption name="Starter" price="$29" desc="Up to 150 riders, this event only"
              onClick={() => handleCheckout('starter')} loading={loading === 'starter'} />
          )}
          <TierOption name="Event Pass" price="$49" desc="Unlimited riders, this event only"
            onClick={() => handleCheckout('event_pass')} loading={loading === 'event_pass'} highlight />
          <div className="border-t border-gray-100 pt-3 mt-3">
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-medium">Annual plans — all events</p>
            <TierOption name="Season Pro" price="$299/yr" desc="Unlimited riders & events"
              onClick={() => handleSubscription('season_pro')} loading={loading === 'season_pro'} />
            <div className="mt-2">
              <TierOption name="Series" price="$799/yr" desc="Everything + priority support"
                onClick={() => handleSubscription('series')} loading={loading === 'series'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TierOption({ name, price, desc, onClick, loading, highlight }: {
  name: string; price: string; desc: string; onClick: () => void; loading: boolean; highlight?: boolean
}) {
  return (
    <button onClick={onClick} disabled={loading}
      className={`w-full text-left px-4 py-3 rounded-xl border-2 flex items-center justify-between transition-colors disabled:opacity-50 ${
        highlight ? 'border-green-300 bg-green-50 hover:border-green-400' : 'border-gray-200 hover:border-gray-300'
      }`}>
      <div>
        <div className="font-semibold text-gray-900">{name}</div>
        <div className="text-xs text-gray-500">{desc}</div>
      </div>
      <div className="font-bold text-gray-900 text-sm">{loading ? '...' : price}</div>
    </button>
  )
}
