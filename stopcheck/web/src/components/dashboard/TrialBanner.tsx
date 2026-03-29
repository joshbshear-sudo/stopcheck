import { Link } from 'react-router-dom'

interface Props {
  trialEventsUsed: number
  trialActive: boolean
  sponsored: boolean
  plan: string
}

export default function TrialBanner({ trialEventsUsed, trialActive, sponsored, plan }: Props) {
  // Sponsored orgs and paid plans — no trial banner
  if (sponsored || (plan && plan !== 'free')) return null

  const remaining = Math.max(0, 5 - trialEventsUsed)
  const pct = (trialEventsUsed / 5) * 100
  const osmEvents = [1, 2, 5]

  // Trial expired
  if (!trialActive || trialEventsUsed >= 5) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 mb-6 text-center">
        <h3 className="font-bold text-red-800 text-lg mb-2">Your free trial is complete</h3>
        <p className="text-red-600 text-sm mb-4">
          You've experienced StopCheck across 5 events. Ready to run real events?
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/billing"
            className="px-5 py-2 bg-green-600 text-white rounded-lg font-medium no-underline hover:bg-green-700">
            View Plans
          </Link>
          <Link to="/apply/community"
            className="px-5 py-2 bg-white text-gray-700 rounded-lg font-medium no-underline border border-gray-200 hover:bg-gray-50">
            Apply for Sponsorship
          </Link>
        </div>
      </div>
    )
  }

  // Last event warning
  if (remaining === 1) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-amber-800">Last trial event remaining</div>
            <div className="text-sm text-amber-600">Upgrade to continue after this event.</div>
          </div>
          <Link to="/billing"
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium no-underline hover:bg-amber-700">
            Upgrade
          </Link>
        </div>
        <ProgressBar pct={pct} used={trialEventsUsed} />
      </div>
    )
  }

  // Normal trial
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="font-semibold text-blue-800">Free Trial</span>
          <span className="text-blue-600 text-sm ml-2">{remaining} event{remaining !== 1 ? 's' : ''} remaining</span>
        </div>
        <Link to="/billing"
          className="text-sm text-blue-600 no-underline font-medium hover:text-blue-800">
          Upgrade to unlock unlimited events &rarr;
        </Link>
      </div>
      <ProgressBar pct={pct} used={trialEventsUsed} />
      <div className="text-xs text-blue-500 mt-2">
        Events {osmEvents.join(', ')} include OSM auto-detection.
      </div>
    </div>
  )
}

function ProgressBar({ pct, used }: { pct: number; used: number }) {
  return (
    <div className="mt-2">
      <div className="w-full h-2 bg-white rounded-full overflow-hidden">
        <div className="h-2 bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-gray-500 mt-1">{used} of 5 used</div>
    </div>
  )
}
