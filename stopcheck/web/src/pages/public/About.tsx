import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />

      <section className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">About StopCheck</h1>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <p>
            StopCheck is an automated stop sign compliance platform built specifically for gravel cycling events.
            We exist to solve a simple problem: every major gravel event requires riders to stop at stop signs,
            but until now, no event has had a practical way to verify compliance.
          </p>
          <p>
            Our platform uses GPS data from Strava, Garmin, and Wahoo to automatically detect whether riders
            stopped at every stop sign on the course. No hardware. No volunteers at intersections. No honor system.
            Just data.
          </p>
          <p>
            StopCheck was built by gravel cyclists, for gravel cyclists. We believe in the culture of the sport —
            mutual respect, self-sufficiency, and honoring the rules of the road. Our goal isn't punishment.
            It's accountability. When every rider knows their compliance is recorded, stopping becomes the default.
          </p>
          <p>
            We're building the tool we wish existed: one that protects riders, protects events, and protects
            the communities whose roads we ride through.
          </p>
        </div>

        <div className="mt-10 flex gap-3 flex-wrap">
          <Link to="/safety" className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium no-underline hover:bg-green-700">
            Why Safety Matters
          </Link>
          <Link to="/how-it-works" className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium no-underline hover:bg-gray-200">
            How It Works
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
