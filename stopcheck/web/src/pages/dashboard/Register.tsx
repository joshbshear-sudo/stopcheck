import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import PasswordInput from '../../components/PasswordInput'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await register(name, email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="text-sm text-gray-400 no-underline hover:text-gray-600 mb-4 inline-block">
            &larr; Back to Home
          </Link>
          <Link to="/" className="text-3xl font-bold text-green-700 flex items-center justify-center gap-2 no-underline">
            <span>&#128721;</span> StopCheck
          </Link>
          <p className="text-gray-500 mt-2">Create your organizer account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h1 className="text-xl font-bold text-gray-900">Register</h1>

          {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Gravel Worlds Racing"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <PasswordInput value={password} onChange={setPassword} placeholder="8+ characters" required />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="text-sm text-center text-gray-500">
            Already have an account? <Link to="/login" className="text-green-600 font-medium">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
