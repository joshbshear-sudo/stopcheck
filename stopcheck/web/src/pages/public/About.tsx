import { Link } from 'react-router-dom'
import PublicNav from '../../components/public/PublicNav'
import PublicFooter from '../../components/public/PublicFooter'

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      <section className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">About StopCheck</h1>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <p>
            StopCheck GO is an automated stop, check, go platform built specifically for gravel cycling events.
            We exist to solve a simple problem: every major gravel event requires riders to stop at stop signs,
            but until now, no event has had a practical way to make the practice visible.
          </p>
          <p>
            Our platform uses GPS data from Strava, Garmin, and Wahoo to automatically detect whether riders
            stopped at every stop sign on the course. No hardware. No volunteers at intersections. No honor system.
            Just data.
          </p>
          <p>
            StopCheck was built by gravel cyclists, for gravel cyclists. We believe in the culture of the sport &mdash;
            mutual respect, self-sufficiency, and honoring the rules of the road. Our goal isn't punishment.
            It's accountability. When every rider knows their stops are recorded, stopping becomes the default.
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

      <PublicFooter />
    </div>
  )
}
