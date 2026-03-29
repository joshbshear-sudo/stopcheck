import { Link } from 'react-router-dom'

export default function Safety() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />

      {/* Hero */}
      <section className="bg-gray-900 text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
            The Rule Has Always Existed.<br />The Enforcement Has Not.
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Every major gravel event in America has the same rule buried in their rulebook: stop at all stop signs.
            Until now, enforcement has been impossible.
          </p>
        </div>
      </section>

      {/* Section 1: The Rule */}
      <section className="py-14">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-gray-700 leading-relaxed mb-6">
            Barry-Roubaix puts it plainly in their official rules: <em>"the course will NOT be closed to traffic
            and cycling rules of the road apply — stop at all stop signs. Violations could be penalized by disqualification."</em>
          </p>
          <p className="text-gray-700 leading-relaxed mb-6">
            Unbound Gravel. SBT GRVL. Gravel Worlds. Barry-Roubaix. The rule is the same everywhere.
          </p>
          <p className="text-gray-700 leading-relaxed">
            With thousands of riders spread across hundreds of miles of open public roads,
            no event has had a practical way to verify compliance. The rule exists. The enforcement has not.
          </p>
        </div>
      </section>

      {/* Section 2: Why Riders Skip Stops */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">The incentives are real. So is the danger.</h2>
          <p className="text-gray-600 mb-8">
            We are not here to shame riders. We understand the pressures that exist on race day — they are real and significant.
            Every rider who rolls a stop sign on a gravel course is responding to genuine competitive pressure:
          </p>

          <div className="grid md:grid-cols-2 gap-5">
            <PressureCard icon="&#9889;" title="Momentum"
              body="A full stop on a gravel climb costs 30-60 seconds to recover. In a close race, that gap is the difference between podium and the field." />
            <PressureCard icon="&#127942;" title="Podium Position"
              body="Amateur and elite riders train year-round for these events. A top finish represents hundreds of hours of preparation. The incentive to gain every second is intense." />
            <PressureCard icon="&#128176;" title="Livelihood"
              body="For professional gravel athletes, podium results drive sponsorships, contracts, and careers. The financial stakes are real." />
            <PressureCard icon="&#128101;" title="Pack Dynamics"
              body="In a group, if one rider rolls a stop, others face a split-second choice: follow or lose the group. Peer pressure in a peloton is powerful." />
          </div>

          <p className="text-gray-700 mt-8 leading-relaxed">
            We understand these pressures. StopCheck doesn't exist to punish riders for being competitive.
            It exists to level the playing field — to make sure that the rider who wins did so because they
            were faster AND followed the rules, not just faster.
          </p>
        </div>
      </section>

      {/* Section 3: The Roads Are Open */}
      <section className="py-14">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">This isn't a closed circuit. It's a public road.</h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            Gravel events operate on public roads with real traffic. Farmers driving tractors. Families in minivans.
            School buses. Emergency vehicles.
          </p>
          <p className="text-gray-700 leading-relaxed mb-6">
            A cyclist entering an intersection at 25 mph without stopping has no way to know what is approaching
            from a crossing road obscured by a field or a treeline. Rural Nebraska, Michigan, Kansas, and Colorado
            intersections are not designed for athletes in race mode.
          </p>

          <div className="grid md:grid-cols-2 gap-4 my-8">
            <StatBox value="1,166" label="cyclists killed on US roads in 2024 — an all-time record" source="NHTSA 2024" />
            <StatBox value="87%" label="increase in cyclist deaths since 2010" source="League of American Bicyclists, 2025" />
          </div>
        </div>
      </section>

      {/* Section 4: The Culture We're Building */}
      <section className="bg-gray-900 text-white py-14">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-4">Self-policing. Accountability. A safer sport.</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            Gravel cycling was built on a culture of mutual respect, self-sufficiency, and honoring the unwritten
            rules of the road. That culture is what makes the sport special.
          </p>
          <p className="text-gray-300 leading-relaxed mb-6">
            StopCheck is an extension of that culture — not a departure from it.
          </p>
          <p className="text-gray-300 leading-relaxed mb-6">
            When riders know their stop sign compliance is being recorded, the decision to stop becomes straightforward.
            Not because someone is watching from a truck. Because the data exists. Because other riders are stopping.
            Because the culture expects it.
          </p>
          <p className="text-gray-300 leading-relaxed mb-8">
            This is how culture changes — not through punishment, but through accountability and visibility.
            Our goal is simple: to make stopping at stop signs the normal, expected, universal behavior in gravel cycling.
          </p>
          <blockquote className="border-l-4 border-green-500 pl-5 py-2 text-xl font-semibold text-white italic">
            "The rules have always required it. Now there's a way to verify it."
          </blockquote>
        </div>
      </section>

      {/* Section 5: For Event Organizers */}
      <section className="py-14">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Protect your riders. Protect your event.</h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            As an event organizer, you face real liability exposure when thousands of riders use public roads.
            Stop sign compliance is a rule at every major event. But until now you had no way to enforce it,
            document it, or demonstrate due diligence.
          </p>
          <p className="text-gray-700 mb-4">StopCheck gives you:</p>
          <ul className="space-y-2 text-gray-700 mb-6">
            {[
              'Documented compliance for every rider',
              'Defensible data for any incident review',
              'A DQ process that requires human confirmation',
              'Evidence that your event takes safety seriously',
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">&#10003;</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-gray-600 text-sm italic">
            We are not a replacement for your safety planning. We are one more tool that says:
            this event takes the rules seriously.
          </p>
        </div>
      </section>

      {/* Section 6: Enforcement Philosophy */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Data, not punishment</h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            StopCheck does not make disqualification decisions. The platform surfaces data. Humans make decisions.
          </p>
          <p className="text-gray-700 leading-relaxed mb-6">
            Every DQ in StopCheck requires two deliberate clicks from an event organizer. There is no automated
            disqualification. There is no single-click path to removing a rider from results. The organizer reviews
            the data, considers the context, and decides.
          </p>
          <p className="text-gray-700 leading-relaxed mb-6">
            This is intentional. Road racing involves ambiguity. Sensor noise. GPS drift. Unusual intersections.
            Human judgment belongs in the loop — always.
          </p>
          <p className="text-gray-700 leading-relaxed">
            What StopCheck provides is the data that makes an informed decision possible.
            What happens with that data is always a human decision.
          </p>
        </div>
      </section>

      {/* Section 7: CTA */}
      <section className="bg-green-600 py-14">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Help us change the culture</h2>
          <p className="text-green-100 mb-6 max-w-xl mx-auto">
            If you organize gravel events, StopCheck gives you the tools to make stop sign compliance real —
            not just a line in the rulebook. If you ride gravel events, ask your organizer about StopCheck.
            The rider who wins fairly deserves to win.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/register"
              className="px-8 py-3 bg-white text-green-700 rounded-xl font-semibold text-lg no-underline hover:bg-green-50">
              Start Free Trial &rarr;
            </Link>
            <Link to="/how-it-works"
              className="px-8 py-3 bg-green-700 text-white rounded-xl font-semibold text-lg no-underline hover:bg-green-800 border border-green-500">
              Read How It Works &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Safety FAQ</h2>
          <div className="space-y-6">
            <FAQ
              q="Are gravel events required to enforce stop signs?"
              a="Most major gravel events require stop sign compliance in their official rules. Barry-Roubaix states explicitly: 'stop at all stop signs — violations could be penalized by disqualification.' The rule is nearly universal. The enforcement mechanism has not existed until now."
            />
            <FAQ
              q="What happens if a rider has a legitimate reason for not stopping — like a crossing guard directing them through?"
              a="StopCheck has a crossing guard waiver system. Race officials stationed at intersections can issue time-stamped waivers for riders who pass during their directed window. Those waivers appear on compliance reports and protect riders from false violations."
            />
            <FAQ
              q="Does StopCheck prevent accidents?"
              a="StopCheck does not physically prevent accidents. What it does is change the incentive structure around stop sign compliance. When riders know their compliance is being recorded, the decision to stop becomes the default behavior. Culture change at scale is how road safety improves."
            />
          </div>
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
          <Link to="/safety" className="text-sm text-green-700 font-medium no-underline">Safety</Link>
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
          <p>Stop sign compliance, automated.</p>
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

function PressureCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
    </div>
  )
}

function StatBox({ value, label, source }: { value: string; label: string; source: string }) {
  return (
    <div className="bg-gray-900 text-white rounded-xl p-5">
      <div className="text-3xl font-bold text-red-400 mb-1">{value}</div>
      <div className="text-sm text-gray-300">{label}</div>
      <div className="text-xs text-gray-500 mt-2">Source: {source}</div>
    </div>
  )
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <div className="border-b border-gray-100 pb-5">
      <h3 className="font-semibold text-gray-900 mb-2">{q}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{a}</p>
    </div>
  )
}
