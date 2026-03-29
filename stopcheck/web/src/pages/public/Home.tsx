import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-16 pb-20 text-center">
        <div className="inline-block px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full mb-6">
          Trusted by gravel events nationwide
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
          Stop Sign Compliance,<br />Automated.
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Verify every rider stops at every stop sign. Automatic. Defensible. Fair.
          Built for gravel events from 20 riders to 4,000.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link to="/register"
            className="px-8 py-3 bg-green-600 text-white rounded-xl font-semibold text-lg no-underline hover:bg-green-700 transition-colors">
            Start Free
          </Link>
          <a href="#how-it-works"
            className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-lg no-underline hover:bg-gray-200 transition-colors">
            How It Works
          </a>
        </div>
        <p className="text-sm text-gray-400 mt-4">5-event free trial. Starting at $29 per event.</p>
      </section>

      {/* How It Works */}
      {/* Safety banner */}
      <section className="bg-gray-900 py-10">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-lg text-white font-medium leading-relaxed">
            "The rule has always been: stop at every stop sign.<br />Now there's a way to verify it."
          </p>
          <Link to="/safety" className="inline-block mt-4 text-green-400 font-medium no-underline hover:text-green-300">
            Learn why this matters &rarr;
          </Link>
        </div>
      </section>

      <section id="how-it-works" className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Step num="1" title="Upload Your Course" desc="Upload your GPX or FIT course file. StopCheck auto-detects every stop sign along the route using OpenStreetMap data." />
            <Step num="2" title="Riders Connect in One Tap" desc="Send riders their link. They tap one button to connect Strava, Garmin, or Wahoo. No account needed. Under 30 seconds." />
            <Step num="3" title="Reports Generated Automatically" desc="After the ride, compliance reports appear automatically. Per-stop speed data, pass/fail verdicts, DQ recommendations." />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Built for Race Directors</h2>
          <p className="text-gray-600 max-w-xl mx-auto mb-8">
            Zero behavior change for riders. Zero manual work for organizers.
            Sensor-based evidence for every compliance decision.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Stat value="3s" label="Stop Detection" />
            <Stat value="20m" label="Geofence Accuracy" />
            <Stat value="< 5 min" label="Processing Time" />
            <Stat value="0" label="False Positives" />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Simple Pricing</h2>
          <p className="text-gray-500 text-center mb-10">5-event free trial. Upgrade when you're ready.</p>
          <div className="grid md:grid-cols-3 gap-4">
            <PricingCard name="Starter" price="$29" period="per event" features={['Up to 150 riders', 'All compliance features', 'PDF export', 'Email notifications']}
              cta="Get Started" ctaLink="/register" />
            <PricingCard name="Event Pass" price="$49" period="per event" features={['Unlimited riders', 'One event', 'Priority processing', 'All Starter features']}
              cta="Get Started" ctaLink="/register" highlight />
            <PricingCard name="Season Pro" price="$299" period="per year" features={['Unlimited riders', 'Unlimited events', 'All Event Pass features', 'Year-round access']}
              cta="Go Pro" ctaLink="/register" />
          </div>
          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">Starter</div>
                <div className="text-sm text-gray-500">51-150 riders, one event</div>
              </div>
              <div className="font-bold text-gray-900">$29</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">Series</div>
                <div className="text-sm text-gray-500">Unlimited everything + priority support</div>
              </div>
              <div className="font-bold text-gray-900">$799/yr</div>
            </div>
          </div>
          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-5 text-center">
            <div className="font-semibold text-green-800">Community Sponsorship</div>
            <p className="text-sm text-green-700 mt-1">
              Charity-affiliated events can apply for free full access.
              <Link to="/apply/community" className="text-green-600 font-medium ml-1">Apply now</Link>
            </p>
          </div>
        </div>
      </section>

      {/* Privacy callout */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Privacy First</h2>
          <p className="text-gray-600">
            StopCheck never stores full GPS tracks. Only stop-zone speed data is retained as evidence.
            No tracking. No third-party analytics. No rider accounts required.
          </p>
          <Link to="/privacy" className="text-green-600 font-medium mt-2 inline-block">Read our privacy policy</Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-600 py-12">
        <div className="max-w-2xl mx-auto px-4 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Ready to automate compliance?</h2>
          <Link to="/register"
            className="inline-block px-8 py-3 bg-white text-green-700 rounded-xl font-semibold text-lg no-underline hover:bg-green-50">
            Start Free — No Credit Card
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function Nav() {
  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-green-700 font-bold text-lg no-underline">
          <span className="text-xl">&#128721;</span> StopCheck
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/safety" className="text-sm text-gray-600 no-underline hover:text-gray-800">Safety</Link>
          <Link to="/how-it-works" className="text-sm text-gray-600 no-underline hover:text-gray-800">How It Works</Link>
          <a href="#pricing" className="text-sm text-gray-600 no-underline hover:text-gray-800">Pricing</a>
          <Link to="/community" className="text-sm text-gray-600 no-underline hover:text-gray-800">Community</Link>
          <Link to="/login" className="text-sm text-gray-600 no-underline hover:text-gray-800">Sign In</Link>
          <Link to="/register"
            className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium no-underline hover:bg-green-700">
            Start Free
          </Link>
        </div>
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-10">
      <div className="max-w-4xl mx-auto px-4 grid md:grid-cols-4 gap-8 text-sm">
        <div>
          <div className="text-white font-bold mb-3">&#128721; StopCheck</div>
          <p>Gravel event stop sign compliance, automated.</p>
        </div>
        <div>
          <div className="font-semibold text-gray-300 mb-3">Product</div>
          <div className="space-y-1">
            <Link to="/register" className="block text-gray-400 no-underline hover:text-white">Get Started</Link>
            <Link to="/pricing" className="block text-gray-400 no-underline hover:text-white">Pricing</Link>
          </div>
        </div>
        <div>
          <div className="font-semibold text-gray-300 mb-3">Mission</div>
          <div className="space-y-1">
            <Link to="/safety" className="block text-gray-400 no-underline hover:text-white">Why Safety Matters</Link>
            <Link to="/community" className="block text-gray-400 no-underline hover:text-white">Community Sponsorship</Link>
            <Link to="/apply/community" className="block text-gray-400 no-underline hover:text-white">Apply for Sponsorship</Link>
          </div>
        </div>
        <div>
          <div className="font-semibold text-gray-300 mb-3">Legal</div>
          <div className="space-y-1">
            <Link to="/privacy" className="block text-gray-400 no-underline hover:text-white">Privacy Policy</Link>
            <Link to="/terms" className="block text-gray-400 no-underline hover:text-white">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
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
      <div className="text-2xl font-bold text-green-600">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  )
}

function PricingCard({ name, price, period, features, cta, ctaLink, highlight }: {
  name: string; price: string; period: string; features: string[]
  cta: string; ctaLink: string; highlight?: boolean
}) {
  return (
    <div className={`rounded-xl p-6 ${highlight ? 'bg-green-600 text-white border-2 border-green-600' : 'bg-white border border-gray-200'}`}>
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
