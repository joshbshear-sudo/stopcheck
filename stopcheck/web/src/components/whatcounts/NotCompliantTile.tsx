import './whatcounts.css'

export default function NotCompliantTile() {
  return (
    <figure className="wc-tile wc-tile--not-compliant">
      <div className="wc-window">
        <div className="wc-scene">
          <div className="wc-path"></div>
          <svg className="wc-sign" viewBox="0 0 100 100"><use href="#wc-stop-sign"/></svg>
          <div className="wc-rider"></div>
        </div>
        <div className="wc-checkmark"><svg viewBox="0 0 24 24"><use href="#wc-check"/></svg></div>
      </div>
      <figcaption className="wc-caption">
        Rode through. The system records this as not compliant.
      </figcaption>
    </figure>
  )
}
