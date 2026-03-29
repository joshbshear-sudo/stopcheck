import { Link } from 'react-router-dom'

export default function FAQ() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />

      <section className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h1>

        <div className="space-y-8">
          <Item
            q="What is StopCheck?"
            a="StopCheck is an automated stop sign compliance platform for gravel cycling events. It verifies whether riders stopped at every stop sign on the course using GPS data from Strava, Garmin, or Wahoo."
          />
          <Item
            q="How does it work?"
            a="Event organizers upload their GPX/FIT course file. StopCheck auto-detects stop signs using OpenStreetMap data and creates geofenced zones. After the ride, riders' GPS data is analyzed to determine if they stopped at each zone."
          />
          <Item
            q="Do riders need to create an account?"
            a="No. Riders receive a link, tap one button to connect their activity platform (Strava, Garmin, or Wahoo), and they're done. No account, no app download, under 30 seconds."
          />
          <Item
            q="Is StopCheck automated disqualification?"
            a="No. StopCheck surfaces data — humans make decisions. Every DQ requires two deliberate clicks from an event organizer. There is no automated disqualification."
          />
          <Item
            q="What about crossing guards or directed intersections?"
            a="StopCheck has a crossing guard waiver system. Race officials can issue time-stamped waivers for riders who pass during their directed window."
          />
          <Item
            q="How much does it cost?"
            a="5-event free trial to start. Plans start at $29 per event (Starter), $49 per event (Event Pass), or $299/year (Season Pro) for unlimited events."
          />
          <Item
            q="What data does StopCheck store?"
            a="Only stop-zone speed data is retained as evidence. Full GPS tracks are never stored. No tracking, no third-party analytics."
          />
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

function Item({ q, a }: { q: string; a: string }) {
  return (
    <div className="border-b border-gray-100 pb-6">
      <h3 className="font-semibold text-gray-900 mb-2">{q}</h3>
      <p className="text-gray-600 leading-relaxed">{a}</p>
    </div>
  )
}
