import { Link } from 'react-router-dom'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center">
          <Link to="/" className="flex items-center gap-2 text-green-700 font-bold text-lg no-underline">
            <span className="text-xl">&#128721;</span> StopCheck
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12 text-gray-700 text-sm leading-relaxed">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <p className="text-gray-500 mb-8">Last updated: March 2026</p>

        <Section title="1. What We Collect">
          <p>StopCheck collects the minimum data necessary for stop sign compliance analysis:</p>
          <Table rows={[
            ['Rider name', 'Event + 90 days', 'Required for compliance report and DQ notification'],
            ['Rider email', 'Event + 90 days', 'Required for OAuth link delivery and report delivery'],
            ['OAuth access token (encrypted)', 'Deleted immediately after FIT file retrieved', 'Required to fetch activity data'],
            ['OAuth refresh token (encrypted)', 'Deleted after event window + 48 hours', 'Required if access token expires before activity retrieved'],
            ['Speed records at stop signs only', 'Event + 90 days', 'Required as evidence for DQ decisions and rider appeals'],
            ['Platform user ID', 'Event + 90 days', 'Required to match incoming webhooks to registered riders'],
          ]} />
        </Section>

        <Section title="2. What We Never Collect">
          <Table rows={[
            ['Full GPS track', 'Never stored', 'Full route is not needed — only records within stop sign geofences'],
            ['Home address / start location', 'Never stored', 'Not required for compliance analysis'],
            ['Heart rate, power, cadence', 'Never stored', 'Stripped during FIT parsing before any storage'],
            ['Strava/Garmin/Wahoo profile data', 'Never fetched', 'We only request activity data scopes'],
          ]} />
        </Section>

        <Section title="3. FIT File Processing">
          <p>When we receive your ride data, we:</p>
          <ol className="list-decimal pl-5 space-y-1 mt-2">
            <li>Parse the FIT file in memory only</li>
            <li>Extract ONLY records within 50 meters of a registered stop sign</li>
            <li>Strip precise lat/lon, heart rate, power, cadence from those records</li>
            <li>Retain only: timestamp, speed, and distance from stop sign</li>
            <li>Delete the original FIT file immediately after processing</li>
          </ol>
          <p className="mt-2">Your full GPS track, ride route, and biometric data never touch our database.</p>
        </Section>

        <Section title="4. Token Security">
          <p>All OAuth tokens are encrypted at rest using AES-256-GCM before storage. Access tokens are deleted immediately after your FIT file is retrieved. Refresh tokens are deleted within 48 hours after the event window closes. A scheduled cleanup job runs every 6 hours to purge expired tokens.</p>
        </Section>

        <Section title="5. Your Rights">
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Access:</strong> View all data StopCheck holds about you via your rider hub page</li>
            <li><strong>Delete:</strong> Request immediate deletion of all your data</li>
            <li><strong>Export:</strong> Download all stored data in JSON format</li>
            <li><strong>Disconnect:</strong> Revoke OAuth access at any time through your platform settings</li>
          </ul>
        </Section>

        <Section title="6. No Tracking">
          <p>StopCheck does not use any third-party analytics, tracking pixels, or advertising SDKs on rider-facing pages. No Google Analytics. No Meta Pixel. No tracking of any kind.</p>
        </Section>

        <Section title="7. Data Breach Notification">
          <p>If we detect a data breach, we will notify affected riders within 72 hours and relevant authorities per applicable law.</p>
        </Section>

        <Section title="8. Contact">
          <p>Questions about privacy? Email <a href="mailto:privacy@stopcheck.io" className="text-green-600">privacy@stopcheck.io</a>.</p>
        </Section>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-gray-900 mb-3">{title}</h2>
      {children}
    </section>
  )
}

function Table({ rows }: { rows: string[][] }) {
  return (
    <div className="overflow-x-auto mt-2">
      <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
