import { Link } from 'react-router-dom'
import './chrome.css'

export default function PublicFooter() {
  return (
    <footer className="ft">
      <div className="ft-grid">
        <div>
          <svg
            height="36"
            viewBox="0 0 1200 280"
            className="scg-lockup-reversed ft-brand-svg"
            aria-label="Stop · Check · Go"
          >
            <use href="#lockup-header" />
          </svg>
          <p className="ft-tag">A safety check before the ride starts.</p>
          <div className="ft-position-inline">
            <h5>Position</h5>
            <ul>
              <li>
                <Link to="/why-we-stop">Why we stop</Link>
              </li>
            </ul>
          </div>
        </div>
        <div>
          <h5>Product</h5>
          <ul>
            <li><Link to="/how-it-works">How it works</Link></li>
            <li><Link to="/safety">Safety</Link></li>
            <li><Link to="/pricing">Pricing</Link></li>
            <li><Link to="/for-organizers">For organizers</Link></li>
            <li><Link to="/for-riders">For riders</Link></li>
          </ul>
        </div>
        <div>
          <h5>Governance</h5>
          <ul>
            <li><Link to="/trust">Trust</Link></li>
            <li><Link to="/privacy">Privacy</Link></li>
            <li><Link to="/terms">Terms</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>
      </div>
      <div className="ft-base">
        <span>© 2026 Stop · Check · Go · Field assessments for gravel events</span>
        <span>v0.3 · pre-launch</span>
      </div>
    </footer>
  )
}
