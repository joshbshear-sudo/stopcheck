import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PublicNav from '../components/public/PublicNav'
import PublicFooter from '../components/public/PublicFooter'

interface SponsoredEvent {
  org_name: string
  charity_name: string
  event_name: string
  event_date: string
  location: string
}

export default function Community() {
  const [events, setEvents] = useState<SponsoredEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/sponsorships/community')
      .then(r => r.json())
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Partners</h1>
          <p className="text-gray-600 max-w-lg mx-auto">
            StopCheck proudly sponsors charity-affiliated gravel events.
            These events use StopCheck at no cost to help keep riders safe.
          </p>
          <Link to="/apply/community"
            className="inline-block mt-5 px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium no-underline hover:bg-green-700">
            Apply for Sponsorship
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <div className="text-4xl mb-3">&#127793;</div>
            <h2 className="text-lg font-semibold text-gray-800 mb-1">No sponsored events yet</h2>
            <p className="text-gray-500 mb-4">Be the first to apply for community sponsorship.</p>
            <Link to="/apply/community"
              className="inline-block px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium no-underline">
              Apply Now
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start gap-2 mb-2">
                  <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    Community Partner
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900">{event.event_name}</h3>
                <p className="text-sm text-gray-500 mt-1">{event.org_name}</p>
                <p className="text-sm text-gray-400">
                  {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {event.location && ` — ${event.location}`}
                </p>
                <p className="text-xs text-green-600 mt-2 font-medium">
                  Benefiting {event.charity_name}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  )
}
