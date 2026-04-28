import { Link } from 'react-router-dom'
import PublicNav from '../../components/public/PublicNav'
import PublicFooter from '../../components/public/PublicFooter'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      {/* SECTION 1 — HERO */}
      <section className="bg-[#0f172a] py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-green-400 text-sm font-medium mb-4">
            For gravel event organizers
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
            Stop, check, go.<br />
            Three seconds at every stop sign &mdash; the practice that keeps gravel events on the roads they need.
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            You wrote the rules. You shouldn't have to be the one calling them out. StopCheck GO does that work, so you can keep doing the work only you can do.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/register"
              className="px-8 py-3 bg-green-600 text-white rounded-xl font-semibold text-lg no-underline hover:bg-green-700 transition-colors">
              Start Free Trial
            </Link>
            <Link to="/how-it-works"
              className="px-8 py-3 border border-white text-white rounded-xl font-semibold text-lg no-underline hover:bg-white/10 transition-colors">
              See How It Works
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-5">Free trial — 5 events or through first paid event. Then $29 per event.</p>
        </div>
      </section>

      {/* SECTION 2 — THE PROBLEM */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-white text-center mb-10">Every Event Has the Rule. None Has Had a Way to Make the Practice Visible.</h2>
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <blockquote className="border-l-4 border-green-500 pl-5 py-2">
              <p className="text-gray-300 italic leading-relaxed">
                "The course will NOT be closed to traffic and cycling rules of the road apply —
                stop at all stop signs."
              </p>
              <cite className="block mt-3 text-sm text-gray-500 not-italic">— Barry-Roubaix Official Rules</cite>
            </blockquote>
            <div className="text-gray-300 leading-relaxed space-y-4">
              <p>
                Unbound Gravel. SBT GRVL. Gravel Worlds. Barry-Roubaix. Every major event has the same rule.
                None has had a way to make the practice visible.
              </p>
              <p>
                With thousands of riders on open public roads, manual verification is impossible.
                StopCheck GO makes it automatic.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — WHY IT MATTERS */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">The Incentives Are Real. So Is the Danger.</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <WhyCard
              icon="&#9889;"
              title="Competitive Pressure"
              text="A full stop costs 30–60 seconds of recovery. In a close race that gap means podium or field. Every rider knows it."
            />
            <WhyCard
              icon="&#128721;"
              title="Open Public Roads"
              text="Gravel events use public roads with real traffic. A rider at 25 mph rolling a rural intersection has zero margin for error."
            />
            <WhyCard
              icon="&#128260;"
              title="Culture Change"
              text="When the practice is visible, stopping becomes the default — not because someone is watching from a truck, but because the data exists."
            />
          </div>
          <div className="text-center mt-8">
            <Link to="/safety" className="text-green-600 font-medium no-underline hover:text-green-700">
              Read the full safety case &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 4 — HOW IT WORKS */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">Three Steps. Zero Manual Work.</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Step num="1" title="Upload Your Course"
              desc="Upload your GPX or FIT file. StopCheck auto-detects every stop sign along the route using OpenStreetMap community data. Add or remove stops manually on the map." />
            <Step num="2" title="Riders Connect in One Tap"
              desc="Add your riders and send route emails. Riders tap one button to connect Strava, Garmin, or Wahoo. No account. No app. Under 30 seconds." />
            <Step num="3" title="Reports Generated Automatically"
              desc="After the ride, reports appear automatically in your dashboard. Every stop, every rider, every speed reading. Pass/fail verdicts and findings flagged for organizer review." />
          </div>
          <div className="text-center mt-10">
            <Link to="/how-it-works"
              className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium no-underline hover:bg-green-700 inline-block">
              See the full walkthrough &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 5 — STATS BAR */}
      <section className="bg-[#0f172a] py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <Stat value="3 seconds" label="Stop detection threshold" />
            <Stat value="50 meters" label="Geofence accuracy" />
            <Stat value="< 5 min" label="Processing time after upload" />
            <Stat value="0" label="Rider accounts required" />
          </div>
        </div>
      </section>

      {/* SECTION 6 — PRICING */}
      <section id="pricing" className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Simple, Transparent Pricing</h2>
          <p className="text-gray-500 text-center mb-10">5-event free trial included. No credit card required.</p>
          <div className="grid md:grid-cols-3 gap-4">
            <PricingCard name="Starter" price="$29" period="per event"
              features={['Up to 150 riders', '1 event', 'All platforms (Strava/Garmin/Wahoo)', 'OSM auto-detection', 'PDF export', 'Email support']}
              cta="Get Started" ctaLink="/register" />
            <PricingCard name="Event Pass" price="$49" period="per event" badge="Most Popular"
              features={['Up to 500 riders', '1 event', 'Everything in Starter', 'Custom report branding', 'Priority processing']}
              cta="Get Started" ctaLink="/register" highlight />
            <PricingCard name="Season Pro" price="$299" period="per year"
              features={['Unlimited riders', 'Unlimited events', 'Everything in Event Pass', 'Multi-event dashboard', 'Priority support']}
              cta="Go Pro" ctaLink="/register" />
          </div>
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
            <div>
              <span className="font-semibold text-gray-900">Series</span>
              <span className="text-sm text-gray-500 ml-2">Unlimited everything + API + white-label</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-gray-900">$799/yr</span>
              <Link to="/pricing" className="text-sm text-green-600 font-medium no-underline hover:text-green-700">Details &rarr;</Link>
            </div>
          </div>
          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-5 text-center">
            <div className="font-semibold text-green-800">Community Sponsorship</div>
            <p className="text-sm text-green-700 mt-1">
              Charity-affiliated gravel events may qualify for free sponsorship.
              <Link to="/apply/community" className="text-green-600 font-medium ml-1 no-underline hover:text-green-700">Apply now &rarr;</Link>
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 7 — RIDER MUTUALITY CALLOUT */}
      <section className="bg-[#0f172a] py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-6">Stop, check, go is mutual.</h2>
          <p className="text-gray-300 leading-relaxed max-w-2xl mx-auto">
            When you pass a rider with a flat, you stop and ask. That's gravel.
            Stop, check, go at every stop sign is the same instinct, applied to the
            part of the course where the bike can't win. The three seconds is the
            practice we keep, together, so the events keep happening.
          </p>
          <Link to="/about" className="inline-block mt-6 text-green-400 font-medium no-underline hover:text-green-300">
            About StopCheck GO &rarr;
          </Link>
        </div>
      </section>

      {/* SECTION 8 — PRIVACY */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Privacy First, By Design.</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <PrivacyItem text="No full GPS tracks stored — ever" />
            <PrivacyItem text="FIT files deleted within 24 hours" />
            <PrivacyItem text="No rider accounts required" />
            <PrivacyItem text="Data minimization is the architecture, not an afterthought" />
          </div>
          <div className="text-center mt-8">
            <Link to="/privacy" className="text-green-600 font-medium no-underline hover:text-green-700">
              Read our privacy policy &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 9 — FINAL CTA */}
      <section className="bg-green-600 py-14">
        <div className="max-w-2xl mx-auto px-4 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">Ready to bring stop, check, go to your event?</h2>
          <p className="text-green-100 mb-6">
            Join the gravel events making stop, check, go automatic, defensible, and fair.
          </p>
          <Link to="/register"
            className="inline-block px-8 py-3 bg-white text-green-700 rounded-xl font-semibold text-lg no-underline hover:bg-green-50">
            Start Free Trial — No Credit Card
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}

