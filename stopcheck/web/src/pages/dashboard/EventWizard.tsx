import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { createEvent, createStopSigns, updateEvent } from '../../dashboardApi'
import StopSignEditor from '../../components/dashboard/StopSignEditor'

interface WizardData {
  name: string; event_date: string; location: string
  stop_duration_sec: number; geofence_radius_m: number
  event_window_start: string; event_window_end: string
  courseCoords: { lat: number; lon: number }[]
  stopSigns: { lat: number; lon: number; location: string; sequence: number; crossing_guard: boolean }[]
}

const STEPS = ['Basic Info', 'Course Upload', 'Stop Signs', 'Rules', 'Review']

export default function EventWizard() {
  const { token, org } = useAuth()
  const navigate = useNavigate()

  // Check if OSM is disabled for this trial event
  const trialBypass = org?.sponsored || (org?.plan && org.plan !== 'free')
  const nextEventNum = (org?.trial_events_used || 0) + 1
  const osmDisabled = !trialBypass && org?.trial_active && ![1, 2, 5].includes(nextEventNum)
  const [step, setStep] = useState(() => {
    const saved = localStorage.getItem('sc_wizard_step')
    return saved ? parseInt(saved) : 0
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<WizardData>(() => {
    const saved = localStorage.getItem('sc_wizard_data')
    if (saved) {
      try { return JSON.parse(saved) } catch {}
    }
    return {
      name: '', event_date: '', location: '',
      // Spec v2.0 §1.3/§1.4/§1.5 internal-threshold defaults
      stop_duration_sec: 0.75, geofence_radius_m: 25.0,
      event_window_start: '', event_window_end: '',
      courseCoords: [], stopSigns: [],
    }
  })

  const update = (partial: Partial<WizardData>) => setData(d => {
    const next = { ...d, ...partial }
    localStorage.setItem('sc_wizard_data', JSON.stringify(next))
    return next
  })

  // Persist step changes
  useEffect(() => {
    localStorage.setItem('sc_wizard_step', String(step))
  }, [step])
  const canNext = () => {
    if (step === 0) return data.name && data.event_date
    return true
  }

  const handleFinish = async () => {
    if (!token) return
    setSaving(true)
    setError('')
    try {
      const event = await createEvent(token, {
        name: data.name, event_date: data.event_date, location: data.location,
        stop_duration_sec: data.stop_duration_sec, geofence_radius_m: data.geofence_radius_m,
        event_window_start: data.event_window_start || null,
        event_window_end: data.event_window_end || null,
      } as any)

      if (data.stopSigns.length > 0) {
        await createStopSigns(token, event.id, data.stopSigns.map((s, i) => ({
          sequence: i + 1, lat: s.lat, lon: s.lon,
          location: s.location, crossing_guard: s.crossing_guard, source: 'manual',
        })))
      }

      if (data.event_window_start) {
        await updateEvent(token, event.id, { status: 'active' } as any)
      }

      localStorage.removeItem('sc_wizard_data')
      localStorage.removeItem('sc_wizard_step')
      navigate(`/events/${event.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div className={`h-1 rounded-full ${i <= step ? 'bg-green-500' : 'bg-gray-200'}`} />
            <div className={`text-xs mt-1 ${i === step ? 'text-green-700 font-medium' : 'text-gray-400'}`}>{label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</div>}

        {step === 0 && <StepBasicInfo data={data} update={update} />}
        {step === 1 && <StepCourseUpload data={data} update={update} />}
        {step === 2 && <StepStopSigns data={data} update={update} token={token} osmDisabled={osmDisabled} />}
        {step === 3 && <StepRules data={data} update={update} />}
        {step === 4 && <StepReview data={data} />}

        <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800">Back</button>
          ) : <div />}
          {step < 4 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
              {step === 2 && data.stopSigns.length === 0 ? 'Skip — Add Stops Later' : 'Next'}
            </button>
          ) : (
            <button onClick={handleFinish} disabled={saving}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Event'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function StepBasicInfo({ data, update }: { data: WizardData; update: (p: Partial<WizardData>) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Event Details</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
        <input type="text" value={data.name} onChange={e => update({ name: e.target.value })}
          placeholder="e.g. Gravel Worlds 2026 - 150 Mile"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
          <input type="date" value={data.event_date} onChange={e => update({ event_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input type="text" value={data.location} onChange={e => update({ location: e.target.value })}
            placeholder="City, State"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
        </div>
      </div>
    </div>
  )
}

function StepCourseUpload({ data, update }: { data: WizardData; update: (p: Partial<WizardData>) => void }) {
  const [fileName, setFileName] = useState('')

  const handleFile = async (file: File) => {
    setFileName(file.name)
    const ext = file.name.toLowerCase().split('.').pop()
    if (ext === 'gpx') {
      let text = await file.text()
      // Strip XML namespace to make querySelectorAll work with plain tag names
      // Garmin Connect GPX files use xmlns="http://www.topografix.com/GPX/1/1"
      text = text.replace(/\sxmlns="[^"]*"/g, '')
      const parser = new DOMParser()
      const xml = parser.parseFromString(text, 'text/xml')
      const trkpts = xml.querySelectorAll('trkpt')
      const rtepts = xml.querySelectorAll('rtept')
      const wpts = xml.querySelectorAll('wpt')
      const points = trkpts.length > 0 ? trkpts : rtepts.length > 0 ? rtepts : wpts
      const coords = Array.from(points).map(pt => ({
        lat: parseFloat(pt.getAttribute('lat') || '0'),
        lon: parseFloat(pt.getAttribute('lon') || '0'),
      }))
      console.log(`[GPX] Parsed ${coords.length} points from ${file.name}`)
      update({ courseCoords: coords })
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Upload Course File</h2>
      <p className="text-sm text-gray-500">Upload a GPX or FIT file of your event course.</p>
      <div
        onClick={() => document.getElementById('course-input')?.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors"
      >
        <input id="course-input" type="file" accept=".gpx,.fit" className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        {fileName ? (
          <div>
            <div className="text-green-600 text-2xl mb-1">&#10003;</div>
            <div className="font-medium text-gray-800">{fileName}</div>
            <div className="text-sm text-green-600">{data.courseCoords.length} track points loaded</div>
          </div>
        ) : (
          <div>
            <div className="text-gray-400 text-3xl mb-2">&#128506;</div>
            <div className="font-medium text-gray-600">Click to select GPX or FIT file</div>
          </div>
        )}
      </div>
      {!fileName && (
        <p className="text-xs text-gray-400 text-center">You can skip this and add stop signs manually in the next step.</p>
      )}
    </div>
  )
}

function StepStopSigns({ data, update, token, osmDisabled }: { data: WizardData; update: (p: Partial<WizardData>) => void; token: string | null; osmDisabled?: boolean }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Stop Sign Locations</h2>
      <p className="text-sm text-gray-500">
        Click on the map to add stop signs, or use auto-detect from OpenStreetMap.
        Drag markers to reposition. Click a marker to edit or delete.
      </p>
      <StopSignEditor
        courseCoords={data.courseCoords}
        stopSigns={data.stopSigns}
        onChange={stops => update({ stopSigns: stops })}
        authToken={token}
        osmDisabled={osmDisabled}
      />
    </div>
  )
}

function StepRules({ data, update }: { data: WizardData; update: (p: Partial<WizardData>) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Compliance Rules</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stop Duration (seconds)</label>
          <input type="number" step="0.5" min="1" value={data.stop_duration_sec}
            onChange={e => update({ stop_duration_sec: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Geofence Radius (meters)</label>
          <input type="number" step="5" min="10" value={data.geofence_radius_m}
            onChange={e => update({ geofence_radius_m: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Event Window Start</label>
        <input type="datetime-local" value={data.event_window_start}
          onChange={e => update({ event_window_start: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Event Window End</label>
        <input type="datetime-local" value={data.event_window_end}
          onChange={e => update({ event_window_end: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
      </div>
      <p className="text-xs text-gray-400">
        Crossing guard waivers only apply within the event window. Leave empty if no guards are posted.
      </p>
    </div>
  )
}

function StepReview({ data }: { data: WizardData }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Review & Create</h2>
      <dl className="space-y-2 text-sm">
        <Row label="Event" value={data.name} />
        <Row label="Date" value={data.event_date} />
        <Row label="Location" value={data.location || '—'} />
        <Row label="Stop Signs" value={`${data.stopSigns.length} stops`} />
        <Row label="Stop Duration" value={`${data.stop_duration_sec}s`} />
        <Row label="Geofence Radius" value={`${data.geofence_radius_m}m`} />
        {data.event_window_start && <Row label="Event Window" value={`${data.event_window_start} to ${data.event_window_end}`} />}
      </dl>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 border-b border-gray-50">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-800">{value}</dd>
    </div>
  )
}
