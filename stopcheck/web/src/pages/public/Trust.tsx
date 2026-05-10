import PublicLayout from '../../components/public/PublicLayout'
import './Trust.css'

/**
 * /trust — Stage 4 Step 10 v1, ported as-is.
 * /trust v2 refresh (incorporating Spec v2.0 §3.7 V2.0 extensions per
 * StopCheckGO_Trust_Page_Content_Brief_v1_0.md) is queued post-Solstice.
 */
export default function Trust() {
  return (
    <PublicLayout>
      <div className="page-trust">
        <div className="page">
          {/* Hero */}
          <section className="hero">
            <p className="kicker">/ Trust</p>
            <h1>Eight commitments. Written down.</h1>
            <p className="lede">
              Specific structural commitments. Not values statements — values statements signal exactly the opposite of what they claim.
            </p>
            <p className="stamp">
              <b>v1.0 · May 2026</b> · Phase 1 — Solstice · Updated when commitments change, and not before.
            </p>
          </section>

          {/* TOC */}
          <section className="toc">
            <div className="toc-head">
              <h2>Index</h2>
              <span className="meta">8 commitments · ~7 min read</span>
            </div>
            <div className="toc-grid">
              <div className="toc-row"><span className="toc-num">01</span><span className="toc-title"><a href="#s1">Subpoena posture · what we measure</a></span><span className="toc-rule">no cameras</span></div>
              <div className="toc-row"><span className="toc-num">02</span><span className="toc-title"><a href="#s2">What we keep, and for how long</a></span><span className="toc-rule">48 hours</span></div>
              <div className="toc-row"><span className="toc-num">03</span><span className="toc-title"><a href="#s3">Change-of-control protections</a></span><span className="toc-rule">in legal review</span></div>
              <div className="toc-row"><span className="toc-num">04</span><span className="toc-title"><a href="#s4">Detection logic and calibration</a></span><span className="toc-rule">defaults · then per-event</span></div>
              <div className="toc-row"><span className="toc-num">05</span><span className="toc-title"><a href="#s5">Findings cap</a></span><span className="toc-rule">capped per rider</span></div>
              <div className="toc-row"><span className="toc-num">06</span><span className="toc-title"><a href="#s6">How findings get reviewed</a></span><span className="toc-rule">provisional → final</span></div>
              <div className="toc-row"><span className="toc-num">07</span><span className="toc-title"><a href="#s7">Account and data control</a></span><span className="toc-rule">manual upload first</span></div>
              <div className="toc-row"><span className="toc-num">08</span><span className="toc-title"><a href="#s8">Who to ask, and when</a></span><span className="toc-rule">one human · one window</span></div>
            </div>
          </section>

          {/* Cards */}
          <section className="cards">
            <article className="card" id="s1">
              <div className="card-num">01</div>
              <div className="card-body">
                <h3>Subpoena posture · what we measure.</h3>
                <p>The platform reads GPS data — the ride file the rider's head unit recorded — and looks at what the trace did at each stop sign. That's the entire input. <b>There are no roadside cameras. There is no real-time visual feed.</b> The platform does not know what a rider looks like, what they were wearing, or which way they turned their head.</p>
                <p>What this means for legal process: a subpoena directed at StopCheck reaches GPS-trace data within the retention window described in §02, and nothing else. There is no video record to compel. There is no biometric identification. The platform reports findings against a rider's registered ride file; the organizer decides what to do with those findings.</p>
              </div>
              <div className="receipt">
                <h4>Commitment</h4>
                <div className="commit-key">No cameras.</div>
                <div className="commit-val">GPS traces only.</div>
              </div>
            </article>

            <article className="card" id="s2">
              <div className="card-num">02</div>
              <div className="card-body">
                <h3>What we keep, and for how long.</h3>
                <p>Once event results post, per-rider GPS traces and per-rider stop-sign findings are kept for <b>48 hours</b>. After that window closes, per-rider data purges. Aggregate event metrics — total stops measured, distribution of times, finding counts — persist. The trace tied to a specific rider does not.</p>
                <p>The 48-hour window exists for two reasons: it gives riders time to flag a finding for review, and it gives the platform time to investigate before purging the underlying record. After both windows close, there is nothing per-rider left to investigate, request, or compel.</p>
              </div>
              <div className="receipt">
                <h4>Retention window</h4>
                <div className="commit-key">Per-rider data</div>
                <div className="commit-val">48 hours · then purged</div>
              </div>
            </article>

            <article className="card pb-card" id="s3">
              <div className="card-num">03</div>
              <div className="card-body">
                <p className="pb-tag">In review · this commitment is being finalized</p>
                <h3>Change-of-control protections.</h3>
                <p>This commitment is being finalized as part of legal review in <b>summer 2026</b>. It will spell out what happens to per-rider data and to the structural commitments on this page if StopCheck is acquired, sold, or wound down — including whether per-rider data is destroyed before any transfer and what survives change-of-control by what mechanism.</p>
                <p><em>Current operative posture, pending the published commitment:</em> StopCheck has not been approached for acquisition and has no transfer in progress. The 48-hour purge in §02 applies regardless of corporate event. Any change here will be announced before it takes effect, with the published commitment updated and dated on this page.</p>
              </div>
              <div className="receipt placeholder">
                <h4>Status</h4>
                <div className="commit-key">In legal review</div>
                <div className="commit-val">Lock by Aug 2026</div>
              </div>
            </article>

            <article className="card" id="s4">
              <div className="card-num">04</div>
              <div className="card-body">
                <h3>Detection logic and calibration.</h3>
                <p>What "counts as a stop" today is set by documented defaults: a speed threshold, a dwell time, and the calibration dataset behind both. The dataset is anonymized; a summary of its composition is published on this page. The defaults are conservative on purpose — Phase 1 errs toward not reporting a finding rather than toward reporting every roll.</p>
                <p>From <b>November 2026</b>, organizers can configure per-event thresholds within published bounds. The defaults remain available as the starting point. The bounds remain published. There are no black-box thresholds.</p>
              </div>
              <div className="receipt">
                <h4>Configurability</h4>
                <div className="commit-key">Phase 1 · defaults</div>
                <div className="commit-val">Per-event · Nov 2026</div>
              </div>
            </article>

            <article className="card" id="s5">
              <div className="card-num">05</div>
              <div className="card-body">
                <h3>Findings cap.</h3>
                <p>The maximum number of findings the platform reports against any single rider in any single event is bounded. There is a per-rider, per-event ceiling. Stop-sign passes beyond that ceiling do not generate additional findings — the count caps.</p>
                <p>This is a structural commitment, not a guideline. The platform cannot exceed the cap regardless of how many stop signs are on the route. <b>What an organizer does with a finding — whether a finding becomes a time penalty, a warning, or nothing — is the organizer's decision.</b> The cap is on what the platform reports.</p>
              </div>
              <div className="receipt">
                <h4>Per-rider, per-event</h4>
                <div className="commit-key">Findings reported</div>
                <div className="commit-val">Capped</div>
              </div>
            </article>

            <article className="card" id="s6">
              <div className="card-num">06</div>
              <div className="card-body">
                <h3>How findings get reviewed.</h3>
                <p>Findings post as <b>provisional</b> first. The review window opens. During that window, riders can flag a finding they disagree with; organizers can flag findings that look anomalous; the platform's own review can flag findings that don't meet the threshold for confidence.</p>
                <p>Findings that close the window <b>inconclusive</b> drop out of the record. Inconclusive does not become a soft finding, does not get counted toward repeat-flagging, does not enter aggregate. Inconclusive means dropped.</p>
                <p>The exact length of the review window — currently <span className="ph">finalized in legal review · summer 2026</span> — and the tier-review path for escalated disputes are being locked in the same Phase 1.5 round as §03. Operative posture for Solstice 2026: the window is documented, tested, and applied uniformly across all riders in an event.</p>
              </div>
              <div className="receipt">
                <h4>Posting</h4>
                <div className="commit-key">Provisional → final</div>
                <div className="commit-val">Inconclusive drops</div>
              </div>
            </article>

            <article className="card" id="s7">
              <div className="card-num">07</div>
              <div className="card-body">
                <h3>Account and data control.</h3>
                <p><b>Manual upload of a FIT or GPX file is a first-class path</b> — same handling, same review, same window. Riders are not forced into a Strava OAuth connection. The OAuth path exists for riders who prefer it; it is not the default.</p>
                <p>OAuth tokens granted to the platform <b>expire on a schedule</b>. Re-granting is explicit. There is no silent token rollover. Riders can revoke OAuth from the account page at any time, with no effect on prior event records inside the 48-hour window or on aggregate event metrics outside it.</p>
              </div>
              <div className="receipt">
                <h4>Connection</h4>
                <div className="commit-key">Manual upload</div>
                <div className="commit-val">First-class path</div>
              </div>
            </article>

            <article className="card" id="s8">
              <div className="card-num">08</div>
              <div className="card-body">
                <h3>Who to ask, and when.</h3>
                <p>Questions about a finding, a flag for review, or anything on this page go to a single email address. A human responds. Routine questions: <b>one business day</b>. During an open review window: <b>same-day</b>.</p>
                <p>One address. One human. One response window. Not a chatbot, not a tier-one queue, not a contact form that disappears. The address is on <a href="/contact" style={{ color: 'var(--warm)', borderBottom: '1.5px solid var(--warm)', paddingBottom: '1px', textDecoration: 'none' }}>/contact</a> and at the foot of every page. A real-time review console is in development for Phase 3; until it ships, email is the channel.</p>
              </div>
              <div className="receipt">
                <h4>Support</h4>
                <div className="commit-key">One human · email</div>
                <div className="commit-val">Same-day in review</div>
              </div>
            </article>
          </section>
        </div>
      </div>
    </PublicLayout>
  )
}
