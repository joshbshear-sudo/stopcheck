import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { fetchEvent, fetchRidersWithStops, fetchStopSigns, createRiders, updateEvent, type EventData, type RiderWithStops, type StopSignData } from '../../dashboardApi'
import UpgradeModal from '../../components/dashboard/UpgradeModal'

export default function EventDashboard() {
  const { id } = useParams<{ id: string }>()
  const { token, org } = useAuth()
  const [event, setEvent] = useState<EventData | null>(null)
  const [riders, setRiders] = useState<RiderWithStops[]>([])
  const [stops, setStops] = useState<StopSignData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'violations' | 'clear' | 'pending'>('all')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showAddRider, setShowAddRider] = useState(false)
  const [showEditEvent, setShowEditEvent] = useState(false)
  const [sendingEmails, setSendingEmails] = useState(false)
  const [emailBanner, setEmailBanner] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
  const [paymentBanner, setPaymentBanner] = useState<string | null>(null)

  // Handle Stripe checkout redirect — fulfill payment
  useEffect(() => {
    const payment = searchParams.get('payment')
    const sessionId = searchParams.get('session_id')
    if (payment === 'success' && sessionId && token) {
      fetch('/api/billing/fulfill', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.unlocked) setPaymentBanner('Event unlocked! You can now add unlimited riders.')
          else if (data.plan) setPaymentBanner(`Upgraded to ${data.plan}!`)
        })
        .catch(() => {})
    } else if (payment === 'cancelled') {
      setPaymentBanner(null)
    }
  }, [searchParams, token])

  const reload = () => {
    if (!token || !id) return
    Promise.all([fetchEvent(token, id), fetchRidersWithStops(token, id), fetchStopSigns(token, id)])
      .then(([e, r, s]) => { setEvent(e); setRiders(r); setStops(s) })
  }

  const handleSendEmails = async () => {
    if (!token || !id) return
    setSendingEmails(true)
    try {
      const res = await fetch(`/api/email/send-route/${id}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setEmailBanner(`Route email sent to ${data.sent} rider${data.sent !== 1 ? 's' : ''}${data.failed ? ` (${data.failed} failed)` : ''}`)
    } catch { setEmailBanner('Failed to send emails') }
    finally { setSendingEmails(false) }
  }

  useEffect(() => {
    if (!token || !id) return
    Promise.all([fetchEvent(token, id), fetchRidersWithStops(token, id), fetchStopSigns(token, id)])
      .then(([e, r, s]) => { setEvent(e); setRiders(r); setStops(s) })
      .finally(() => setLoading(false))
  }, [token, id])

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>
  if (!event) return <div className="text-center py-12 text-red-500">Event not found</div>

  const processed = riders.filter(r => r.compliance_pct !== null)
  const violations = riders.filter(r => r.dq_recommended)
  const connected = riders.filter(r => r.connected_at)
  const avgCompliance = processed.length > 0
    ? processed.reduce((sum, r) => sum + (r.compliance_pct || 0), 0) / processed.length : 0

  const filtered = riders.filter(r => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && r.bib_number !== search) return false
    if (filter === 'violations') return r.dq_recommended
    if (filter === 'clear') return r.compliance_pct !== null && !r.dq_recommended
    if (filter === 'pending') return r.compliance_pct === null
    return true
  })

  return (
    <div>
      {/* Payment success banner */}
      {paymentBanner && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <span className="text-green-800 font-medium">{paymentBanner}</span>
          <button onClick={() => setPaymentBanner(null)} className="text-green-600 hover:text-green-800">&times;</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link to="/dashboard" className="text-sm text-gray-400 no-underline hover:text-gray-600">&larr; Events</Link>
          <div className="flex items-center gap-2 mt-1">
            <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
            {org?.sponsored && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                Community Partner
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            {event.location && ` \u2014 ${event.location}`}
            <button onClick={() => setShowEditEvent(true)} className="ml-2 text-blue-600 hover:text-blue-800 text-xs font-medium">Edit</button>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowAddRider(true)} data-tutorial="rider-table"
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
            + Add Rider
          </button>
          <button onClick={handleSendEmails} disabled={sendingEmails} data-tutorial="send-email"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {sendingEmails ? 'Sending...' : 'Send Route Email'}
          </button>
          <Link to={`/events/${id}/podium`} data-tutorial="podium"
            className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium no-underline hover:bg-gray-800">
            Podium
          </Link>
          <a href={`/api/events/${id}/export/pdf`} target="_blank" rel="noreferrer"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium no-underline hover:bg-gray-200 border border-gray-200">
            PDF
          </a>
        </div>
      </div>

      {/* Email banner */}
      {emailBanner && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <span className="text-blue-800 font-medium">{emailBanner}</span>
          <button onClick={() => setEmailBanner(null)} className="text-blue-600 hover:text-blue-800">&times;</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Riders" value={riders.length} />
        <StatCard label="Connected" value={connected.length} accent="blue" />
        <StatCard label="Processed" value={processed.length} accent="green" />
        <StatCard label="Violations" value={violations.length} accent="red" />
      </div>

      {/* Compliance bar */}
      {processed.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Average Compliance</span>
            <span className="text-lg font-bold text-gray-900">{avgCompliance.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full">
            <div className="h-2 bg-green-500 rounded-full" style={{ width: `${Math.min(avgCompliance, 100)}%` }} />
          </div>
        </div>
      )}

      {/* Upgrade prompt — show at 40 riders on free tier */}
      {!org?.sponsored && event.status !== 'complete' && (() => {
        const isFree = !('unlocked' in event) || !(event as any).unlocked;
        const isPaidPlan = org?.plan === 'season_pro' || org?.plan === 'series';
        if (isPaidPlan || !isFree) return null;
        const remaining = 50 - riders.length;
        if (remaining > 10) return null;
        if (remaining <= 0) return (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-red-800">Free Tier Limit Reached</div>
                <div className="text-sm text-red-600">You have {riders.length} riders. Upgrade to add more.</div>
              </div>
              <button onClick={() => setShowUpgrade(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                Upgrade Now
              </button>
            </div>
          </div>
        );
        return (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-amber-800">{remaining} spots remaining</div>
                <div className="text-sm text-amber-600">Free events support up to 50 riders.</div>
              </div>
              <button onClick={() => setShowUpgrade(true)}
                className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200">
                Upgrade
              </button>
            </div>
          </div>
        );
      })()}

      {/* Upgrade Modal */}
      {showUpgrade && id && (
        <UpgradeModal eventId={id} currentCount={riders.length} onClose={() => setShowUpgrade(false)} />
      )}

      {/* Stop Signs Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Stop Signs ({stops.length})</h2>
        <div className="flex flex-wrap gap-2">
          {stops.map(s => (
            <div key={s.id} className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
              s.crossing_guard ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              #{s.sequence} {s.location || `${s.lat.toFixed(3)}, ${s.lon.toFixed(3)}`}
              {s.crossing_guard && ' [G]'}
            </div>
          ))}
        </div>
      </div>

      {/* Rider Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <input type="text" placeholder="Search by name or bib..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
          <div className="flex gap-1">
            {(['all', 'violations', 'clear', 'pending'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  filter === f ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Bib</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Stops</th>
                <th className="px-4 py-3">Compliance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(rider => (
                <tr key={rider.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-500">{rider.bib_number || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{rider.name}</div>
                    {rider.platform && (
                      <span className="text-xs text-gray-400">{rider.platform}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {stops.length > 0 && rider.stop_statuses.length > 0
                        ? stops.map(s => {
                            const match = rider.stop_statuses.find(rs => rs.sequence === s.sequence)
                            return <StopDot key={s.id} status={match?.status || null} />
                          })
                        : stops.map(s => <StopDot key={s.id} status={null} />)
                      }
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {rider.compliance_pct !== null ? (
                      <span className={`font-semibold ${rider.compliance_pct === 100 ? 'text-green-600' : 'text-gray-800'}`}>
                        {rider.compliance_pct.toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <RiderStatus rider={rider} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {rider.compliance_pct !== null && (
                      <Link to={`/events/${id}/rider/${rider.id}`}
                        className="text-xs text-blue-600 no-underline font-medium hover:underline">
                        View &rarr;
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No riders match filter</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Add Rider Modal */}
      {showAddRider && id && token && (
        <AddRiderModal eventId={id} token={token} onClose={() => setShowAddRider(false)} onAdded={() => { setShowAddRider(false); reload() }} />
      )}

      {/* Edit Event Modal */}
      {showEditEvent && event && id && token && (
        <EditEventModal event={event} eventId={id} token={token} onClose={() => setShowEditEvent(false)} onSaved={(e) => { setEvent(e); setShowEditEvent(false) }} />
      )}
    </div>
  )
}

function AddRiderModal({ eventId, token, onClose, onAdded }: {
  eventId: string; token: string; onClose: () => void; onAdded: () => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [bib, setBib] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!name || !email) { setError('Name and email are required'); return }
    setSaving(true)
    setError('')
    try {
      await createRiders(token, eventId, [{ name, email, bib_number: bib || undefined }])
      // Send route email to the new rider
      fetch(`/api/email/send-route/${eventId}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
      onAdded()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Add Rider</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</div>}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sarah Martinez"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="rider@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bib Number</label>
            <input type="text" value={bib} onChange={e => setBib(e.target.value)} placeholder="Optional"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
            {saving ? 'Adding...' : 'Add & Send Route Email'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
        </div>
      </div>
    </div>
  )
}

function EditEventModal({ event, eventId, token, onClose, onSaved }: {
  event: EventData; eventId: string; token: string; onClose: () => void; onSaved: (e: EventData) => void
}) {
  const [name, setName] = useState(event.name)
  const [eventDate, setEventDate] = useState(event.event_date.split('T')[0])
  const [location, setLocation] = useState(event.location || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true); setError('')
    try {
      const updated = await updateEvent(token, eventId, { name, event_date: eventDate, location } as any)
      onSaved(updated)
    } catch (err: any) { setError(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Edit Event</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</div>}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
            <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-600', green: 'text-green-600', red: 'text-red-600',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${accent ? colors[accent] : 'text-gray-900'}`}>{value}</div>
    </div>
  )
}

function StopDot({ status }: { status: string | null }) {
  const colors: Record<string, string> = {
    pass: 'bg-green-500',
    fail: 'bg-red-500',
    guard_waived: 'bg-orange-500',
    missed: 'bg-gray-400',
    not_applicable: 'bg-gray-300',
  }
  return (
    <div
      className={`w-3 h-3 rounded-full ${status ? colors[status] || 'bg-gray-300' : 'bg-gray-200'}`}
      title={status || 'pending'}
    />
  )
}

function RiderStatus({ rider }: { rider: RiderWithStops }) {
  if (rider.dq_confirmed) return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">DQ Confirmed</span>
  if (rider.dq_recommended) return <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">DQ Recommended</span>
  if (rider.compliance_pct !== null && rider.compliance_pct === 100) return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">All Clear</span>
  if (rider.compliance_pct !== null) return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Compliant</span>
  if (rider.connected_at) return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Connected</span>
  return <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Pending</span>
}
