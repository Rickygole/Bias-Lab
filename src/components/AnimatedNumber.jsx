import { useEffect, useRef, useState } from 'react'
import Blank from './Blank.jsx'

const DURATION = 220
const ARRIVAL = 460
const SNAP_BELOW = 0.15

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3)
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  )
}

export default function AnimatedNumber({ value, format, className = '', blankWidth = 18 }) {
  const [shown, setShown] = useState(value)
  const frame = useRef(0)
  const from = useRef(value)

  useEffect(() => {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      from.current = null
      setShown(value)
      return undefined
    }

    const arriving = from.current === null || !Number.isFinite(from.current)
    const start = arriving ? 0 : from.current

    if (prefersReducedMotion() || (!arriving && Math.abs(value - start) < SNAP_BELOW)) {
      from.current = value
      setShown(value)
      return undefined
    }

    const span = arriving ? ARRIVAL : DURATION
    const began = performance.now()
    let settled = false

    const settle = () => {
      if (settled) return
      settled = true
      from.current = value
      setShown(value)
    }

    const tick = (now) => {
      const t = Math.min(1, (now - began) / span)
      if (t >= 1) {
        settle()
        return
      }
      const current = start + (value - start) * easeOut(t)
      setShown(current)
      from.current = current
      frame.current = requestAnimationFrame(tick)
    }

    frame.current = requestAnimationFrame(tick)
    const guard = setTimeout(settle, span + 120)

    return () => {
      cancelAnimationFrame(frame.current)
      clearTimeout(guard)
    }
  }, [value])

  if (shown === null || shown === undefined || !Number.isFinite(shown)) {
    return (
      <span className={className}>
        <Blank width={blankWidth} />
      </span>
    )
  }

  return <span className={className}>{format(shown)}</span>
}
