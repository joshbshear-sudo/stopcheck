import { Link } from 'react-router-dom'
import PublicLayout from '../../components/public/PublicLayout'
import CompliantTile from '../../components/whatcounts/CompliantTile'
import NotCompliantTile from '../../components/whatcounts/NotCompliantTile'
import WhatCountsSvgDefs from '../../components/whatcounts/WhatCountsSvgDefs'
import './ForRiders.css'

export default function ForRiders() {
  return (
    <PublicLayout>
      <div className="page-for-riders">
        {/* §01 header */}
        <section className="top">
          <div className="page">
            <p className="h1">For riders.</p>
            <p className="h1-meta">/for-riders · v1.1 · v1.3 voice · rider-with-flat register</p>
          </div>
        </section>

        {/* §01 lede */}
        <section className="lede-wrap">
          <div className="page">
            <p className="lede">You roll up to the stop sign and you put a foot down, that's a true stop. Some riders do, some of the time. This has to change.</p>
            <p className="lede">
              The reason we monitor stops is to keep events fair and safe. Everyone stops, every time.
            </p>
          </div>
        </section>

        {/* §02 audience of non-riders */}
        <section className="section">
          <div className="page">
            <p className="kicker">Beat 01 · who's watching</p>
            <h2>The county sheriff. The rancher. The person at their kitchen window.</h2>
            <p className="sub">
              They live on the road the event goes through. They didn't sign up for the race. They're the ones whose Monday morning gets quieter or louder depending on what they saw on Saturday.
            </p>

            <div className="prose">
              <p>
                The way a gravel event gets a permit next year is that the people whose roads it ran on don't show up at the county meeting with complaints. The way they don't show up with complaints is that what they saw on Saturday looked like a group of people who knew they were guests.
              </p>
              <p>
                Stop signs are the part of that they see most clearly. They're standing in their kitchen with a coffee. They watch a rider come down the hill. They watch what the rider does at the intersection at the bottom. <b>Those ten seconds are the thing the next year's permit conversation is mostly about. A stop shows the rider is a good citizen and respects the community they are in. A rider blowing through a stop sign is a menace. The smallest actions can have outsized impacts.</b>
              </p>
              <p>
                None of this is news to most riders. The reason it's worth saying out loud is that the gap between knowing it and the watcher seeing it is what makes the difference for events like the ones we ride.
              </p>
            </div>
          </div>
        </section>

        {/* what-counts teaser · pre-§03 · routes riders to /what-counts */}
        <section className="section what-counts-teaser">
          <div className="page">
            <WhatCountsSvgDefs />
            <h2>What counts as a stop?</h2>
            <p className="sub">
              Stop Check GO uses the Three-Second Rule as the named standard. See what the system credits, what it doesn't, and why.
            </p>
            <div className="teaser-tiles">
              <CompliantTile />
              <NotCompliantTile />
            </div>
            <p className="teaser-cta">
              <Link to="/what-counts">See all four examples&nbsp;→</Link>
            </p>
          </div>
        </section>

        {/* §03 what the platform actually does */}
        <section className="section alt">
          <div className="page">
            <p className="kicker">Beat 02 · what this is</p>
            <h2>It's a data read, not a marshal.</h2>
            <p className="sub">
              Nothing physical at the intersection. No camera. No person standing at the corner with a clipboard. Nobody yelling.
            </p>

            <div className="prose">
              <p>
                Stop Check GO reads dwell-time data from the GPS or wheel-sensor stream your bike computer is recording anyway. After the event, the platform looks at what your file shows happened at each stop sign on the course — speed at the geofence, time in the zone, whether the bike came below 2&nbsp;mph for a few seconds — and writes that down per rider, per intersection.
              </p>
              <p>
                That's it. The platform is data-only. It doesn't intervene during the ride. It doesn't have eyes. It doesn't talk to anyone in real time. <b>It reads files after the fact and turns them into a record. Each rider is responsible for obeying the rules. Every rider, every stop sign, every time.</b>
              </p>
              <p>
                What the organizer does with the record is the organizer's call. Penalty rules belong to the event, not to us. We do the reading; the organizer decides what counts. If it breaks the rules it's cheating.
              </p>
            </div>
          </div>
        </section>

        {/* §04 rider experience */}
        <section className="section">
          <div className="page">
            <p className="kicker">Beat 03 · what you'll see</p>
            <h2>What this looks like from your saddle.</h2>
            <p className="sub">
              Mostly: it doesn't. You ride the event the way you'd ride any event. The platform happens around you, before and after, not during.
            </p>

            <div className="data-block">
              <p className="label">The flow · rider-side</p>
              <ul>
                <li>
                  <b>Before the event · linking your account.</b> Three ways your account gets bound to your bib. The cleanest is a one-click activation link the organizer's registration system emails you — click it, pick how the platform reads your data (Garmin Connect, Strava OAuth, or a FIT file uploaded after the event), and you're done. If that email doesn't reach you, signing up directly with the address the organizer has on the roster does the same thing by email match. Failing both, the platform falls back to matching your activity by name on the roster, and marks the match accordingly. The first path is the highest-confidence binding; the others are honest about being lower.
                </li>
                <li>
                  <b>During the event.</b> Nothing changes. Ride your ride. Stop at the stops the way you would on a Tuesday-evening group ride.
                </li>
                <li>
                  <b>After the event · what you'll see.</b> Within 48 hours of the event ending, your stop-by-stop record is available alongside results. Each entry is a dwell time at one stop sign, classified by what the data shows: full stop, brief stop, rolling, or inconclusive. Plain language; one row per intersection.
                </li>
                <li>
                  <b>If something looks wrong · the dispute path.</b> Sensor glitches happen. If a finding doesn't match what you know happened, click flag. That opens a dispute the organizer reviews during the 48-hour window after the event ends. Disputes resolve one of three ways: confirmed, corrected, or held as recorded. When the window closes, all per-rider data is deleted. What remains is the aggregate event report — no individual rider data sits on a server beyond that.
                </li>
              </ul>
            </div>

            <div className="prose" style={{ marginTop: '28px' }}>
              <p>
                The Privacy posture is on <Link to="/trust" style={{ color: 'var(--warm)', borderBottom: '1.5px solid var(--warm)', textDecoration: 'none', paddingBottom: '1px' }}>/trust</Link>. Short version: per-rider data lives 48 hours. Subpoena posture is published. Change-of-control protections are written down. The structural commitments are in the open so a rider can read them before deciding how they feel about the platform reading their file.
              </p>
            </div>
          </div>
        </section>

        {/* §05 CTA */}
        <section className="cta-band">
          <div className="page">
            <p className="kicker">Closing</p>
            <h2>If your next event isn't using it, the organizer should hear about it from you. Keep every rider safe and every event fair.</h2>
            <p className="tagline">
              The events that demonstrate effective rule enforcement practices are the ones that survive.
            </p>
            <div className="cta-row">
              <Link to="/how-it-works" className="cta-link">See how it works&nbsp;→</Link>
              <span className="cta-meta">no signup · rider-routed</span>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  )
}
