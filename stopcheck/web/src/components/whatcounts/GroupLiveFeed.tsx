import './GroupLiveFeed.css'

type Verdict = 'compliant' | 'close-call' | 'risky' | 'not-compliant'
type Lane = 1 | 2 | 3

type Rider = {
  verdict: Verdict
  lane: Lane
  delay: number
  overtaking?: boolean
}

function lane(n: Lane) {
  return n === 1 ? 'wc-glf-rider--lane-1' : n === 2 ? 'wc-glf-rider--lane-2' : 'wc-glf-rider--lane-3'
}

function verdictClass(v: Verdict) {
  return `wc-glf-rider--${v}`
}

function Scene({
  label,
  title,
  caption,
  riders,
  hasCar,
}: {
  label: string
  title: string
  caption: React.ReactNode
  riders: Rider[]
  hasCar?: boolean
}) {
  return (
    <section className="wc-glf-scene">
      <div className="wc-glf-scene-label-row">
        <span className="wc-glf-scene-label">{label}</span>
        <h3 className="wc-glf-scene-title">{title}</h3>
      </div>
      <p className="wc-glf-scene-caption">{caption}</p>
      <div className="wc-glf-frame">
        <div className="wc-glf-road"></div>
        <div className="wc-glf-cross-street"></div>
        <div className="wc-glf-center-line"></div>
        <div className="wc-glf-path wc-glf-path--lane-1"></div>
        <div className="wc-glf-path wc-glf-path--lane-2"></div>
        <div className="wc-glf-path wc-glf-path--lane-3"></div>
        <svg className="wc-glf-sign" viewBox="0 0 100 100"><use href="#wc-stop-sign"/></svg>
        {hasCar && <div className="wc-glf-car"></div>}
        {riders.map((r, i) => (
          <div
            key={i}
            className={[
              'wc-glf-rider',
              verdictClass(r.verdict),
              lane(r.lane),
              r.overtaking ? 'wc-glf-rider--overtaking' : '',
            ].filter(Boolean).join(' ')}
            style={{ animationDelay: `${r.delay}s` }}
          />
        ))}
      </div>
    </section>
  )
}

export default function GroupLiveFeed() {
  // Scene 1 — small paceline of 5 · tight 0.3s stagger · shared 1.5s approach
  const scene1: Rider[] = [
    { verdict: 'compliant',  lane: 2, delay: 0 },
    { verdict: 'compliant',  lane: 1, delay: 0.3 },
    { verdict: 'close-call', lane: 3, delay: 0.6 },
    { verdict: 'compliant',  lane: 2, delay: 0.9 },
    { verdict: 'risky',      lane: 1, delay: 1.2 },
  ]

  // Scene 2 — solo · pair · paceline-of-3 · solo with overtake
  const scene2: Rider[] = [
    { verdict: 'compliant',  lane: 2, delay: 0 },
    { verdict: 'compliant',  lane: 2, delay: 4.5 },
    { verdict: 'compliant',  lane: 3, delay: 4.5 },
    { verdict: 'compliant',  lane: 2, delay: 10 },
    { verdict: 'close-call', lane: 1, delay: 10.3 },
    { verdict: 'compliant',  lane: 3, delay: 10.6 },
    { verdict: 'risky',      lane: 1, delay: 16, overtaking: true },
  ]

  // Scene 3 — peloton of 10 entering t=0–1.8s in 3-wide formation + trailing pair at t=8s
  const scene3: Rider[] = [
    { verdict: 'compliant',     lane: 2, delay: 0 },
    { verdict: 'compliant',     lane: 1, delay: 0.3 },
    { verdict: 'compliant',     lane: 3, delay: 0.3 },
    { verdict: 'compliant',     lane: 2, delay: 0.6 },
    { verdict: 'not-compliant', lane: 1, delay: 0.9 },
    { verdict: 'compliant',     lane: 3, delay: 0.9 },
    { verdict: 'compliant',     lane: 2, delay: 1.2 },
    { verdict: 'close-call',    lane: 1, delay: 1.5 },
    { verdict: 'compliant',     lane: 3, delay: 1.5 },
    { verdict: 'compliant',     lane: 2, delay: 1.8 },
    { verdict: 'risky',         lane: 1, delay: 8 },
    { verdict: 'compliant',     lane: 3, delay: 8.3 },
  ]

  return (
    <div className="wc-glf">
      <Scene
        label="Scene 01 · explanatory"
        title="Each rider gets their own verdict."
        caption={
          <>
            <b>Your stop is yours alone.</b> The system reads each rider's
            individual data. Most riders hold the standard; one or two don't
            quite get there.
          </>
        }
        riders={scene1}
      />
      <Scene
        label="Scene 02 · light traffic"
        title="Real conditions, real behaviour."
        caption={
          <>
            An oncoming car comes down the left lane; the riders in the right
            lane stop because <b>the check found something</b>. The system
            reads riders, not cars — the car stops at the sign too, but no
            verdict applies to it.
          </>
        }
        riders={scene2}
        hasCar
      />
      <Scene
        label="Scene 03 · peak traffic"
        title="Peloton bunching and spreading."
        caption={
          <>
            <b>Group dynamics do not override the individual verdict.</b> Most
            riders hold the standard even under pack pressure; a small
            minority do not.
          </>
        }
        riders={scene3}
      />
    </div>
  )
}
