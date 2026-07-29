import { useEffect, useRef, useState } from 'react'

const DURATION = 250
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

export default function AnimatedNumber({ value, format, className = '' }) {
  const [shown, setShown] = useState(value)
  const frame = useRef(0)
  const from = useRef(value)

  useEffect(() => {
    if (value === null || !Number.isFinite(value)) {
      setShown(value)
      return undefined
    }

    const start = from.current
    if (!Number.isFinite(start) || Math.abs(value - start) < SNAP_BELOW || prefersReducedMotion()) {
      from.current = value
      setShown(value)
      return undefined
    }

    const began = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - began) / DURATION)
      const current = start + (value - start) * easeOut(t)
      setShown(current)
      from.current = current
      if (t < 1) frame.current = requestAnimationFrame(tick)
      else from.current = value
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [value])

  return <span className={className}>{format(shown)}</span>
}
