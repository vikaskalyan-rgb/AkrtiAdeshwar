import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * SwipeBack — attaches a left-edge swipe gesture to go back (iOS style)
 * Swipe starts within 24px of the left edge, drag right ≥ 80px triggers navigate(-1)
 */
export default function SwipeBack() {
  const navigate  = useNavigate()
  const startX    = useRef(null)
  const startY    = useRef(null)
  const active    = useRef(false)

  useEffect(() => {
    const EDGE_ZONE   = 24   // px from left edge to start swipe
    const MIN_DIST    = 80   // px horizontal drag to trigger
    const MAX_VERT    = 60   // px max vertical drift allowed

    const onTouchStart = (e) => {
      const touch = e.touches[0]
      if (touch.clientX <= EDGE_ZONE) {
        startX.current  = touch.clientX
        startY.current  = touch.clientY
        active.current  = true
      }
    }

    const onTouchEnd = (e) => {
      if (!active.current) return
      const touch   = e.changedTouches[0]
      const dx      = touch.clientX - startX.current
      const dy      = Math.abs(touch.clientY - startY.current)
      active.current = false
      if (dx >= MIN_DIST && dy <= MAX_VERT) {
        navigate(-1)
      }
    }

    const onTouchCancel = () => { active.current = false }

    window.addEventListener('touchstart',  onTouchStart,  { passive: true })
    window.addEventListener('touchend',    onTouchEnd,    { passive: true })
    window.addEventListener('touchcancel', onTouchCancel, { passive: true })

    return () => {
      window.removeEventListener('touchstart',  onTouchStart)
      window.removeEventListener('touchend',    onTouchEnd)
      window.removeEventListener('touchcancel', onTouchCancel)
    }
  }, [navigate])

  return null
}