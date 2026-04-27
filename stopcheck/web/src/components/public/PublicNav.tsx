import { Link, NavLink } from 'react-router-dom'

const navLinks = [
  { to: '/safety', label: 'Safety' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/community', label: 'Community' },
]

export default function PublicNav() {
  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-green-700 font-bold text-lg no-underline">
          <span className="text-xl">&#128721;</span> StopCheck
        </Link>
        <div className="flex items-center gap-4">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `text-sm no-underline ${
                  isActive
                    ? 'text-green-700 font-medium'
                    : 'text-gray-600 hover:text-gray-800'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <Link
            to="/login"
            className="text-sm text-gray-600 no-underline hover:text-gray-800"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium no-underline hover:bg-green-700"
          >
            Start Free Trial
          </Link>
        </div>
      </div>
    </nav>
  )
}
