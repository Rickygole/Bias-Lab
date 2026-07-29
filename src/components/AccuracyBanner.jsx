import { useEffect, useRef, useState } from 'react'
import AnimatedNumber from './AnimatedNumber.jsx'
import { percent, points } from '../lib/format.js'

export default function AccuracyBanner({ accuracy, largestGap }) {
  const baseline = useRef(null)
  const [drift, setDrift] = useState(null)

  useEffect(() => {
    if (accuracy === null || largestGap === null) {
      baseline.current = null
      setDrift(null)
      return
    }
    if (baseline.current === null) {
      baseline.current = { accuracy, gap: largestGap }
      return
    }
    setDrift({
      accuracy: Math.abs(accuracy - baseline.current.accuracy),
      gap: Math.abs(largestGap - baseline.current.gap),
    })
  }, [accuracy, largestGap])

  const striking = drift !== null && drift.gap > 0.05 && drift.accuracy < drift.gap / 3

  return (
    <div className="flex shrink-0 flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-edge px-6 py-6">
      <AnimatedNumber
        value={accuracy}
        format={(v) => (v === null ? '--.-%' : percent(v, 1))}
        className={`num text-[32px] leading-none transition-colors duration-500 ${
          accuracy === null ? 'text-muted' : striking ? 'text-good' : 'text-ink'
        }`}
      />
      <span className="label">Overall accuracy</span>

      {drift === null ? (
        <span className="text-[11px] text-muted">
          Move the threshold and watch this number against the gaps above.
        </span>
      ) : (
        <span className="text-[11px] text-muted">
          Since you started, accuracy has moved{' '}
          <span className="num text-ink">{points(drift.accuracy, 1)}</span> points. The largest group
          gap has moved <span className="num text-ink">{points(drift.gap, 1)}</span>.
        </span>
      )}
    </div>
  )
}
