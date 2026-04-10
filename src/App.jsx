import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useEffect } from 'react'
import { startKeepAlive } from './api/keepAlive'
import SwipeBack from './components/SwipeBack'
import Login from './pages/Login'
import HomeScreen from './pages/HomeScreen'
import Sidebar from './components/layout/Sidebar'
import Dashboard from './pages/Dashboard'
import Maintenance from './pages/Maintenance'
import Expenses from './pages/Expenses'
import Complaints from './pages/Complaints'
import Announcements from './pages/Announcements'
import Visitors from './pages/Visitors'
import FlatDirectory from './pages/FlatDirectory'
import FlatManagement from './pages/FlatManagement'
import Reports from './pages/Reports'
import ResidentLayout from './pages/resident/ResidentLayout'
import ResidentDashboard from './pages/resident/ResidentDashboard'
import ResidentMaintenance from './pages/resident/ResidentMaintenance'
import ResidentComplaints from './pages/resident/ResidentComplaints'
import OrgChart from './pages/OrgChart'
import Workers from './pages/Workers'
import WatchmanLog from './pages/WatchmanLog'
import NearbyPlaces from './pages/NearbyPlaces'
import LostFound from './pages/LostFound'
import DeliveryTracker from './pages/DeliveryTracker'
import AmenityBooking from './pages/AmenityBooking'
import {
  ResidentAnnouncements,
  ResidentVisitors,
  ResidentExpenses,
  ResidentDirectory,
  ResidentReports,
} from './pages/resident/ResidentReadOnly'

// ── Tenant guard ──────────────────────────────────────────
function OwnerOnlyRoute({ children }) {
  const { user } = useAuth()
  if (user?.role === 'tenant') return <Navigate to="/resident" replace />
  return children
}

// ── Admin shell — desktop keeps sidebar, mobile uses HomeScreen ──
function AdminShell() {
  const location = useLocation()
  const isHome   = location.pathname === '/home'

  return (
    <>
      {/* Swipe-back gesture — active on all pages except home */}
      {!isHome && <SwipeBack />}

      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--surface-2)' }}>
        {/* Desktop sidebar — hidden on mobile */}
        <Sidebar />

        <main className="flex-1 overflow-hidden pt-[56px] md:pt-0 pb-[64px] md:pb-0">
          <Routes>
            {/* Mobile home screen */}
            <Route path="/home"            element={<HomeScreen />} />

            {/* All feature pages */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<HomeScreen />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/maintenance"     element={<Maintenance />} />
            <Route path="/expenses"        element={<Expenses />} />
            <Route path="/complaints"      element={<Complaints />} />
            <Route path="/announcements"   element={<Announcements />} />
            <Route path="/visitors"        element={<Visitors />} />
            <Route path="/watchman"        element={<WatchmanLog />} />
            <Route path="/nearby"          element={<NearbyPlaces />} />
            <Route path="/org-chart"       element={<OrgChart />} />
            <Route path="/resident/org-chart" element={<OrgChart />} />
            <Route path="/flats"           element={<FlatDirectory />} />
            <Route path="/flat-management" element={<FlatManagement />} />
            <Route path="/workers"         element={<Workers />} />
            <Route path="/resident/workers" element={<Workers />} />
            <Route path="/reports"         element={<Reports />} />
            <Route path="/lost-found"      element={<LostFound />} />
            <Route path="/deliveries"      element={<DeliveryTracker />} />
            <Route path="/amenities"       element={<AmenityBooking />} />
            <Route path="*"               element={<Navigate to="/home" replace />} />
          </Routes>
        </main>
      </div>
    </>
  )
}

// ── Resident shell ────────────────────────────────────────
function ResidentShell() {
  const location = useLocation()
  const isHome   = location.pathname === '/home'

  return (
    <>
      {!isHome && <SwipeBack />}
      <ResidentLayout>
        <Routes>
          {/* Mobile home screen */}
          <Route path="/resident" element={<Navigate to="/home" replace />} />
          <Route path="/resident/dashboard" element={<ResidentDashboard />} />
          <Route path="/home"                   element={<HomeScreen />} />
          <Route path="/resident/maintenance"   element={<ResidentMaintenance />} />
          <Route path="/resident/complaints"    element={<ResidentComplaints />} />
          <Route path="/resident/announcements" element={<ResidentAnnouncements />} />
          <Route path="/resident/visitors"      element={<ResidentVisitors />} />
          <Route path="/resident/watchman"      element={<WatchmanLog />} />
          <Route path="/resident/nearby"        element={<NearbyPlaces />} />
          <Route path="/resident/directory"     element={<ResidentDirectory />} />
          <Route path="/resident/workers"       element={<Workers />} />
          <Route path="/resident/org-chart"     element={<OrgChart />} />
          <Route path="/lost-found"             element={<LostFound />} />
          <Route path="/deliveries"             element={<DeliveryTracker />} />
          <Route path="/amenities"              element={<AmenityBooking />} />

          {/* Owner only */}
          <Route path="/resident/expenses" element={
            <OwnerOnlyRoute><ResidentExpenses /></OwnerOnlyRoute>
          } />
          <Route path="/resident/reports" element={
            <OwnerOnlyRoute><ResidentReports /></OwnerOnlyRoute>
          } />

          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </ResidentLayout>
    </>
  )
}

// ── App routes ────────────────────────────────────────────
function AppRoutes() {
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      const stop = startKeepAlive()
      return stop
    }
  }, [user])

  if (!user) return <Login />
  if (user.role === 'admin') return <AdminShell />
  return <ResidentShell />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}