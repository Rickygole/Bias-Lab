import { useEffect, useRef, useState } from 'react'
import AnimatedNumber from './AnimatedNumber.jsx'
import { percent, points } from '../lib/format.js'

function Stat({ value, format, label, unit, className = '' }) {
  return (
    <div className="flex shrink-0 flex-col gap-1.5">
      <span className="flex items-baseline gap-1.5">
        <AnimatedNumber
          value={value}
          format={format}
          blankWidth={44}
          className={`n-lg transition-colors duration-500 ${className}`}
        />
        {unit ? <span className="note text-dim">{unit}</span> : null}
      </span>
      <span className="label text-dim">{label}</span>
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
    <div className="flex flex-wrap items-end gap-x-10 gap-y-4 border-t border-edge px-6 py-4 lg:px-5">
      <Stat
        value={accuracy}
        format={(v) => percent(v, 1)}
        label="Overall accuracy"
        className={striking ? 'text-good' : 'text-ink'}
      />
      <span className="hidden h-9 w-px self-center bg-edge sm:block" aria-hidden="true" />
      <Stat
        value={largestGap}
        format={(v) => points(v, 1)}
        unit="pts"
        label="Largest group gap"
        className="text-ink"
      />
      <p className="note max-w-[52ch] pb-1.5 text-muted">
        {accuracy === null
          ? 'Fitting the model on the training split.'
          : drift === null
            ? 'Move the threshold and watch these two numbers pull against each other.'
            : `Since you started, accuracy has moved ${points(drift.accuracy, 1)} points and the largest gap has moved ${points(drift.gap, 1)}.${striking ? ' The gap has moved much further than accuracy.' : ''}`}
      </p>
    </div>
  )
}
