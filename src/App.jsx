import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useEffect } from 'react'
import { startKeepAlive } from './api/keepAlive'
import Login from './pages/Login'
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
import {
  ResidentAnnouncements,
  ResidentVisitors,
  ResidentExpenses,
  ResidentDirectory,
  ResidentReports,
} from './pages/resident/ResidentReadOnly'

// Redirect tenants away from owner-only pages
function OwnerOnlyRoute({ children }) {
  const { user } = useAuth()
  if (user?.role === 'tenant') {
    return <Navigate to="/resident" replace />
  }
  return children
}

function AdminShell() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Sidebar />
      <main className="flex-1 overflow-hidden pt-[56px] md:pt-0 pb-[64px] md:pb-0">
        <Routes>
          <Route path="/"                element={<Dashboard />} />
          <Route path="/maintenance"     element={<Maintenance />} />
          <Route path="/expenses"        element={<Expenses />} />
          <Route path="/complaints"      element={<Complaints />} />
          <Route path="/announcements"   element={<Announcements />} />
          <Route path="/visitors"        element={<Visitors />} />
          <Route path="/flats"           element={<FlatDirectory />} />
          <Route path="/flat-management" element={<FlatManagement />} />
          <Route path="/reports"         element={<Reports />} />
          <Route path="*"                element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function ResidentShell() {
  return (
    <ResidentLayout>
      <Routes>
        <Route path="/resident"               element={<ResidentDashboard />} />
        <Route path="/resident/maintenance"   element={<ResidentMaintenance />} />
        <Route path="/resident/complaints"    element={<ResidentComplaints />} />
        <Route path="/resident/announcements" element={<ResidentAnnouncements />} />
        <Route path="/resident/visitors"      element={<ResidentVisitors />} />
        <Route path="/resident/directory"     element={<ResidentDirectory />} />

        {/* Owner only */}
        <Route path="/resident/expenses" element={
          <OwnerOnlyRoute><ResidentExpenses /></OwnerOnlyRoute>
        } />
        <Route path="/resident/reports" element={
          <OwnerOnlyRoute><ResidentReports /></OwnerOnlyRoute>
        } />

        <Route path="*" element={<Navigate to="/resident" replace />} />
      </Routes>
    </ResidentLayout>
  )
}

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