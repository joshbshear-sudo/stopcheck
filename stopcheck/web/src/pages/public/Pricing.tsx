import { Link } from 'react-router-dom'
import PublicLayout from '../../components/public/PublicLayout'
import './Pricing.css'

export default function Pricing() {
  return (
    <PublicLayout>
      <div className="page-pricing">
        {/* Soft-launch notice */}
        <div className="soft-launch">
          <div className="soft-launch-inner">
            <span className="soft-launch-tag">2026 · soft-launch</span>
            <p className="soft-launch-copy">
              <b>StopCheck GO is in soft-launch with select event partners through 2026.</b> The pricing below takes effect for 2027 events. Practice Mode is available now to anyone who signs up.
            </p>
          </div>
        </div>

        <div className="page">
          {/* §00 hero */}
          <section className="hero">
            <p className="kicker">/ Pricing</p>
            <h1>Per event. <em>No subscription.</em></h1>
            <p className="lede">
              Two self-serve tiers by rider count. One enterprise band for larger or multi-event work. A separate program for charitable rides. Practice Mode is free.
            </p>
          </section>

          {/* Tier cards */}
          <section className="tiers">
            <article className="tier">
              <div className="t-band">≤ 250 riders</div>
              <div className="t-price">$199<small>/event</small></div>
              <div className="t-name">Standard.</div>
              <hr className="t-rule" />
              <div className="t-includes">Includes</div>
              <ul>
                <li>Detection pipeline · calibrated thresholds</li>
                <li>Organizer-branded rider report cards</li>
                <li>Custom stop-sign configuration · per-stop overrides</li>
                <li>Comms kit · rider email + FAQ + social copy</li>
                <li>Detailed organizer reporting · CSV export</li>
                <li>Practice Mode for staff and volunteers</li>
                <li>Priority email support · T-12 to T+24</li>
              </ul>
              <Link to="/start?tier=standard" className="t-cta">Start an assessment</Link>
              <p className="t-foot">Targets regional and small-to-mid events. Solstice 100, Loess Hills, Orbital Odyssey.</p>
            </article>

            <article className="tier">
              <div className="t-band">251–500 riders</div>
              <div className="t-price">$349<small>/event</small></div>
              <div className="t-name">Standard+.</div>
              <hr className="t-rule" />
              <div className="t-includes">Includes everything in Standard, plus</div>
              <ul>
                <li>Same feature set · same support window</li>
                <li>Larger volunteer-coordination support</li>
                <li>Permit-conversation reference materials</li>
                <li>Priority routing on flagged-finding review</li>
              </ul>
              <Link to="/start?tier=standard-plus" className="t-cta">Start an assessment</Link>
              <p className="t-foot">Targets mid-sized regional events. Pony Express, Flint Hills Gravel.</p>
            </article>

            <article className="tier featured">
              <div className="t-band">501+ riders · multi-event · platforms</div>
              <div className="t-price">Contact us</div>
              <div className="t-name">Enterprise.</div>
              <hr className="t-rule" />
              <div className="t-includes">Includes</div>
              <ul>
                <li>Custom rider caps</li>
                <li>Named on-call coverage</li>
                <li>Dispute console access · Phase 3+</li>
                <li>Co-branded comms kit</li>
                <li>Multi-event terms · series pricing</li>
                <li>Public co-bylined case study</li>
              </ul>
              <Link to="/contact?inquiry=enterprise" className="t-cta">Contact us</Link>
              <p className="t-foot">Currently working with select event partners through our 2026 soft-launch period. Enterprise pricing for 2027 events available — contact us.</p>
            </article>
          </section>

          {/* Programs */}
          <section className="programs">
            <div className="program-card">
              <p className="p-tag">Practice Mode · free</p>
              <h3>Try it on any ride file <em>before you commit.</em></h3>
              <p>
                Create as many practice events as you want. Upload any GPX or FIT — your own ride, a teammate's, a sample course from RWGPS. Run the full detection pipeline. Generate sample report cards. See the organizer dashboard end-to-end.
              </p>
              <p>
                Practice events don't appear in aggregate stats, don't generate case-study artifacts, and expire after 30 days. <b>The $199 or $349 commitment is something you make after you've seen the platform run on a course you know.</b>
              </p>
              <Link to="/start?mode=practice" className="p-link">Open a practice event&nbsp;→</Link>
              <p className="p-foot">Operational target: August 2026 · Phase 2 Track B</p>
            </div>

            <div className="program-card">
              <p className="p-tag">Community Sponsorship</p>
              <h3>For charitable rides <em>and advocacy events.</em></h3>
              <p>
                501(c)(3) status required. Application-based, not self-serve. Fundraising rides, club centuries with a beneficiary, advocacy-organization events.
              </p>
              <p>
                Separate program with its own application path. Survives even after the broader pricing structure matures — it's the place this work belongs, not a discount on the standard ladder.
              </p>
              <Link to="/apply/community" className="p-link">Apply for sponsorship&nbsp;→</Link>
              <p className="p-foot">501(c)(3) verification required at application</p>
            </div>
          </section>

          {/* Detail — what's included */}
          <section className="detail">
            <div className="detail-head">
              <div className="detail-num">§ 03</div>
              <div>
                <h2>What's in every tier.</h2>
                <p className="cap">
                  The feature set is shared across self-serve. The price step is for rider-count scale, not for feature gating. Enterprise extends the operational support, not the underlying detection.
                </p>
              </div>
            </div>
            <div className="detail-grid">
              <div>
                <div className="detail-row"><div className="k">Detection</div><div className="v">GPS-trace based. 25m geofence radius per Spec v2.0. Calibrated speed + dwell thresholds. No cameras.</div></div>
                <div className="detail-row"><div className="k">Posture</div><div className="v">Visibility-only by default through Phase 2. Findings reported, not enforced. Organizer decides what to do with a finding.</div></div>
                <div className="detail-row"><div className="k">Rider reports</div><div className="v">Per-rider report card. Organizer-branded — your event name, logo, color. Sent by email after results post.</div></div>
                <div className="detail-row"><div className="k">Configuration</div><div className="v">Per-stop overrides. Custom dwell thresholds. OSM auto-detect with manual placement adjustment.</div></div>
                <div className="detail-row"><div className="k">Comms kit</div><div className="v">Pre-event rider email templates · FAQ language · social-media copy. Drop-in or adapt.</div></div>
              </div>
              <div>
                <div className="detail-row"><div className="k">Reporting</div><div className="v">Per-stop breakdown · time-of-day patterns · severity distribution · CSV export of all findings.</div></div>
                <div className="detail-row"><div className="k">Dispute path</div><div className="v">Provisional → final review window. Inconclusive findings drop. Email-driven through Phase 2; console in Phase 3.</div></div>
                <div className="detail-row"><div className="k">Retention</div><div className="v">Per-rider data 48 hours after results post. Aggregate metrics persist. See <Link to="/trust" style={{ color: 'var(--warm)', borderBottom: '1.5px solid var(--warm)', paddingBottom: '1px', textDecoration: 'none' }}>Trust</Link>.</div></div>
                <div className="detail-row"><div className="k">Connection</div><div className="v">Manual FIT or GPX upload is first-class. Strava OAuth optional, expires on schedule.</div></div>
                <div className="detail-row"><div className="k">Support</div><div className="v">Priority email through the event window (T-12 to T+24). One human, one address. Same-day in active review.</div></div>
              </div>
            </div>
          </section>

          {/* Notes / FAQ */}
          <section className="notes">
            <div className="notes-head">
              <div className="notes-num">§ 04</div>
              <h2>What we get asked.</h2>
            </div>
            <div className="qa-grid">
              <div className="qa">
                <h4>Why no free tier?</h4>
                <p>Practice Mode is the trial mechanic. A free first event with stripped-down features would either (a) consume support capacity that paying events need or (b) hand a one-event-per-year RD five free seasons. Practice Mode lets organizers see the platform run on a course they know — without either side of that bind.</p>
              </div>
              <div className="qa">
                <h4>Why per-event and not subscription?</h4>
                <p>Most gravel-event organizers run one to three events a year. Annual pricing forced a fit between the platform and a buyer shape that doesn't exist. Per-event pricing aligns the spend with the work, and event-by-event budgets are how organizers actually plan.</p>
              </div>
              <div className="qa">
                <h4>What counts as a rider?</h4>
                <p>Riders with a registered ride file for the event. Volunteers, sweep, and staff don't count toward the cap. The 250 / 500 thresholds are starts, not finishers — DNFs count.</p>
              </div>
              <div className="qa">
                <h4>What if I'm right at the 250 line?</h4>
                <p>Round up if registration is open. We'd rather have you on Standard+ at $349 than have you over the cap at $199 with reporting gaps. If you finish under 250, the price doesn't refund — the rider band is set at the start.</p>
              </div>
              <div className="qa">
                <h4>How do I know if I'm Enterprise?</h4>
                <p>If your event is 501+ riders, if you run a series with a single buyer, or if you operate a platform — yes. Borderline cases are worth a contact email. The Enterprise band gets named on-call coverage and dispute-console access; some events want those even at smaller rider counts.</p>
              </div>
              <div className="qa">
                <h4>Can I deploy in 2026?</h4>
                <p>2026 deployments are limited to a small set of warm-relationship beta partners (Solstice 100 · Pony Express). Other 2026 inquiries: Practice Mode is open now; standard pricing applies to 2027 events. We're building toward Phase 2 readiness, not pulling deployment forward.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </PublicLayout>
  )
}
