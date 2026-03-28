import { useRef, useEffect, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// Mapbox token — loaded from env or fallback to empty (map won't render without it)
const MAPBOX_TOKEN = (import.meta as any).env?.VITE_MAPBOX_TOKEN || ''

interface StopSign {
  lat: number; lon: number; location: string; sequence: number; crossing_guard: boolean
}

interface Props {
  courseCoords: { lat: number; lon: number }[]
  stopSigns: StopSign[]
  onChange: (stops: StopSign[]) => void
  authToken?: string | null
}

export default function StopSignEditor({ courseCoords, stopSigns, onChange, authToken }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [editLocation, setEditLocation] = useState('')
  const [editGuard, setEditGuard] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [detectError, setDetectError] = useState('')

  const handleAutoDetect = useCallback(async () => {
    if (!authToken || courseCoords.length === 0) return
    setDetecting(true)
    setDetectError('')
    try {
      // Sample coordinates — send ~500 points max to avoid payload limits
      // The backend also samples, but we reduce upfront to keep the request small
      const step = Math.max(1, Math.floor(courseCoords.length / 500))
      const sampled = courseCoords.filter((_, i) => i % step === 0)
      console.log(`[OSM] Sending ${sampled.length} of ${courseCoords.length} points`)

      const res = await fetch('/api/overpass/detect-stops', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinates: sampled }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Detection failed')
      }
      const data = await res.json()
      if (data.stop_signs && data.stop_signs.length > 0) {
        const newStops: StopSign[] = data.stop_signs.map((s: any, i: number) => ({
          lat: s.lat, lon: s.lon,
          location: `OSM Stop ${i + 1}`,
          sequence: stopSigns.length + i + 1,
          crossing_guard: false,
        }))
        onChange([...stopSigns, ...newStops])
      } else {
        setDetectError('No stop signs found along this route')
      }
    } catch (err: any) {
      setDetectError(err.message)
    } finally {
      setDetecting(false)
    }
  }, [authToken, courseCoords, stopSigns, onChange])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return
    mapboxgl.accessToken = MAPBOX_TOKEN

    const center = courseCoords.length > 0
      ? [courseCoords[Math.floor(courseCoords.length / 2)].lon, courseCoords[Math.floor(courseCoords.length / 2)].lat] as [number, number]
      : [-96.7, 40.82] as [number, number]

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center,
      zoom: courseCoords.length > 0 ? 12 : 10,
    })

    map.on('load', () => {
      // Draw course polyline
      if (courseCoords.length > 1) {
        map.addSource('course', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: courseCoords.map(c => [c.lon, c.lat]),
            },
          },
        })
        map.addLayer({
          id: 'course-line',
          type: 'line',
          source: 'course',
          paint: { 'line-color': '#2563eb', 'line-width': 3, 'line-opacity': 0.7 },
        })

        // Fit to course bounds
        const bounds = new mapboxgl.LngLatBounds()
        courseCoords.forEach(c => bounds.extend([c.lon, c.lat]))
        map.fitBounds(bounds, { padding: 60 })
      }
    })

    // Click to add stop sign
    map.on('click', (e) => {
      const newStop: StopSign = {
        lat: e.lngLat.lat, lon: e.lngLat.lng,
        location: `Stop ${stopSigns.length + 1}`,
        sequence: stopSigns.length + 1,
        crossing_guard: false,
      }
      onChange([...stopSigns, newStop])
    })

    mapRef.current = map
    return () => map.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [MAPBOX_TOKEN])

  // Sync markers with stopSigns
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Remove old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    // Add new markers
    stopSigns.forEach((stop, i) => {
      const el = document.createElement('div')
      el.className = 'stop-marker'
      el.style.cssText = `
        width: 28px; height: 28px; border-radius: 4px; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        font-size: 11px; font-weight: bold; color: white;
        background: ${stop.crossing_guard ? '#ea580c' : '#dc2626'};
        border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      `
      el.textContent = String(i + 1)
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        setSelected(i)
        setEditLocation(stop.location)
        setEditGuard(stop.crossing_guard)
      })

      const marker = new mapboxgl.Marker({ element: el, draggable: true })
        .setLngLat([stop.lon, stop.lat])
        .addTo(map)

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat()
        const updated = [...stopSigns]
        updated[i] = { ...updated[i], lat: lngLat.lat, lon: lngLat.lng }
        onChange(updated)
      })

      markersRef.current.push(marker)
    })
  }, [stopSigns, onChange])

  const handleSaveEdit = useCallback(() => {
    if (selected === null) return
    const updated = [...stopSigns]
    updated[selected] = { ...updated[selected], location: editLocation, crossing_guard: editGuard }
    onChange(updated)
    setSelected(null)
  }, [selected, stopSigns, editLocation, editGuard, onChange])

  const handleDelete = useCallback(() => {
    if (selected === null) return
    const updated = stopSigns.filter((_, i) => i !== selected).map((s, i) => ({ ...s, sequence: i + 1 }))
    onChange(updated)
    setSelected(null)
  }, [selected, stopSigns, onChange])

  if (!MAPBOX_TOKEN) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
        <p className="text-amber-700 font-medium mb-2">Mapbox token not configured</p>
        <p className="text-sm text-amber-600">
          Add VITE_MAPBOX_TOKEN to your .env file to enable the map editor.
          You can still add stop signs manually below.
        </p>
        {courseCoords.length > 0 && (
          <div className="mt-4">
            <button onClick={handleAutoDetect} disabled={detecting}
              className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50">
              {detecting ? 'Scanning OpenStreetMap...' : 'Auto-Detect Stop Signs from OpenStreetMap'}
            </button>
            {detectError && <div className="mt-2 text-sm text-red-600">{detectError}</div>}
          </div>
        )}
        <ManualStopList stopSigns={stopSigns} onChange={onChange} />
      </div>
    )
  }

  return (
    <div>
      <div ref={mapContainer} className="w-full h-80 rounded-xl overflow-hidden border border-gray-200" />

      {/* Auto-detect button */}
      {courseCoords.length > 0 && (
        <div className="mt-3">
          <button onClick={handleAutoDetect} disabled={detecting}
            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {detecting ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Scanning OpenStreetMap...</>
            ) : (
              <><span>&#128270;</span> Auto-Detect Stop Signs from OpenStreetMap</>
            )}
          </button>
          {detectError && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{detectError}</div>
          )}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
        <span>Click map to add stop signs. Drag to reposition.</span>
        <span>{stopSigns.length} stop{stopSigns.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Edit popover */}
      {selected !== null && (
        <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-800">Stop #{selected + 1}</h3>
            <button onClick={handleDelete} className="text-xs text-red-500 hover:text-red-700">Delete</button>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Location Name</label>
            <input type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg outline-none" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={editGuard} onChange={e => setEditGuard(e.target.checked)}
              className="rounded" />
            <span className="text-gray-700">Crossing guard posted on event day</span>
          </label>
          <div className="flex gap-2">
            <button onClick={handleSaveEdit}
              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">Save</button>
            <button onClick={() => setSelected(null)}
              className="px-3 py-1.5 text-gray-500 text-sm hover:text-gray-700">Cancel</button>
          </div>
        </div>
      )}

      {/* Stop list below map */}
      {stopSigns.length > 0 && (
        <div className="mt-3 space-y-1">
          {stopSigns.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-gray-50 cursor-pointer"
              onClick={() => { setSelected(i); setEditLocation(s.location); setEditGuard(s.crossing_guard) }}>
              <span className={`w-5 h-5 rounded text-xs font-bold text-white flex items-center justify-center ${s.crossing_guard ? 'bg-orange-500' : 'bg-red-500'}`}>
                {i + 1}
              </span>
              <span className="text-gray-700 flex-1">{s.location}</span>
              {s.crossing_guard && <span className="text-xs text-orange-600 font-medium">Guard</span>}
              <span className="text-xs text-gray-400">{s.lat.toFixed(4)}, {s.lon.toFixed(4)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ManualStopList({ stopSigns, onChange }: { stopSigns: StopSign[]; onChange: (s: StopSign[]) => void }) {
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [loc, setLoc] = useState('')

  const add = () => {
    if (!lat || !lon) return
    onChange([...stopSigns, {
      lat: parseFloat(lat), lon: parseFloat(lon),
      location: loc || `Stop ${stopSigns.length + 1}`,
      sequence: stopSigns.length + 1, crossing_guard: false,
    }])
    setLat(''); setLon(''); setLoc('')
  }

  return (
    <div className="mt-4 text-left">
      <div className="grid grid-cols-3 gap-2 mb-2">
        <input placeholder="Latitude" value={lat} onChange={e => setLat(e.target.value)}
          className="px-2 py-1 text-sm border rounded" />
        <input placeholder="Longitude" value={lon} onChange={e => setLon(e.target.value)}
          className="px-2 py-1 text-sm border rounded" />
        <input placeholder="Location name" value={loc} onChange={e => setLoc(e.target.value)}
          className="px-2 py-1 text-sm border rounded" />
      </div>
      <button onClick={add} className="text-sm text-green-600 font-medium">+ Add Stop Sign</button>
      {stopSigns.map((s, i) => (
        <div key={i} className="text-sm text-gray-600 mt-1">#{i + 1} {s.location} ({s.lat.toFixed(4)}, {s.lon.toFixed(4)})</div>
      ))}
    </div>
  )
}