function Step({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">{num}</div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{desc}</p>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-bold text-green-400">{value}</div>
      <div className="text-sm text-gray-400 mt-1">{label}</div>
    </div>
  )
}

function WhyCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="text-2xl mb-3">{icon}</div>
      <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
    </div>
  )
}

function PrivacyItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 bg-white rounded-xl border border-gray-200 p-4">
      <span className="text-green-500 mt-0.5 shrink-0">&#10003;</span>
      <span className="text-gray-700">{text}</span>
    </div>
  )
}

function PricingCard({ name, price, period, features, cta, ctaLink, highlight, badge }: {
  name: string; price: string; period: string; features: string[]
  cta: string; ctaLink: string; highlight?: boolean; badge?: string
}) {
  return (
    <div className={`rounded-xl p-6 relative ${highlight ? 'bg-green-600 text-white border-2 border-green-600' : 'bg-white border border-gray-200'}`}>
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
          {badge}
        </div>
      )}
      <h3 className={`font-semibold ${highlight ? 'text-white' : 'text-gray-900'}`}>{name}</h3>
      <div className="mt-2">
        <span className={`text-3xl font-bold ${highlight ? 'text-white' : 'text-gray-900'}`}>{price}</span>
        {period && <span className={`text-sm ml-1 ${highlight ? 'text-green-100' : 'text-gray-500'}`}>{period}</span>}
      </div>
      <ul className="mt-4 space-y-2">
        {features.map(f => (
          <li key={f} className={`text-sm flex items-center gap-2 ${highlight ? 'text-green-100' : 'text-gray-600'}`}>
            <span className={highlight ? 'text-green-200' : 'text-green-500'}>&#10003;</span> {f}
          </li>
        ))}
      </ul>
      <Link to={ctaLink}
        className={`block mt-6 text-center py-2.5 rounded-lg font-medium no-underline ${
          highlight ? 'bg-white text-green-700 hover:bg-green-50' : 'bg-green-600 text-white hover:bg-green-700'
        }`}>
        {cta}
      </Link>
    </div>
  )
}
