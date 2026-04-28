import { useState } from 'react'
import PublicNav from '../components/public/PublicNav'
import PublicFooter from '../components/public/PublicFooter'

export default function CommunityApply() {
  const [form, setForm] = useState({
    org_name: '', contact_email: '', event_name: '',
    charity_name: '', ein: '', website: '', expected_riders: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/sponsorships/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          expected_riders: form.expected_riders ? parseInt(form.expected_riders) : null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Submission failed')
      }
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4">&#127881;</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
          <p className="text-gray-600">
            Thank you for applying for the StopCheck Community Sponsorship program.
            We'll review your application and respond within 5 business days.
          </p>
          <p className="text-sm text-gray-400 mt-4">
            Check your email at <strong>{form.contact_email}</strong> for updates.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6">
          <h1 className="text-xl font-bold text-green-900 mb-2">Community Sponsorship Program</h1>
          <p className="text-green-700 text-sm">
            StopCheck sponsors up to 50 charity-affiliated gravel events per year.
            Approved events receive full platform access at no cost, including
            unlimited riders, PDF exports, and all premium features.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-900">Apply for Sponsorship</h2>

          {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Organization Name" required value={form.org_name}
              onChange={v => update('org_name', v)} placeholder="e.g. Lincoln Cycling Club" />
            <Field label="Contact Email" required type="email" value={form.contact_email}
              onChange={v => update('contact_email', v)} placeholder="you@org.com" />
          </div>

          <Field label="Event Name" required value={form.event_name}
            onChange={v => update('event_name', v)} placeholder="e.g. Gravel Worlds 2026 Charity Ride" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Charity / Nonprofit Name" required value={form.charity_name}
              onChange={v => update('charity_name', v)} placeholder="e.g. Bikes for Kids Foundation" />
            <Field label="EIN (501(c)(3) Number)" value={form.ein}
              onChange={v => update('ein', v)} placeholder="XX-XXXXXXX" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Website" value={form.website}
              onChange={v => update('website', v)} placeholder="https://..." />
            <Field label="Expected Riders" type="number" value={form.expected_riders}
              onChange={v => update('expected_riders', v)} placeholder="e.g. 200" />
          </div>

          <p className="text-xs text-gray-400">
            We verify all applications. Events must be affiliated with a registered
            501(c)(3) nonprofit or equivalent charity. If you don't have an EIN,
            attach documentation of your charity affiliation.
          </p>

          <button type="submit" disabled={submitting}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-medium text-lg hover:bg-green-700 disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </main>

      <PublicFooter />
    </div>
  )
}

function Field({ label, required, type, value, onChange, placeholder }: {
  label: string; required?: boolean; type?: string; value: string
  onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input type={type || 'text'} required={required} value={value}
        onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" />
    </div>
  )
}
