const BASE = '/api'

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

// Events
export interface EventData {
  id: string; org_id: string; name: string; event_date: string; location: string
  course_file_url: string | null; stop_duration_sec: number; geofence_radius_m: number
  status: string; event_window_start: string | null; event_window_end: string | null
  created_at: string
}

export async function fetchEvents(token: string): Promise<EventData[]> {
  const r = await fetch(`${BASE}/events`, { headers: authHeaders(token) })
  if (!r.ok) throw new Error('Failed to fetch events')
  return r.json()
}

export async function fetchEvent(token: string, id: string): Promise<EventData> {
  const r = await fetch(`${BASE}/events/${id}`, { headers: authHeaders(token) })
  if (!r.ok) throw new Error('Event not found')
  return r.json()
}

export async function createEvent(token: string, data: Partial<EventData>): Promise<EventData> {
  const r = await fetch(`${BASE}/events`, {
    method: 'POST', headers: authHeaders(token), body: JSON.stringify(data),
  })
  if (!r.ok) throw new Error('Failed to create event')
  return r.json()
}

export async function updateEvent(token: string, id: string, data: Partial<EventData>): Promise<EventData> {
  const r = await fetch(`${BASE}/events/${id}`, {
    method: 'PUT', headers: authHeaders(token), body: JSON.stringify(data),
  })
  if (!r.ok) throw new Error('Failed to update event')
  return r.json()
}

// Stop Signs
export interface StopSignData {
  id: string; event_id: string; sequence: number; lat: number; lon: number
  location: string | null; mile_marker: number | null; source: string
  crossing_guard: boolean; guard_confirmed_by: string | null
}

export async function fetchStopSigns(token: string, eventId: string): Promise<StopSignData[]> {
  const r = await fetch(`${BASE}/events/${eventId}/stop-signs`, { headers: authHeaders(token) })
  if (!r.ok) throw new Error('Failed to fetch stop signs')
  return r.json()
}

export async function createStopSigns(token: string, eventId: string, stops: Partial<StopSignData>[]): Promise<StopSignData[]> {
  const r = await fetch(`${BASE}/events/${eventId}/stop-signs`, {
    method: 'POST', headers: authHeaders(token), body: JSON.stringify({ stop_signs: stops }),
  })
  if (!r.ok) throw new Error('Failed to create stop signs')
  return r.json()
}

export async function updateStopSign(token: string, eventId: string, id: string, data: Partial<StopSignData>): Promise<StopSignData> {
  const r = await fetch(`${BASE}/events/${eventId}/stop-signs/${id}`, {
    method: 'PUT', headers: authHeaders(token), body: JSON.stringify(data),
  })
  if (!r.ok) throw new Error('Failed to update stop sign')
  return r.json()
}

export async function deleteStopSign(token: string, eventId: string, id: string): Promise<void> {
  const r = await fetch(`${BASE}/events/${eventId}/stop-signs/${id}`, {
    method: 'DELETE', headers: authHeaders(token),
  })
  if (!r.ok) throw new Error('Failed to delete stop sign')
}

// Riders
export interface RiderData {
  id: string; event_id: string; bib_number: string | null; name: string; email: string
  auth_token: string; connected_at: string | null; platform: string | null
  compliance_pct: number | null; dq_recommended: boolean | null; dq_confirmed: boolean | null
}

export interface RiderDetailData extends RiderData {
  stops_passed: number | null; stops_failed: number | null; stops_missed: number | null
  processed_at: string | null
}

export interface ComplianceResult {
  id: string; status: string; min_speed_mph: number; stop_duration_s: number | null
  speed_source: string; raw_records: any[]; sequence: number; stop_location: string
  crossing_guard: boolean
}

export interface RiderWithStops extends RiderData {
  stop_statuses: { sequence: number; status: string }[]
}

export interface PodiumRider {
  id: string; bib_number: string | null; name: string
  compliance_pct: number | null; stops_passed: number | null
  stops_failed: number | null; stops_missed: number | null
  dq_recommended: boolean | null; dq_confirmed: boolean | null
  stops: { status: string; min_speed_mph: number; stop_duration_s: number | null; sequence: number; stop_location: string; crossing_guard: boolean }[]
}

export async function fetchRiders(token: string, eventId: string): Promise<RiderData[]> {
  const r = await fetch(`${BASE}/events/${eventId}/riders`, { headers: authHeaders(token) })
  if (!r.ok) throw new Error('Failed to fetch riders')
  return r.json()
}

export async function fetchRidersWithStops(token: string, eventId: string): Promise<RiderWithStops[]> {
  const r = await fetch(`${BASE}/events/${eventId}/riders/with-stops`, { headers: authHeaders(token) })
  if (!r.ok) throw new Error('Failed to fetch riders')
  return r.json()
}

export async function searchPodium(eventId: string, query: string): Promise<PodiumRider[]> {
  const r = await fetch(`${BASE}/podium/${eventId}?q=${encodeURIComponent(query)}`)
  if (!r.ok) throw new Error('Search failed')
  return r.json()
}

export async function fetchRiderDetail(token: string, eventId: string, riderId: string): Promise<RiderDetailData> {
  const r = await fetch(`${BASE}/events/${eventId}/riders/${riderId}`, { headers: authHeaders(token) })
  if (!r.ok) throw new Error('Rider not found')
  return r.json()
}

export async function fetchRiderCompliance(token: string, eventId: string, riderId: string): Promise<ComplianceResult[]> {
  const r = await fetch(`${BASE}/events/${eventId}/riders/${riderId}/compliance`, { headers: authHeaders(token) })
  if (!r.ok) throw new Error('Failed to fetch compliance')
  return r.json()
}

export async function confirmDQ(token: string, eventId: string, riderId: string, action: 'confirm' | 'waive'): Promise<void> {
  const r = await fetch(`${BASE}/events/${eventId}/riders/${riderId}/dq`, {
    method: 'POST', headers: authHeaders(token), body: JSON.stringify({ action }),
  })
  if (!r.ok) throw new Error('DQ action failed')
}

export async function createRiders(token: string, eventId: string, riders: { name: string; email: string; bib_number?: string }[]): Promise<RiderData[]> {
  const r = await fetch(`${BASE}/events/${eventId}/riders`, {
    method: 'POST', headers: authHeaders(token), body: JSON.stringify({ riders }),
  })
  if (!r.ok) throw new Error('Failed to create riders')
  return r.json()
}

// OSM Stop Detection
export async function detectStops(token: string, coordinates: { lat: number; lon: number }[]): Promise<{ stop_signs: any[]; count: number }> {
  const r = await fetch(`${BASE}/overpass/detect-stops`, {
    method: 'POST', headers: authHeaders(token), body: JSON.stringify({ coordinates }),
  })
  if (!r.ok) throw new Error('Failed to detect stops')
  return r.json()
}
