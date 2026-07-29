import { useEffect, useRef, useState } from 'react'
import AnimatedNumber from './AnimatedNumber.jsx'
import { percent, points } from '../lib/format.js'

function Stat({ value, format, label, className = '' }) {
  return (
    <div className="flex shrink-0 flex-col gap-1">
      <AnimatedNumber
        value={value}
        format={format}
        className={`num text-[36px] leading-[36px] tracking-tight transition-colors duration-500 ${className}`}
      />
      <span className="label">{label}</span>
    </div>
  )
}

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
    <div className="sticky bottom-0 z-10 flex shrink-0 flex-wrap items-end gap-x-10 gap-y-4 border-t border-edge bg-bg px-6 py-4 lg:static">
      {accuracy === null ? (
        <div className="flex h-[56px] flex-col justify-end gap-1">
          <span className="label">Overall accuracy</span>
          <span className="text-[11px] text-muted">Fitting the model on the training split</span>
        </div>
      ) : (
        <>
          <Stat
            value={accuracy}
            format={(v) => percent(v, 1)}
            label="Overall accuracy"
            className={striking ? 'text-good' : 'text-ink'}
          />
          <Stat
            value={largestGap}
            format={(v) => `${points(v, 1)} pts`}
            label="Largest group gap"
            className="text-ink"
          />
          <p className="max-w-[46ch] pb-1 text-[11px] leading-snug text-muted">
            {drift === null
              ? 'Move the threshold and watch these two numbers pull against each other.'
              : `Since you started, accuracy has moved ${points(drift.accuracy, 1)} points and the largest gap has moved ${points(drift.gap, 1)}.`}
          </p>
        </>
      )}
    </div>
  )
}
