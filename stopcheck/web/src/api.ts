const BASE = '/api'

export interface RiderInfo {
  id: string
  event_id: string
  bib_number: string | null
  name: string
  connected_at: string | null
  platform: string | null
  event_name: string
  event_date: string
  course_file_url: string | null
}

export interface StopResult {
  id: string
  status: 'pass' | 'fail' | 'missed' | 'guard_waived' | 'not_applicable'
  min_speed_mph: number
  stop_duration_s: number | null
  speed_source: string
  sequence: number
  stop_location: string
  crossing_guard: boolean
  raw_records: { timestamp: string; speed: number; speed_mph: number; dist_from_stop: number }[]
}

export interface RiderSummary {
  compliance_pct: number
  stops_passed: number
  stops_failed: number
  stops_missed: number
  dq_recommended: boolean
  dq_confirmed: boolean
  processed_at: string
}

export interface RiderResultsData {
  summary: RiderSummary | null
  stops: StopResult[]
}

export async function fetchRider(authToken: string): Promise<RiderInfo> {
  const res = await fetch(`${BASE}/rider/by-token/${authToken}`)
  if (!res.ok) throw new Error('Rider not found')
  return res.json()
}

export async function fetchResults(authToken: string): Promise<RiderResultsData> {
  const res = await fetch(`${BASE}/rider/by-token/${authToken}/results`)
  if (!res.ok) throw new Error('Results not found')
  return res.json()
}

export async function uploadFit(authToken: string, file: File): Promise<{ message: string }> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/upload/fit/${authToken}`, { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }))
    throw new Error(err.error)
  }
  return res.json()
}

export function getOAuthUrl(platform: 'strava' | 'garmin' | 'wahoo', riderToken: string): string {
  return `${BASE}/oauth/${platform}/authorize?rider_token=${riderToken}`
}
