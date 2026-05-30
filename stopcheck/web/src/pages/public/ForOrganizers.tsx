import { Link } from 'react-router-dom'
import PublicLayout from '../../components/public/PublicLayout'
import './ForOrganizers.css'

/**
 * /for-organizers — Stage 4 Step 7 v1.1
 * v1.3 voice ("report, don't enforce") locked.
 * SBT GRVL §05 canonical case study applied verbatim.
 */
export default function ForOrganizers() {
  return (
    <PublicLayout>
      <div className="page-for-organizers">
        {/* §01 header */}
        <section className="top">
          <div className="page">
            <p className="h1">For organizers.</p>
            <p className="h1-meta">/for-organizers · v1 · v1.3 voice</p>
          </div>
        </section>

        {/* §01 v1.3 locked lede · verbatim */}
        <section className="lede-wrap">
          <div className="page">
            <p className="lede">
              You wrote the rules. You lack the tools to enforce them. Stop Check GO records what happens at every stop sign on the course and delivers a record per rider. Penalty decisions stay with you and your existing rules. Visibility is the first step to rule enforcement. <em>We watch and report so you can run your event safely and fairly.</em>
            </p>
          </div>
        </section>

        {/* §02 relief */}
        <section className="section">
          <div className="page">
            <p className="kicker">Beat 01 · the relief</p>
            <h2>We do the watching.</h2>
            <p className="sub">
              The pain isn't writing the rules. The pain is being the one who has to see whether the rules were observed — at sixty stop signs, across hundreds of riders, over six hours of moving traffic.
            </p>

            <div className="relief-block">
              <p>Race promoters write rules requiring stops at every stop sign on course. The community needs the rules observed. The permits and safety depend on it.</p>
              <p>But the only ways an organizer learns whether the rules were observed are: standing at intersections themselves, asking volunteers to stand at intersections, or accepting that the rules go un-checked, and unfollowed.</p>
              <p>Stop Check GO does the data work — recording what happened at each stop sign, for each rider, so the organizer has a record. <em>What the organizer does with the record is the organizer's call.</em></p>
            </div>
          </div>
        </section>

        {/* §03 demonstration */}
        <section className="section alt">
          <div className="page">
            <p className="kicker">Beat 02 · the demonstration</p>
            <h2>A record you can show.</h2>
            <p className="sub">
              When a permit conversation goes hard, the question isn't whether you wrote a stop-sign rule. The question is whether you can show the rule was observed.
            </p>

            <div className="prose">
              <p>
                Stop Check GO delivers a per-rider record of what happened at each stop sign on the course — speed at the geofence, time in the zone, whether the rider came below 2 mph for the threshold three seconds. The record exists. It is auditable. It can be shared with the people who need to see it.
              </p>
              <p>
                That record is the thing you can show — to riders who want to know how they did, to underwriters who want to see the rule wasn't aspirational, to land managers and county sheriffs who watched the route last year and want to know what's different this time. <b>The record is the demonstration.</b> Not a marketing promise; a per-rider per-stop dataset.
              </p>
              <p>
                Per Privacy: per-rider data exists for 48 hours after results, then purges. The record is yours to hold while the conversations are happening; the data infrastructure does not retain it indefinitely. The structural commitments behind that are on <Link to="/trust" style={{ color: 'var(--warm)', borderBottom: '1.5px solid var(--warm)', textDecoration: 'none', paddingBottom: '1px' }}>/trust</Link>.
              </p>
            </div>
          </div>
        </section>

        {/* §04 permits + community trust */}
        <section className="section">
          <div className="page">
            <p className="kicker">Beat 03 · what gets preserved</p>
            <h2>Permits and community trust.</h2>
            <p className="sub">
              Course access is a relationship. Relationships are kept by what people see, repeatedly, over years.
            </p>

            <div className="prose">
              <p>
                The reason a stop-sign rule exists at all is that gravel events ride through communities that don't have to host them. The county sheriff who closed a road for last year's event will close it again next year only if last year's event didn't generate calls to the desk on Monday morning. The land manager who issued a permit will issue another one only if the report from the field doesn't include "riders blew through the intersection at the bottom of the descent."
              </p>
              <p>
                Shared visibility — riders, organizers, and the communities the events ride through all knowing what happened at the stop signs — strengthens the permit conversation. Not because Stop Check GO argues for the organizer; because Stop Check GO makes the rider behavior visible, and visible rider behavior is enforceable behavior. You now have the tools to help riders do the right thing for themselves, other riders and the events they love.
              </p>
              <p>
                This is the long game. Events that demonstrate practice survive. Events that don't, eventually don't get permits, or much worse.
              </p>
            </div>
          </div>
        </section>

        {/* §05 SBT GRVL canonical case study */}
        <section className="section alt">
          <div className="page">
            <div className="case">
              <p className="case-tag">Case study · <b>SBT GRVL</b></p>
              <h3>What happened to SBT GRVL.</h3>

              <div className="prose" style={{ marginTop: '8px' }}>
                <p>
                  <em>SBT GRVL</em> is one of the largest gravel cycling events in the world. It's also the case the sport is paying attention to — for what it reveals about how community trust, law enforcement capacity, and event scale interact when a permit comes up for review.
                </p>
                <p>
                  The race grew from 1,500 riders in 2019 to a cap of 3,000 by 2022, using over 100 miles of rural Routt County roads passing 350 residences. Through 2023 and 2024, ranchers filed extensive complaints with the county. SBT GRVL responded with the most thorough operational improvements an organizer can make: courses moved to remote roads, two-way traffic eliminated, more flaggers and law enforcement, larger bib numbers, signed rider oaths, a public reporting line for rule violations, an on-course command center, direct outreach to all on-course residents. Local officials commended the team's responsiveness.
                </p>
                <p>
                  In September 2024, the Sheriff and State Patrol — who applauded the rider behavior improvements — told commissioners that 3,000 riders was no longer workable for the officers covering the event. The State Patrol also noted that open-road racing is technically illegal in Colorado. The commissioners proposed an <b>1,800-rider cap</b> for 2025: a <b>40% reduction</b>. The event survived as a two-day split with 1,800 recreational riders Saturday and 750 racers on a closed circuit Sunday.
                </p>
                <p>
                  What's worth taking from this: rider behavior was one variable. Volume, course mileage, days of impact, and law enforcement capacity were the dominant constraints. SBT GRVL fixed the rider-behavior variable as completely as an organizer can. The structural questions — how many riders rural roads can sustain, how much area gets impacted, how many officers can be staffed — drove the restriction.
                </p>
                <p>
                  What Stop Check GO does is the data work on one of those variables. Stop Check GO records what happens at every stop sign on the course and delivers a record per rider. That removes the rider-behavior question from the conversation when a stakeholder raises it. <b>It would not have prevented what happened to SBT GRVL.</b> What it does is take one variable off the list of things the organizer has to defend. Could SCG have helped SBT GRVL?
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* §06 CTA-band */}
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
