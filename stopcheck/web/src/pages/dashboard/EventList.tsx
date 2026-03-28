import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { fetchEvents, type EventData } from '../../dashboardApi'

export default function EventList() {
  const { token } = useAuth()
  const [events, setEvents] = useState<EventData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    fetchEvents(token).then(setEvents).finally(() => setLoading(false))
  }, [token])

  if (loading) return <div className="text-center py-12 text-gray-400">Loading events...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        <Link to="/events/new"
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium no-underline hover:bg-green-700">
          + Create Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="text-4xl mb-3">&#127937;</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">No events yet</h2>
          <p className="text-gray-500 mb-4">Create your first event to get started.</p>
          <Link to="/events/new"
            className="inline-block px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium no-underline hover:bg-green-700">
            Create Event
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map(event => (
            <Link key={event.id} to={`/events/${event.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 no-underline hover:border-green-300 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{event.name}</h3>
                <StatusPill status={event.status} />
              </div>
              <p className="text-sm text-gray-500">
                {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              {event.location && <p className="text-sm text-gray-400">{event.location}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    setup: 'bg-amber-100 text-amber-700',
    active: 'bg-green-100 text-green-700',
    complete: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[status] || colors.setup}`}>
      {status}
    </span>
  )
}
