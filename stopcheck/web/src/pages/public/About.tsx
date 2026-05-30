import { Link } from 'react-router-dom'
import PublicLayout from '../../components/public/PublicLayout'
import './About.css'

/**
 * /about — Stage 4 Step 8 v1.
 * Founder narrative locked verbatim per Brand Voice v1.2 (Sept 21, 2025 incident).
 * Photo slot from prototype omitted per its own fallback rule
 * ("omit slot entirely if no image supplied at Claude Code handoff").
 * Photo can be added later if Josh sources one.
 */
export default function About() {
  return (
    <PublicLayout>
      <div className="page-about">
        <article className="about-page">
          {/* §01 header */}
          <header className="about-head">
            <h1 className="about-h1">About.</h1>
          </header>

          {/* §02 founder narrative · locked verbatim per Brand Voice v1.2 */}
          <section className="narrative">
            <p className="opener">
              <span className="date">September 21, 2025.</span> I was on a rural bike trail in southeast Nebraska that I'd ridden for years. Crossing a gravel road — trail with stop signs, road with a small sign warning drivers that a trail crossed ahead. I stopped at my stop sign. I looked left, looked right, thought I was clear, started rolling into the intersection. Looking back now it was a hard one to read: trees, tall standing corn, just enough moisture to calm any dust trails. The faded, dust-covered old Chevy 3500 with paint the same tone as the gravel was moving close to sixty when I saw it to my left.
            </p>

            <p className="beat">
              There is no pause in real life, but time slowed down enough for me to know I done screwed up.
            </p>

            <p>
              The truck driver did not see me. I did not see him until it was too late. Physics went the way physics goes. The bike loses.
            </p>

            <p>
              I rode away from that intersection in an ambulance fighting to keep breathing instead of rolling home on my bike. I got very lucky. The stop put my front tire at the door of the truck instead of my body under it. A check would have kept me out of the intersection entirely.
            </p>

            <p>
              I learned the sequence the hard way: stop, check, go. Like ready, set, go at the start line — three things in order, each one the gate for the next.
            </p>

            <p>
              Stop Check GO exists to encode that sequence into how gravel events are ridden. The platform measures the stop because that's what we can measure. The check is what the stop is for, and the platform trusts riders to do that part. Once you've stopped, a check has no extra cost. What the platform does is make the practice visible — to peers, to organizers, to the communities the events ride through — because visibility is what turns a private decision into a shared one, and shared practices are what hold.
            </p>

            <p>
              No one wants to have their momentum killed by stopping when they could just roll through with a glance. But glances don't give second chances. You'd be surprised how fast the day gets ruined when a truck slaps you down. A second look would have caught it when the first look didn't.
            </p>

            <p className="short">That's why the check matters.</p>

            <p className="coda-line">Stop. Check. Go.</p>

            <p className="signoff">
              <b>Josh Shear</b> · Founder · Locked April 26, 2026 · v1.2
            </p>
          </section>

          {/* §04 coda */}
          <section className="coda">
            <p>
              That's why this exists. If you organize gravel events, <Link to="/how-it-works">see how it works</Link>.
            </p>
          </section>
        </article>
      </div>
    </PublicLayout>
  )
}
