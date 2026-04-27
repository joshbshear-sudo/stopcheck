import { Link } from 'react-router-dom'
import PublicNav from '../../components/public/PublicNav'
import PublicFooter from '../../components/public/PublicFooter'

export default function Terms() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      <main className="max-w-3xl mx-auto px-4 py-12 text-gray-700 text-sm leading-relaxed">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        <p className="text-gray-500 mb-8">Last updated: March 2026</p>

        <S title="1. Service Description">
          <p>StopCheck ("the Service") provides automated stop sign compliance analysis for gravel cycling events. The Service processes GPS and speed data from rider activities to determine whether riders performed compliant stops at designated stop signs along event courses.</p>
        </S>

        <S title="2. Accounts">
          <p>Event organizers create accounts to set up events. Riders do not create accounts — they are identified by unique URL tokens provided by their event organizer. By creating an account, you agree to provide accurate information and maintain the security of your credentials.</p>
        </S>

        <S title="3. Data Processing">
          <p>By connecting their platform (Strava, Garmin, or Wahoo), riders consent to StopCheck accessing their activity data for compliance analysis. StopCheck processes only GPS and speed data within stop sign geofences. Full GPS tracks, biometric data, and personal location data are never stored. See our <Link to="/privacy" className="text-green-600">Privacy Policy</Link> for complete details.</p>
        </S>

        <S title="4. Compliance Results">
          <p>StopCheck provides compliance analysis based on sensor data. Results are advisory — the platform recommends disqualifications but never issues them automatically. All DQ decisions require explicit confirmation by a human event organizer. StopCheck is not responsible for the accuracy of GPS or speed sensor data from third-party devices.</p>
        </S>

        <S title="5. Crossing Guard Waivers">
          <p>Event organizers may designate stop signs as having crossing guards during official event hours. Waivers apply only within the configured event window. Pre-ride activities are never eligible for crossing guard waivers regardless of organizer settings.</p>
        </S>

        <S title="6. Payments and Refunds">
          <p>Free tier events support up to 50 riders at no cost. Paid tiers unlock additional riders. One-time event payments are non-refundable after event processing begins. Annual subscriptions may be cancelled at any time through the Stripe customer portal; access continues through the end of the billing period.</p>
        </S>

        <S title="7. Community Sponsorship">
          <p>Charity-affiliated events may apply for sponsored access at no cost. Sponsorship is granted at StopCheck's sole discretion and may be revoked if the charity affiliation cannot be verified. Sponsored events are limited to 50 per year.</p>
        </S>

        <S title="8. Limitation of Liability">
          <p>StopCheck provides compliance analysis on a best-effort basis. The Service is not liable for decisions made based on compliance reports, including disqualifications. Event organizers are solely responsible for their DQ decisions and communication with riders.</p>
        </S>

        <S title="9. Data Retention and Deletion">
          <p>Rider data is retained for the duration of the event plus 90 days. After this period, all rider-identifiable data is automatically deleted. Riders may request immediate deletion at any time through their rider hub page or by contacting us.</p>
        </S>

        <S title="10. Changes to Terms">
          <p>We may update these terms from time to time. Material changes will be communicated via email to registered organizers. Continued use of the Service after changes constitutes acceptance.</p>
        </S>

        <S title="11. Contact">
          <p>Questions? Email <a href="mailto:support@stopcheck.io" className="text-green-600">support@stopcheck.io</a>.</p>
        </S>
      </main>

      <PublicFooter />
    </div>
  )
}

function S({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-gray-900 mb-3">{title}</h2>
      {children}
    </section>
  )
}
