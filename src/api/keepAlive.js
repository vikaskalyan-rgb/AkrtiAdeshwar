import api from './config'

// Ping backend every 10 minutes to prevent Render free tier sleep
export function startKeepAlive() {
  const ping = async () => {
    try {
      await api.get('/api/dashboard')
    } catch {
      // Silently ignore — just keeping the connection alive
    }
  }

  // Ping immediately on load
  ping()

  // Then every 10 minutes
  const interval = setInterval(ping, 10 * 60 * 1000)

  // Return cleanup function
  return () => clearInterval(interval)
}