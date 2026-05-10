import { Link } from 'react-router-dom'
import PublicLayout from '../../components/public/PublicLayout'
import './Home.css'

export default function Home() {
  return (
    <PublicLayout>
      <div className="page-home">
        {/* §01 hero */}
        <section className="section hero">
          <div className="page">
            <p className="kicker">For gravel event organizers</p>
            <h1>
              Stop, check, go.<br />
              <em>Three seconds at every stop sign — the practice that keeps gravel events on the roads they need.</em>
            </h1>
            <p className="lede">
              You wrote the rules. You shouldn't have to be the one calling them out. StopCheck GO does that work, so you can keep doing the work only you can do.
            </p>

            <div className="cta-row">
              <Link to="/start" className="btn-primary">Start an assessment&nbsp;→</Link>
              <Link to="/how-it-works" className="btn-secondary">See how it works&nbsp;→</Link>
            </div>

            {/* Locked tagline · Step 4 §C state 07 · render verbatim */}
            <div className="tagline-band">
              <p className="tagline">Practice on any ride. <em>2027 events from $199.</em></p>
              <span className="tagline-meta">routes to Practice Mode signup</span>
            </div>
          </div>
        </section>

        {/* §02 case */}
        <section className="section">
          <div className="page">
            <p className="kicker">The case</p>
            <h2>Every event has the rule. <em>None has had a way to make the practice visible.</em></h2>

            <div className="case">
              <div className="pull">
                <blockquote>
                  "The course will NOT be closed to traffic and cycling rules of the road apply — stop at all stop signs."
                </blockquote>
                <cite>— Barry-Roubaix Official Rules</cite>
              </div>
              <div>
                <p>
                  Unbound Gravel. SBT GRVL. Gravel Worlds. Barry-Roubaix. Every major event has the same rule. None has had a way to make the practice visible.
                </p>
                <p>
                  With thousands of riders on open public roads, manual verification is impossible. StopCheck GO makes it automatic.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* §03 incentives */}
        <section className="section alt incentives">
          <div className="page">
            <p className="kicker">The case for the practice</p>
            <h2>The incentives are real. <em>So is the danger.</em></h2>

            <div className="row">
              <article className="icard">
                <p className="ix">01 · Pressure</p>
                <h3>Competitive pressure.</h3>
                <p>
                  A full stop costs <b>30–60 seconds</b> of recovery. In a close race that gap means podium or field. Every rider knows it.
                </p>
              </article>
              <article className="icard">
                <p className="ix">02 · Roads</p>
                <h3>Open public roads.</h3>
                <p>
                  Gravel events use public roads with real traffic. A rider at <b>25 mph</b> rolling a rural intersection has zero margin for error.
                </p>
              </article>
              <article className="icard">
                <p className="ix">03 · Culture</p>
                <h3>Culture change.</h3>
                <p>
                  When the practice is visible, stopping becomes the default — not because someone is watching from a truck, but because the data exists.
                </p>
              </article>
            </div>

            <p className="end-link"><Link to="/safety">Read the full safety case&nbsp;→</Link></p>
          </div>
        </section>

        {/* §04 three steps */}
        <section className="section steps">
          <div className="page">
            <p className="kicker">How it works</p>
            <h2>Three steps. <em>Zero manual work.</em></h2>

            <div className="row">
              <article className="step">
                <p className="num">Step 01</p>
                <h3>Upload your course.</h3>
                <p>Upload your GPX or FIT file. StopCheck auto-detects every stop sign along the route using OpenStreetMap community data. Add or remove stops manually on the map.</p>
              </article>
              <article className="step">
                <p className="num">Step 02</p>
                <h3>Riders connect in one tap.</h3>
                <p>Add your riders and send route emails. Riders tap one button to connect Strava, Garmin, or Wahoo. No account. No app. Under 30 seconds.</p>
              </article>
              <article className="step">
                <p className="num">Step 03</p>
                <h3>Reports generated automatically.</h3>
                <p>After the ride, reports appear automatically in your dashboard. Every stop, every rider, every speed reading. Pass/fail verdicts and findings flagged for organizer review.</p>
              </article>
            </div>

            <p className="end-link"><Link to="/how-it-works">See the full walkthrough&nbsp;→</Link></p>
          </div>
        </section>

        {/* §05 numbers band */}
        <section className="numbers">
          <div className="page">
            <div className="num-cell">
              <span className="v">3 <em>sec</em></span>
              <span className="l">Stop detection threshold</span>
            </div>
            <div className="num-cell">
              <span className="v">25 <em>m</em></span>
              <span className="l">Geofence accuracy</span>
            </div>
            <div className="num-cell">
              <span className="v">&lt; 5 <em>min</em></span>
              <span className="l">Processing time after upload</span>
            </div>
            <div className="num-cell">
              <span className="v">0</span>
              <span className="l">Rider accounts required</span>
            </div>
          </div>
        </section>

        {/* §06 pricing handoff */}
        <section className="pricing-handoff">
          <div className="page">
            <div className="row">
              <p className="copy">
                2027 events <em>from $199.</em> Soft-launch pricing, Practice Mode, and Community Sponsorship for 501(c)(3) events all live on the pricing page.
              </p>
              <Link to="/pricing" className="link">See pricing&nbsp;→</Link>
            </div>
          </div>
        </section>

        {/* §07 mutuality (locked · carries verbatim) */}
        <section className="mutuality">
          <div className="page">
            <p className="kicker no-mark" style={{ color: 'var(--warm)' }}>
              <span style={{ background: 'var(--warm)', width: '11px', height: '11px', display: 'inline-block' }} />
              &nbsp;The spine
            </p>
            <h2>Stop, check, go is mutual.</h2>
            <p className="body">
              When you pass a rider with a flat, you stop and ask. That's gravel. Stop, check, go at every stop sign is the same instinct, applied to the part of the course where the bike can't win. The three seconds is the practice we keep, together, so the events keep happening.
            </p>
            <p className="coda"><Link to="/about">About StopCheck GO&nbsp;→</Link></p>
          </div>
        </section>

        {/* §08 privacy */}
        <section className="section privacy">
          <div className="page">
            <p className="kicker">Privacy</p>
            <h2>Privacy first, <em>by design.</em></h2>
            <p className="lede">Data minimization is the architecture, not an afterthought.</p>

            <div className="grid">
              <div className="ptile">
                <span className="pl">01 · Tracks</span>
                <h3>No full GPS tracks stored — ever.</h3>
                <p>We process the file, extract the stop events, and discard the rest. The line on the map never lives on our servers.</p>
              </div>
              <div className="ptile">
                <span className="pl">02 · Files</span>
                <h3>FIT files deleted within <b>48 hours</b>.</h3>
                <p>Source files are purged on a 48-hour rolling window after processing. Only stop-event records persist beyond that.</p>
              </div>
              <div className="ptile">
                <span className="pl">03 · Accounts</span>
                <h3>No rider accounts required.</h3>
                <p>Riders connect Strava, Garmin, or Wahoo with one tap. No password. No app to install. No standing relationship with us.</p>
              </div>
              <div className="ptile">
                <span className="pl">04 · Posture</span>
                <h3>Data minimization is the architecture.</h3>
                <p>What we don't collect, we can't lose. The privacy posture is structural — not a setting you turn on.</p>
              </div>
            </div>

            <p className="end-link"><Link to="/privacy">Read our privacy policy&nbsp;→</Link></p>
          </div>
        </section>

        {/* §09 final */}
        <section className="section final">
          <div className="page">
            <p className="kicker">Closing</p>
            <h2>Ready to bring stop, check, go to your event?</h2>
            <p className="lede">Join the gravel events making stop, check, go automatic, defensible, and fair.</p>
            <div className="cta-row">
              <Link to="/how-it-works" className="btn-primary">See how it works&nbsp;→</Link>
              <Link to="/start" className="btn-secondary">Start an assessment&nbsp;→</Link>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  )
}
