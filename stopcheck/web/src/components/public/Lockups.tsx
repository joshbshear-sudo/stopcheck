/**
 * Locked SVG symbols from _brand/_stage4/assets/.
 * Renders once at the layout root so all chrome and page-level <use> references resolve.
 *
 * - lockup-header: full Stop · Check · Go three-beat wordmark with mark glyph
 * - mark: square + arc + dotted gravel curve (governance strip, mobile bar fallback)
 *
 * Reversed treatment for dark backgrounds is class-based (.scg-lockup-reversed) per chrome.css.
 */
export default function Lockups() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: 'absolute' }}
      aria-hidden="true"
    >
      <defs>
        <symbol id="lockup-header" viewBox="0 0 1200 280" className="scg-lockup">
          <g transform="translate(40, 40) scale(0.667)">
            <path
              d="M -10 152 C 40 148, 90 154, 140 150 C 175 147, 215 153, 260 149 C 285 147, 305 150, 320 148"
              fill="none"
              stroke="#343E48"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M -8 286 C 30 268, 70 240, 102 208 C 124 188, 134 168, 150 152 C 154 142, 158 134, 156 122 C 168 100, 184 80, 200 64 C 218 46, 242 28, 268 14 C 286 4, 308 -2, 320 -8"
              fill="none"
              stroke="#343E48"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="2 9"
            />
            <rect x="136" y="138" width="28" height="28" fill="#343E48" />
            <path
              d="M 50 150 A 100 100 0 0 1 250 150"
              fill="none"
              stroke="#343E48"
              strokeWidth="14"
              strokeLinecap="round"
            />
          </g>
          <g>
            <text x="280" y="170" className="word">Stop</text>
            <line x1="494" y1="115" x2="494" y2="195" stroke="#A5ACB2" strokeWidth="2" />
            <text x="514" y="170" className="word">Check</text>
            <line x1="794" y1="115" x2="794" y2="195" stroke="#A5ACB2" strokeWidth="2" />
            <text x="814" y="170" className="word">Go</text>
          </g>
        </symbol>

        <symbol id="mark" viewBox="0 0 300 300">
          <path
            d="M -10 152 C 40 148, 90 154, 140 150 C 175 147, 215 153, 260 149 C 285 147, 305 150, 320 148"
            fill="none"
            stroke="#343E48"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M -8 286 C 30 268, 70 240, 102 208 C 124 188, 134 168, 150 152 C 154 142, 158 134, 156 122 C 168 100, 184 80, 200 64 C 218 46, 242 28, 268 14 C 286 4, 308 -2, 320 -8"
            fill="none"
            stroke="#343E48"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="2 9"
          />
          <path
            d="M 50 150 A 100 100 0 0 1 250 150"
            fill="none"
            stroke="#343E48"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <rect x="136" y="138" width="28" height="28" fill="#343E48" />
        </symbol>
      </defs>
    </svg>
  )
}
