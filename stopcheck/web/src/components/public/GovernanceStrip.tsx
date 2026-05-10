import { Link } from 'react-router-dom'
import './chrome.css'

/**
 * Governance preview strip — Step 4 v4 state 05.
 * Sits above the dark footer on every public page.
 * Lifts /trust without preaching.
 */
export default function GovernanceStrip() {
  return (
    <div className="gov-strip">
      <div className="gov-strip-mark">
        <svg width="28" height="28" viewBox="0 0 300 300">
          <use href="#mark" />
        </svg>
        <span className="label">Trust · Privacy · Terms</span>
      </div>
      <div className="gov-strip-copy">
        How we hold ourselves accountable — the structural receipts behind every assessment.
      </div>
      <Link to="/trust" className="gov-strip-link">
        Read the index&nbsp;→
      </Link>
    </div>
  )
}
