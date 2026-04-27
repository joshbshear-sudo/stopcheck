import { Link } from 'react-router-dom'

export default function PublicFooter() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-10">
      <div className="max-w-4xl mx-auto px-4 grid md:grid-cols-4 gap-8 text-sm">
        <div>
          <div className="text-white font-bold mb-3">&#128721; StopCheck</div>
          <p>Stop, check, go. Three seconds at every stop sign.</p>
        </div>
        <div>
          <div className="font-semibold text-gray-300 mb-3">Product</div>
          <div className="space-y-1">
            <Link to="/how-it-works" className="block text-gray-400 no-underline hover:text-white">How It Works</Link>
            <Link to="/pricing" className="block text-gray-400 no-underline hover:text-white">Pricing</Link>
            <Link to="/faq" className="block text-gray-400 no-underline hover:text-white">FAQ</Link>
            <Link to="/community" className="block text-gray-400 no-underline hover:text-white">Community Partners</Link>
            <Link to="/apply/community" className="block text-gray-400 no-underline hover:text-white">Apply for Sponsorship</Link>
          </div>
        </div>
        <div>
          <div className="font-semibold text-gray-300 mb-3">Mission</div>
          <div className="space-y-1">
            <Link to="/safety" className="block text-gray-400 no-underline hover:text-white">Why Safety Matters</Link>
            <Link to="/about" className="block text-gray-400 no-underline hover:text-white">About StopCheck</Link>
            <Link to="/privacy" className="block text-gray-400 no-underline hover:text-white">Privacy Policy</Link>
            <Link to="/terms" className="block text-gray-400 no-underline hover:text-white">Terms of Service</Link>
          </div>
        </div>
        <div>
          <div className="font-semibold text-gray-300 mb-3">Get Started</div>
          <div className="space-y-1">
            <Link to="/register" className="block text-gray-400 no-underline hover:text-white">Start Free Trial</Link>
            <Link to="/login" className="block text-gray-400 no-underline hover:text-white">Sign In</Link>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 mt-8 pt-6 border-t border-gray-800 text-xs text-gray-500 text-center">
        &copy; 2026 StopCheck. Built in Lincoln, Nebraska.
      </div>
    </footer>
  )
}
