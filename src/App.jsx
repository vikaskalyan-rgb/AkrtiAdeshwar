import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useEffect } from 'react'
import { startKeepAlive } from './api/keepAlive'
import SwipeBack from './components/SwipeBack'

// Pages
import Login              from './pages/Login'
import HomeScreen         from './pages/HomeScreen'
import Dashboard          from './pages/Dashboard'
import Maintenance        from './pages/Maintenance'
import Expenses           from './pages/Expenses'
import Complaints         from './pages/Complaints'
import Announcements      from './pages/Announcements'
import Visitors           from './pages/Visitors'
import FlatDirectory      from './pages/FlatDirectory'
import FlatManagement     from './pages/FlatManagement'
import Reports            from './pages/Reports'
import OrgChart           from './pages/OrgChart'
import Workers            from './pages/Workers'
import WatchmanLog        from './pages/WatchmanLog'
import NearbyPlaces       from './pages/NearbyPlaces'
import LostFound          from './pages/LostFound'
import DeliveryTracker    from './pages/DeliveryTracker'
import AmenityBooking     from './pages/AmenityBooking'
import StepsPage          from './pages/StepsPage'
import CommunityBoard     from './pages/CommunityBoard'
import IdeasSuggestions   from './pages/IdeasSuggestions'
import BuySell            from './pages/BuySell'
import WeeklyActivities   from './pages/WeeklyActivities'
import ClassesEvents      from './pages/ClassesEvents'

import ResidentDashboard   from './pages/resident/ResidentDashboard'
import ResidentMaintenance from './pages/resident/ResidentMaintenance'
import ResidentComplaints  from './pages/resident/ResidentComplaints'
import {
  ResidentAnnouncements,
  ResidentVisitors,
  ResidentExpenses,
  ResidentDirectory,
  ResidentReports,
} from './pages/resident/ResidentReadOnly'

// ── Guard: owner-only pages ───────────────────────────────
function OwnerOnly({ children }) {
  const { user } = useAuth()
  if (user?.role === 'tenant') return <Navigate to="/home" replace />
  return children
}

// ── Unified App Shell — no sidebar ───────────────────────
function AppShell() {
  const { user } = useAuth()
  const location = useLocation()
  const isHome   = location.pathname === '/home'

  const isAdmin  = user?.role === 'admin'
  const isOwner  = user?.role === 'owner'
  const isTenant = user?.role === 'tenant'

  return (
    <>
      {/* Swipe back gesture — active on all non-home pages */}
      {!isHome && <SwipeBack />}

      <div className="flex flex-col h-screen overflow-hidden"
        style={{ background: 'var(--surface-2)' }}>
        <main className="flex-1 overflow-hidden">
          <Routes>

            {/* ── Home screen — everyone lands here ── */}
            <Route path="/home" element={<HomeScreen />} />

            {/* ── Redirect root to home ── */}
            <Route path="/" element={<Navigate to="/home" replace />} />

            {/* ── Admin pages ── */}
            {isAdmin && <>
              <Route path="/dashboard"         element={<Dashboard />} />
              <Route path="/maintenance"       element={<Maintenance />} />
              <Route path="/expenses"          element={<Expenses />} />
              <Route path="/complaints"        element={<Complaints />} />
              <Route path="/announcements"     element={<Announcements />} />
              <Route path="/visitors"          element={<Visitors />} />
              <Route path="/watchman"          element={<WatchmanLog />} />
              <Route path="/nearby"            element={<NearbyPlaces />} />
              <Route path="/org-chart"         element={<OrgChart />} />
              <Route path="/flats"             element={<FlatDirectory />} />
              <Route path="/flat-management"   element={<FlatManagement />} />
              <Route path="/workers"           element={<Workers />} />
              <Route path="/reports"           element={<Reports />} />
              <Route path="/lost-found"        element={<LostFound />} />
              <Route path="/deliveries"        element={<DeliveryTracker />} />
              <Route path="/amenities"         element={<AmenityBooking />} />
              <Route path="/steps"             element={<StepsPage />} />
              <Route path="/community-board"   element={<CommunityBoard />} />
              <Route path="/ideas"             element={<IdeasSuggestions />} />
              <Route path="/buy-sell"          element={<BuySell />} />
              <Route path="/weekly-activities" element={<WeeklyActivities />} />
              <Route path="/classes-events"    element={<ClassesEvents />} />
            </>}

            {/* ── Resident pages (owner + tenant) ── */}
            {(isOwner || isTenant) && <>
              <Route path="/resident"               element={<ResidentDashboard />} />
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
              <Route path="/steps"                  element={<StepsPage />} />
              <Route path="/community-board"        element={<CommunityBoard />} />
              <Route path="/ideas"                  element={<IdeasSuggestions />} />
              <Route path="/buy-sell"               element={<BuySell />} />
              <Route path="/weekly-activities"      element={<WeeklyActivities />} />
              <Route path="/classes-events"         element={<ClassesEvents />} />

              {/* Owner only */}
              <Route path="/resident/expenses" element={
                <OwnerOnly><ResidentExpenses /></OwnerOnly>
              } />
              <Route path="/resident/reports" element={
                <OwnerOnly><ResidentReports /></OwnerOnly>
              } />
            </>}

            {/* ── Catch all → home ── */}
            <Route path="*" element={<Navigate to="/home" replace />} />

          </Routes>
        </main>
      </div>
    </>
  )
}

// ── Root ─────────────────────────────────────────────────
function AppRoutes() {
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      const stop = startKeepAlive()
      return stop
    }
  }, [user])

  if (!user) return <Login />
  return <AppShell />
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