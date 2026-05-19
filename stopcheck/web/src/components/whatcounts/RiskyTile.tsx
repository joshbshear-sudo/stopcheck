import './whatcounts.css'

export default function RiskyTile() {
  return (
    <figure className="wc-tile wc-tile--risky">
      <div className="wc-window">
        <div className="wc-scene">
          <div className="wc-path"></div>
          <svg className="wc-sign" viewBox="0 0 100 100"><use href="#wc-stop-sign"/></svg>
          <div className="wc-rider"></div>
          <span className="wc-check-dot wc-check-dot--left-1"></span>
        </div>
        <div className="wc-checkmark"><svg viewBox="0 0 24 24"><use href="#wc-check"/></svg></div>
      </div>
      <figcaption className="wc-caption">
        Slow roll — not a stop. Likely to be flagged in the Field Report.
      </figcaption>
    </figure>
  )
}
