import { Link } from 'react-router-dom'

const tiers = [
  { name: 'Free', price: '$0', period: '', riders: 'Up to 50', events: '1', pdf: true, email: true, support: 'Community', highlight: false },
  { name: 'Starter', price: '$29', period: 'one-time', riders: '51-150', events: '1', pdf: true, email: true, support: 'Email', highlight: false },
  { name: 'Event Pass', price: '$49', period: 'one-time', riders: 'Unlimited', events: '1', pdf: true, email: true, support: 'Email', highlight: true },
  { name: 'Season Pro', price: '$299', period: '/year', riders: 'Unlimited', events: 'Unlimited', pdf: true, email: true, support: 'Priority', highlight: false },
  { name: 'Series', price: '$799', period: '/year', riders: 'Unlimited', events: 'Unlimited', pdf: true, email: true, support: 'Dedicated', highlight: false },
]

export default function Pricing() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-green-700 font-bold text-lg no-underline">
            <span className="text-xl">&#128721;</span> StopCheck
          </Link>
          <Link to="/register" className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium no-underline">Start Free</Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">Pricing</h1>
        <p className="text-gray-500 text-center mb-10">Start free. Pay only when you need more riders.</p>

        {/* Comparison table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="py-3 px-4 text-left text-gray-500 font-medium">Feature</th>
                {tiers.map(t => (
                  <th key={t.name} className={`py-3 px-4 text-center ${t.highlight ? 'bg-green-50' : ''}`}>
                    <div className="font-bold text-gray-900">{t.name}</div>
                    <div className="font-bold text-green-600">{t.price}<span className="text-gray-400 font-normal text-xs">{t.period ? ` ${t.period}` : ''}</span></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <Row label="Riders per event" values={tiers.map(t => t.riders)} highlights={tiers.map(t => t.highlight)} />
              <Row label="Events" values={tiers.map(t => t.events)} highlights={tiers.map(t => t.highlight)} />
              <Row label="PDF export" values={tiers.map(t => t.pdf ? '&#10003;' : '—')} highlights={tiers.map(t => t.highlight)} />
              <Row label="Email notifications" values={tiers.map(t => t.email ? '&#10003;' : '—')} highlights={tiers.map(t => t.highlight)} />
              <Row label="Support" values={tiers.map(t => t.support)} highlights={tiers.map(t => t.highlight)} />
              <Row label="OSM stop detection" values={tiers.map(() => '&#10003;')} highlights={tiers.map(t => t.highlight)} />
              <Row label="Strava/Garmin/Wahoo" values={tiers.map(() => '&#10003;')} highlights={tiers.map(t => t.highlight)} />
              <Row label="FIT file upload" values={tiers.map(() => '&#10003;')} highlights={tiers.map(t => t.highlight)} />
              <Row label="Crossing guard waivers" values={tiers.map(() => '&#10003;')} highlights={tiers.map(t => t.highlight)} />
            </tbody>
          </table>
        </div>

        {/* Community sponsorship */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <h3 className="font-bold text-green-800 text-lg">Community Sponsorship</h3>
          <p className="text-green-700 mt-2">
            Charity-affiliated gravel events can apply for free full access.
            Up to 50 events sponsored per year.
          </p>
          <Link to="/apply/community"
            className="inline-block mt-3 px-6 py-2 bg-green-600 text-white rounded-lg font-medium no-underline hover:bg-green-700">
            Apply for Sponsorship
          </Link>
        </div>
      </main>
    </div>
  )
}

function Row({ label, values, highlights }: { label: string; values: string[]; highlights: boolean[] }) {
  return (
    <tr>
      <td className="py-3 px-4 text-gray-700">{label}</td>
      {values.map((v, i) => (
        <td key={i} className={`py-3 px-4 text-center text-gray-800 ${highlights[i] ? 'bg-green-50' : ''}`}
          dangerouslySetInnerHTML={{ __html: v }} />
      ))}
    </tr>
  )
}
