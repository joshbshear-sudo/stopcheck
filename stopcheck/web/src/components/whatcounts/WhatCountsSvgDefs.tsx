/**
 * SVG symbol defs for the whatcounts tile system.
 * Render once on any page that mounts whatcounts tiles, so the tile components'
 * <use href="#wc-stop-sign"/> and <use href="#wc-check"/> references resolve.
 */
export default function WhatCountsSvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <symbol id="wc-stop-sign" viewBox="0 0 100 100">
          <polygon
            points="29.3,2 70.7,2 98,29.3 98,70.7 70.7,98 29.3,98 2,70.7 2,29.3"
            fill="none"
            stroke="#C8252C"
            strokeWidth="5"
            strokeLinejoin="round"
          />
        </symbol>
        <symbol id="wc-check" viewBox="0 0 24 24">
          <path
            d="M5 12.5 L10 17.5 L19 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>
      </defs>
    </svg>
  )
}
