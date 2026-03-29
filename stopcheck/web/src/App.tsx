import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Home from './pages/public/Home'
import Pricing from './pages/public/Pricing'
import Privacy from './pages/public/Privacy'
import Terms from './pages/public/Terms'
import Safety from './pages/public/Safety'
import FAQ from './pages/public/FAQ'
import About from './pages/public/About'
import HowItWorks from './pages/public/HowItWorks'
import Community from './pages/Community'
import CommunityApply from './pages/CommunityApply'
import RiderHub from './pages/RiderHub'
import RiderResults from './pages/RiderResults'
import NotFound from './pages/NotFound'
import Login from './pages/dashboard/Login'
import Register from './pages/dashboard/Register'
import EventList from './pages/dashboard/EventList'
import EventWizard from './pages/dashboard/EventWizard'
import EventDashboard from './pages/dashboard/EventDashboard'
import RiderDetail from './pages/dashboard/RiderDetail'
import Podium from './pages/dashboard/Podium'
import AdminSponsorships from './pages/dashboard/AdminSponsorships'
import EmailPreview from './pages/dashboard/EmailPreview'
import Billing from './pages/dashboard/Billing'
import Settings from './pages/dashboard/Settings'
import DashboardLayout from './components/dashboard/DashboardLayout'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { org, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>
  if (!org) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Marketing / public pages */}
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/safety" element={<Safety />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/about" element={<About />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/community" element={<Community />} />
        <Route path="/apply/community" element={<CommunityApply />} />

        {/* Rider-facing (no auth) */}
        <Route path="/r/:authToken" element={<RiderHub />} />
        <Route path="/r/:authToken/results" element={<RiderResults />} />

        {/* Podium check — no auth required (tablet at finish line) */}
        <Route path="/events/:id/podium" element={<Podium />} />

        {/* Organizer auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Organizer dashboard (protected) */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<EventList />} />
          <Route path="/events/new" element={<EventWizard />} />
          <Route path="/events/:id" element={<EventDashboard />} />
          <Route path="/events/:id/rider/:riderId" element={<RiderDetail />} />
          <Route path="/events/:id/email" element={<EmailPreview />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin/sponsorships" element={<AdminSponsorships />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}
