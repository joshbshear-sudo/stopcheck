import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function EmailPreview() {
  const { id: eventId } = useParams<{ id: string }>()
  const { token } = useAuth()
  const [html, setHtml] = useState('')
  const [text, setText] = useState('')
  const [tab, setTab] = useState<'html' | 'text'>('html')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!token || !eventId) return
    const headers = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch(`/api/email/preview/route/${eventId}`, { headers }).then(r => r.text()),
      fetch(`/api/email/preview/route/${eventId}?format=text`, { headers }).then(r => r.text()),
    ]).then(([h, t]) => { setHtml(h); setText(t) })
  }, [token, eventId])

  useEffect(() => {
    if (iframeRef.current && html && tab === 'html') {
      const doc = iframeRef.current.contentDocument
      if (doc) { doc.open(); doc.write(html); doc.close() }
    }
  }, [html, tab])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(html)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSend = async () => {
    if (!token || !eventId) return
    setSending(true)
    setSendResult(null)
    try {
      const res = await fetch(`/api/email/send-route/${eventId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setSendResult(`Sent ${data.sent} of ${data.total} emails${data.failed ? ` (${data.failed} failed)` : ''}`)
    } catch {
      setSendResult('Failed to send emails')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link to={`/events/${eventId}`} className="text-sm text-gray-400 no-underline hover:text-gray-600">&larr; Event Dashboard</Link>
          <h1 className="text-xl font-bold text-gray-900 mt-1">Route Email Preview</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopy}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
            {copied ? 'Copied!' : 'Copy HTML'}
          </button>
          <button onClick={handleSend} disabled={sending}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            {sending ? 'Sending...' : 'Send to All Riders'}
          </button>
        </div>
      </div>

      {sendResult && (
        <div className="mb-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          {sendResult}
        </div>
      )}

      <div className="flex gap-1 mb-3">
        <button onClick={() => setTab('html')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium ${tab === 'html' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
          HTML Preview
        </button>
        <button onClick={() => setTab('text')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium ${tab === 'text' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
          Plain Text
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {tab === 'html' ? (
          <iframe ref={iframeRef} title="Email Preview"
            className="w-full border-0" style={{ height: '700px' }} />
        ) : (
          <pre className="p-4 text-sm text-gray-700 whitespace-pre-wrap font-mono">{text}</pre>
        )}
      </div>
    </div>
  )
}
