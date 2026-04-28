import PublicNav from '../../components/public/PublicNav'
import PublicFooter from '../../components/public/PublicFooter'

export default function FAQ() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      <section className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h1>

        <div className="space-y-8">
          <Item
            q="What is StopCheck?"
            a="StopCheck GO is an automated stop, check, go platform for gravel cycling events. It verifies whether riders stopped at every stop sign on the course using GPS data from Strava, Garmin, or Wahoo."
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
            q="Does StopCheck GO automate organizer review?"
            a="No. StopCheck GO surfaces findings — organizers make the decisions. Every finding requires two deliberate clicks from an event organizer to confirm. There is no automated review."
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

      <PublicFooter />
    </div>
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
