import { Link } from 'react-router-dom'
import PublicLayout from '../../components/public/PublicLayout'
import './HowItWorks.css'

export default function HowItWorks() {
  return (
    <PublicLayout>
      <div className="page-how-it-works">
        {/* §01 header */}
        <section className="top">
          <div className="page">
            <p className="h1">How StopCheck works.</p>
            <p className="h1-meta">/how-it-works · v1.2-clean</p>
          </div>
        </section>

        {/* §01 lede — locked v1.2 */}
        <section className="lede-wrap">
          <div className="page">
            <p className="lede">
              Yes — this is monitoring. We use the word because avoiding it would be dishonest. Here's why we believe it belongs in gravel: safety at stop signs is a set of practices that become habit, and habits hold when they're shared and visible. The platform exists to make stop, check, go a shared practice, not a private decision each rider makes alone under pressure to keep moving. <em>The behavioral standard is the Three-Second Rule — see <Link to="/what-counts">/what-counts</Link> for examples of what the system credits and what it doesn't. Per-rider data exists for 48 hours after results, then purges. The structural commitments behind that are on <Link to="/trust">/trust</Link>.</em>
            </p>
          </div>
        </section>

        {/* §02 walkthrough */}
        <section className="section">
          <div className="page">
            <p className="kicker">The walkthrough</p>
            <h2>Three steps. <em>Zero manual work.</em></h2>

            <div className="steps-row">
              <article className="step">
                <p className="num">Step 01</p>
                <div>
                  <h3>Upload your course.</h3>
                  <ul>
                    <li>Upload your GPX or FIT course file to the StopCheck dashboard.</li>
                    <li>StopCheck auto-detects every stop sign along the route using OpenStreetMap data.</li>
                    <li>A geofence zone is created around each stop sign.</li>
                    <li>Review and adjust stop zones on the interactive map before the event.</li>
                  </ul>
                </div>
              </article>
              <article className="step">
                <p className="num">Step 02</p>
                <div>
                  <h3>Riders connect in one tap.</h3>
                  <ul>
                    <li>Send riders their unique StopCheck link via email (automated) or your registration platform.</li>
                    <li>Riders tap one button to connect Strava, Garmin, or Wahoo.</li>
                    <li>No account creation. No app download. Under 30 seconds.</li>
                    <li>Works with any GPS device riders already use.</li>
                  </ul>
                </div>
              </article>
              <article className="step">
                <p className="num">Step 03</p>
                <div>
                  <h3>Reports generated automatically.</h3>
                  <ul>
                    <li>After the ride, StopCheck pulls GPS activity data automatically.</li>
                    <li>Per-stop speed analysis determines whether the rider stopped at each stop sign zone.</li>
                    <li>Pass/fail verdicts with speed data for every rider at every stop.</li>
                    <li>Findings surfaced for organizer review — no automated review.</li>
                    <li>Export PDF reports or review in the dashboard.</li>
                  </ul>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* §03 key details */}
        <section className="section alt">
          <div className="page">
            <p className="kicker">Spec at a glance</p>
            <h2>Key details.</h2>
            <p className="sub">The thresholds the system runs on. Calibrated for rural-road GPS realities, not lab conditions.</p>

            <div className="tiles">
              <div className="tile">
                <span className="tl">A · Stop detection</span>
                <h3>3-second stop threshold.</h3>
                <p>3-second stop threshold at each geofenced zone. <b>Speed must drop below 2 mph</b> to register as a stop.</p>
              </div>
              <div className="tile">
                <span className="tl">B · Geofence accuracy</span>
                <h3><b>25-meter</b> radius around each stop sign.</h3>
                <p>Calibrated for GPS accuracy on rural roads. Matches Spec v2.0 §1.5 and §1.15.</p>
              </div>
              <div className="tile">
                <span className="tl">C · Processing time</span>
                <h3>Under 5 minutes.</h3>
                <p>Under 5 minutes from ride upload to full report. Reports surface in your dashboard the moment processing completes.</p>
              </div>
            </div>
          </div>
        </section>

        {/* §04 CTA-band */}
        <section className="cta-band">
          <div className="page">
            <p className="kicker">Closing</p>
            <h2>Ready to get started?</h2>
            <p className="tagline">Try Practice Mode with any GPX or FIT file. <em>Free to any signed-up organizer.</em></p>
            <div className="cta-row">
              <Link to="/start" className="btn-primary">Start an assessment&nbsp;→</Link>
              <span className="cta-meta">routes to Practice Mode signup</span>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  )
}
