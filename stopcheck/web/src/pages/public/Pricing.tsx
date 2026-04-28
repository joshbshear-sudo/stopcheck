import { Link } from 'react-router-dom'
import PublicNav from '../../components/public/PublicNav'
import PublicFooter from '../../components/public/PublicFooter'

const tiers = [
  { name: 'Free Trial', price: '$0', period: '', riders: 'Up to 50', events: 'Up to 5 or through first paid event', pdf: true, email: true, support: 'Community', commsKit: false, highlight: false },
  { name: 'Starter', price: '$29', period: 'per event', riders: 'Up to 150', events: 'Per event', pdf: true, email: true, support: 'Standard email', commsKit: false, highlight: false },
  { name: 'Event Pass', price: '$49', period: 'per event', riders: 'Up to 500', events: 'Per event', pdf: true, email: true, support: 'Priority email', commsKit: false, highlight: true },
  { name: 'Season Pro', price: '$299', period: '/year', riders: 'Unlimited', events: 'Unlimited', pdf: true, email: true, support: 'Named on-call', commsKit: false, highlight: false },
  { name: 'Series', price: '$799', period: '/year', riders: 'Unlimited', events: 'Unlimited', pdf: true, email: true, support: 'Named on-call', commsKit: true, highlight: false },
]

export default function Pricing() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      <main className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">Pricing</h1>
        <p className="text-gray-500 text-center mb-10">Start with a free trial. Move to a paid plan when you run your first event with StopCheck GO.</p>

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
              <Row label="Co-branded comms kit" values={tiers.map(t => t.commsKit ? '&#10003;' : '—')} highlights={tiers.map(t => t.highlight)} />
            </tbody>
          </table>
          <p className="text-xs text-gray-500 mt-3">Free Trial: OSM auto-detect on events 1, 2, and 5 only.</p>
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

      <PublicFooter />
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
