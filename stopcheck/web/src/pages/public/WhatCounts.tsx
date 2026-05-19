import { Link } from 'react-router-dom'
import PublicLayout from '../../components/public/PublicLayout'
import CompliantTile from '../../components/whatcounts/CompliantTile'
import CloseCallTile from '../../components/whatcounts/CloseCallTile'
import RiskyTile from '../../components/whatcounts/RiskyTile'
import NotCompliantTile from '../../components/whatcounts/NotCompliantTile'
import GroupLiveFeed from '../../components/whatcounts/GroupLiveFeed'
import WhatCountsSvgDefs from '../../components/whatcounts/WhatCountsSvgDefs'
import './WhatCounts.css'

/**
 * /what-counts — Stage 5 page port
 * Page brief v1.0 + Animation brief v1.2 substrate
 * Verdict palette scoped to whatcounts components only · never bleeds to chrome.
 */
export default function WhatCounts() {
  return (
    <PublicLayout>
      <WhatCountsSvgDefs />
      <div className="page-what-counts">
        {/* §00 hero — v1.2 reframe */}
        <section className="top">
          <div className="page">
            <p className="kicker">/ What counts</p>
            <h1>Stop, check, go — <em>made visible.</em></h1>
            <p className="hero-lede">
              Stop Check GO answers <b>"what counts as a stop?"</b> with the Three-Second Rule as the named standard — and shows the check that the stop is for.
            </p>
          </div>
        </section>

        {/* §1 The Three-Second Rule */}
        <section className="section">
          <div className="page">
            <h2>The Stop Check GO Three-Second Rule.</h2>
            <div className="rule-callout">
              <p>
                <b>Come to a complete or near-complete stop. Stay below 3&nbsp;mph for at least 3 full seconds. The system credits the stop.</b>
              </p>
              <p>
                <b>Race-spec exception:</b> Riders with a wheel-speed sensor on their head unit (Garmin Speed Sensor 2, Wahoo equivalents) get a tighter standard — <b>0.0&nbsp;mph for 1.5 seconds</b>. Wheel sensors read true zero at a real stop, so the system can credit shorter holds.
              </p>
            </div>
            <p>
              The <b>stop</b> is what the system measures. The <b>check</b> is what the stop is for — look left, look right, look left again. The <b>three-second hold</b> is what makes the check possible. The Three-Second Rule is the named behavioral standard; the check is what it enables.
            </p>
          </div>
        </section>

        {/* §2 Four examples — individual stops */}
        <section className="section alt">
          <div className="page">
            <h2>What the system sees.</h2>
            <p className="sub">
              The four verdicts riders see in their post-event Field Report. Same approach, same sign, same rule — different rider behaviour produces different reads.
            </p>
            <div className="tile-grid">
              <CompliantTile />
              <CloseCallTile />
              <RiskyTile />
              <NotCompliantTile />
            </div>
          </div>
        </section>

        {/* §3 Each rider's stop is their own — group live feed */}
        <section className="section">
          <div className="page">
            <h2>Each rider's stop is their own.</h2>
            <p className="sub">
              A common rider question: does stopping behind someone who stopped count? Short answer — no. The system reads each rider's individual data, and each rider's verdict is determined independently.
            </p>
            <div className="live-feed-wrap">
              <GroupLiveFeed />
            </div>
          </div>
        </section>

        {/* §4 Race-spec */}
        <section className="section alt">
          <div className="page">
            <h2>Race-spec: tighter standard, shorter hold.</h2>
            <p>
              Phone GPS produces noise around the zero point — the trace shows small motion even when the bike is stopped. A wheel-speed sensor reads true zero at a real stop, with no noise. Because race-spec data is clean, the system can credit a shorter hold and still be confident the rider actually stopped.
            </p>
            <p>
              Race-spec isn't a paid tier. It's the standard for any rider with a wheel-speed sensor paired to their head unit (Garmin Speed Sensor 2, Wahoo equivalents). Without a wheel sensor, the rule is the same — you just need to hold the near-stop a little longer so the GPS-only trace can confirm what happened.
            </p>
          </div>
        </section>

        {/* §5 What breaks the signal */}
        <section className="section">
          <div className="page">
            <h2>What to do — and not do — at your stops.</h2>

            <div className="signal-block">
              <h3>Turn auto-pause OFF.</h3>
              <p>
                Most Garmin and Wahoo head units have an "auto-pause" feature that stops recording when you stop moving. <b>Leave this off for the event.</b> With auto-pause on, your stops aren't recorded — the device pauses while you're stopped, so the data shows you were never there. The platform can't see what didn't get recorded; your finding may come back as inconclusive even though you stopped correctly.
              </p>
              <ul>
                <li>Garmin: Activity Profiles → [your bike profile] → Activity → Auto Pause → Off</li>
                <li>Wahoo: Settings → [your bike profile] → Auto Pause → Off</li>
              </ul>
            </div>

            <div className="signal-block">
              <h3>Don't worry about data gaps.</h3>
              <p>
                GPS dropouts and brief data gaps are handled as <b>inconclusive</b>, not <b>not compliant</b>. A rider whose GPS missed the moment of stop gets an inconclusive verdict the organizer can resolve through the dispute path — not an automatic penalty.
              </p>
            </div>
          </div>
        </section>

        {/* §6 Disputes */}
        <section className="section alt">
          <div className="page">
            <h2>Disagreed with a verdict?</h2>
            <p>
              The Field Report shows the system's reading of every stop sign on the course. If a verdict doesn't match what you know happened — sensor glitch, GPS dropout, a marshalled crossing — the organizer-controlled dispute process is for exactly this case. Disputes stay open through the 48-hour window after the event ends.
            </p>
            <p>
              <Link to="/trust">See the structural commitments on /trust&nbsp;→</Link>
            </p>
          </div>
        </section>

        {/* §FOOT cta */}
        <div className="page">
          <div className="footer-cta">
            <Link to="/for-riders">
              Riding an event using Stop Check GO?<span className="arrow">&nbsp;→</span>
            </Link>
            <Link to="/for-organizers">
              Considering Stop Check GO for your event?<span className="arrow">&nbsp;→</span>
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}

