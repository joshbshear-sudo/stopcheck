import { Link } from 'react-router-dom'

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />

      <section className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">How StopCheck Works</h1>
        <p className="text-gray-600 mb-12">Three steps. Zero hardware. Full compliance reports in minutes.</p>

        <div className="space-y-12">
          <StepDetail
            num="1"
            title="Upload Your Course"
            details={[
              'Upload your GPX or FIT course file to the StopCheck dashboard.',
              'StopCheck auto-detects every stop sign along the route using OpenStreetMap data.',
              'A 20-meter geofence zone is created around each stop sign.',
              'Review and adjust stop zones on the interactive map before the event.',
            ]}
          />
          <StepDetail
            num="2"
            title="Riders Connect in One Tap"
            details={[
              'Send riders their unique StopCheck link via email (automated) or your registration platform.',
              'Riders tap one button to connect Strava, Garmin, or Wahoo.',
              'No account creation. No app download. Under 30 seconds.',
              'Works with any GPS device riders already use.',
            ]}
          />
          <StepDetail
            num="3"
            title="Reports Generated Automatically"
            details={[
              'After the ride, StopCheck pulls GPS activity data automatically.',
              'Per-stop speed analysis determines compliance at each stop sign zone.',
              'Pass/fail verdicts with speed data for every rider at every stop.',
              'DQ recommendations flagged for organizer review — no automated disqualifications.',
              'Export PDF reports or review in the dashboard.',
            ]}
          />
        </div>
      </section>

      <section className="bg-gray-50 py-14">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Details</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Detail title="Stop Detection" text="3-second stop threshold at each geofenced zone. Speed must drop below 2 mph to register as a stop." />
            <Detail title="Geofence Accuracy" text="20-meter radius around each stop sign. Calibrated for GPS accuracy on rural roads." />
            <Detail title="Processing Time" text="Under 5 minutes from ride upload to full compliance report." />
            <Detail title="Crossing Guards" text="Time-stamped waiver system for directed intersections. Protects riders from false violations." />
          </div>
        </div>
      </section>

      <section className="bg-green-600 py-12">
        <div className="max-w-2xl mx-auto px-4 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-green-100 mb-6">5-event free trial. No credit card required.</p>
          <Link to="/register"
            className="inline-block px-8 py-3 bg-white text-green-700 rounded-xl font-semibold text-lg no-underline hover:bg-green-50">
            Start Free Trial
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
          <Link to="/how-it-works" className="text-sm text-green-700 font-medium no-underline">How It Works</Link>
          <Link to="/pricing" className="text-sm text-gray-600 no-underline hover:text-gray-800">Pricing</Link>
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
            <Link to="/how-it-works" className="block text-gray-400 no-underline hover:text-white">How It Works</Link>
          </div>
        </div>
        <div>
          <div className="font-semibold text-gray-300 mb-3">Mission</div>
          <div className="space-y-1">
            <Link to="/safety" className="block text-gray-400 no-underline hover:text-white">Why Safety Matters</Link>
            <Link to="/community" className="block text-gray-400 no-underline hover:text-white">Community Sponsorship</Link>
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

function StepDetail({ num, title, details }: { num: string; title: string; details: string[] }) {
  return (
    <div className="flex gap-5">
      <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center text-lg font-bold shrink-0">
        {num}
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
        <ul className="space-y-2">
          {details.map(d => (
            <li key={d} className="text-gray-600 flex items-start gap-2">
              <span className="text-green-500 mt-0.5">&#10003;</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Detail({ title, text }: { title: string; text: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{text}</p>
    </div>
  )
}
