import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'

interface TutorialStep {
  target: string | null  // CSS selector to highlight, null = center modal
  title: string
  body: string
  subNote?: string
  button: string
}

const STEPS: TutorialStep[] = [
  {
    target: null,
    title: 'Welcome to StopCheck',
    body: 'You have 5 free trial events to explore the platform. This tutorial will walk you through creating your first compliant gravel event. It takes about 10 minutes.',
    button: "Let's go \u2192",
  },
  {
    target: '[data-tutorial="create-event"]',
    title: 'Create your first event',
    body: 'Every compliance check starts with an event. Click here to begin setting up your event with name, date, and location.',
    button: 'Next \u2192',
  },
  {
    target: '[data-tutorial="course-upload"]',
    title: 'Upload your course GPX',
    body: 'Export your route as a GPX file from Garmin Connect, Strava, or RideWithGPS and upload it here. StopCheck reads the coordinates to find stop signs along the route.',
    button: 'Next \u2192',
  },
  {
    target: '[data-tutorial="auto-detect"]',
    title: 'Auto-detect stop signs',
    body: 'Click this button to automatically find every stop sign on your route using OpenStreetMap data. This searches the entire route corridor \u2014 it takes 5 to 15 seconds.',
    subNote: 'Tip: You can also click the map to place stop signs manually for any that are missing from OpenStreetMap.',
    button: 'Next \u2192',
  },
  {
    target: '[data-tutorial="stop-signs-map"]',
    title: 'Review your stop signs',
    body: 'Each marker is a compliance checkpoint. Click any marker to remove it if it was incorrectly detected. Click the map to add missing stops manually. Every marker here will be checked for every rider.',
    button: 'Next \u2192',
  },
  {
    target: '[data-tutorial="rider-table"]',
    title: 'Add your riders',
    body: "Add each rider\u2019s name and email. StopCheck generates a unique link for each rider and sends them a route email with one-tap connect buttons for Strava, Garmin, and Wahoo. Riders never need to create an account.",
    button: 'Next \u2192',
  },
  {
    target: '[data-tutorial="send-email"]',
    title: 'Send route emails',
    body: 'When you\u2019re ready, click Send Route Email to send every rider their unique link. They tap one button to connect their fitness platform \u2014 it takes under 30 seconds.',
    button: 'Next \u2192',
  },
  {
    target: '[data-tutorial="podium"]',
    title: 'Race day: Podium Check',
    body: 'At the finish line, open Podium Check on your phone. Search any rider by name or bib number to instantly see their compliance status. Works offline \u2014 no signal required at remote finish lines.',
    button: 'Finish tutorial \u2713',
  },
]

export default function Tutorial() {
  const { org, token } = useAuth()
  const [step, setStep] = useState(org?.tutorial_step || 0)
  const [visible, setVisible] = useState(false)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (org && !org.tutorial_completed && org.tutorial_step < STEPS.length) {
      setVisible(true)
      setStep(org.tutorial_step)
    }
  }, [org])

  const updateServer = useCallback((newStep: number, completed: boolean) => {
    if (!token) return
    fetch('/api/organizations/tutorial', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: newStep, completed }),
    }).catch(() => {})
  }, [token])

  useEffect(() => {
    if (!visible) return
    const s = STEPS[step]
    if (!s?.target) { setTargetRect(null); return }
    const el = document.querySelector(s.target)
    if (el) {
      const rect = el.getBoundingClientRect()
      setTargetRect(rect)
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      setTargetRect(null)
    }
  }, [step, visible])

  const handleNext = () => {
    if (step >= STEPS.length - 1) {
      // Finish
      updateServer(STEPS.length, true)
      setVisible(false)
      return
    }
    const next = step + 1
    setStep(next)
    updateServer(next, false)
  }

  const handleSkip = () => {
    updateServer(step, true)
    setVisible(false)
  }

  if (!visible || step >= STEPS.length) return null

  const s = STEPS[step]
  const isCenter = !s.target || !targetRect

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" onClick={handleSkip} />

      {/* Spotlight cutout */}
      {targetRect && (
        <div className="absolute pointer-events-none" style={{
          top: targetRect.top - 8, left: targetRect.left - 8,
          width: targetRect.width + 16, height: targetRect.height + 16,
          borderRadius: 12, boxShadow: '0 0 0 9999px rgba(0,0,0,0.6), 0 0 20px 4px rgba(22,163,74,0.5)',
          zIndex: 101,
        }} />
      )}

      {/* Tooltip card */}
      <div className={`absolute z-[102] ${isCenter
        ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
        : ''
      }`} style={!isCenter && targetRect ? {
        top: targetRect.bottom + 16,
        left: Math.max(16, Math.min(targetRect.left, window.innerWidth - 360)),
      } : undefined}>
        <div className="bg-white rounded-2xl shadow-2xl p-5 w-[340px] max-w-[calc(100vw-32px)]">
          {/* Progress */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400 font-medium">Step {step + 1} of {STEPS.length}</span>
            <button onClick={handleSkip} className="text-xs text-gray-400 hover:text-gray-600">Skip tutorial</button>
          </div>

          {/* Progress dots */}
          <div className="flex gap-1 mb-4">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-green-500' : 'bg-gray-200'}`} />
            ))}
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
          {s.subNote && (
            <p className="text-xs text-gray-400 mt-2 italic">{s.subNote}</p>
          )}

          <button onClick={handleNext}
            className="mt-4 w-full py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700">
            {s.button}
          </button>
        </div>
      </div>
    </div>
  )
}

// Export for replay
export function TutorialReplayButton() {
  const { token } = useAuth()

  const handleReplay = () => {
    if (!token) return
    fetch('/api/organizations/tutorial', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: 0, completed: false }),
    }).then(() => window.location.reload())
  }

  return (
    <button onClick={handleReplay}
      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
      Replay tutorial from the beginning
    </button>
  )
}
