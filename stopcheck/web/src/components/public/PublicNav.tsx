import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import './chrome.css'

const navLinks = [
  { to: '/how-it-works', label: 'How it works' },
  { to: '/safety', label: 'Safety' },
  { to: '/trust', label: 'Trust' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/community', label: 'Community' },
  { to: '/about', label: 'About' },
]

export default function PublicNav() {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <header className="nav-rail">
        <div className="nav">
          <Link to="/" className="nav-brand" aria-label="Stop · Check · Go home">
            <svg height="32" viewBox="0 0 1200 280">
              <use href="#lockup-header" />
            </svg>
          </Link>
          <nav className="nav-links">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  isActive ? 'nav-link current' : 'nav-link'
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <Link to="/start" className="nav-cta">
            Start an assessment
          </Link>
          <button
            type="button"
            className={menuOpen ? 'mob-toggle x' : 'mob-toggle'}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      <div className={menuOpen ? 'mob-menu-drawer open' : 'mob-menu-drawer'}>
        <div className="mob-bar">
          <Link to="/" className="nav-brand" aria-label="Stop · Check · Go home" onClick={closeMenu}>
            <svg height="22" viewBox="0 0 1200 280">
              <use href="#lockup-header" />
            </svg>
          </Link>
          <button
            type="button"
            className="mob-toggle x"
            aria-label="Close menu"
            onClick={closeMenu}
          >
            <span></span>
            <span></span>
          </button>
        </div>
        <div className="mob-menu">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive ? 'mob-link current' : 'mob-link'
              }
              onClick={closeMenu}
            >
              {label}
            </NavLink>
          ))}
        </div>
        <Link to="/start" className="mob-cta" onClick={closeMenu}>
          Start an assessment
        </Link>
        <div className="mob-meta">menu · v0.3 · pre-launch</div>
      </div>
    </>
  )
}
