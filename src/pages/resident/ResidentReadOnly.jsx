import Announcements from '../Announcements'
import Visitors from '../Visitors'
import Expenses from '../Expenses'
import FlatDirectory from '../FlatDirectory'
import Reports from '../Reports'

// Residents see the same pages as admin but with
// no add/delete buttons (controlled inside each component via user.role check)

export function ResidentAnnouncements() {
  return <Announcements />
}

export function ResidentVisitors() {
  return <Visitors />
}

export function ResidentExpenses() {
  return <Expenses />
}

export function ResidentDirectory() {
  return <FlatDirectory />
}

export function ResidentReports() {
  return <Reports />
}