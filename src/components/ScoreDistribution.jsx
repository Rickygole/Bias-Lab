import { useCallback, useEffect, useMemo, useRef } from 'react'
import { histogram } from '../ml/metrics.js'
import Pending from './Pending.jsx'

const BINS = 20
const WIDTH = 100
const HEIGHT = 200
const INSET = 1
const TOP = 12
const BOTTOM = 8
const PLOT = WIDTH - INSET * 2
const FLOOR = HEIGHT - TOP - BOTTOM

export default function ScoreDistribution({
  scores,
  groups,
  groupNames,
  thresholds,
  splitMode,
  onThreshold,
}) {
  const boxRef = useRef(null)
  const dragging = useRef(null)

  const bars = useMemo(() => {
    if (!scores) return null
    const a = histogram(scores, groups, 0, BINS)
    const b = histogram(scores, groups, 1, BINS)
    const peak = Math.max(...a, ...b, 1)
    return { a, b, peak }
  }, [scores, groups])

  const positionFromEvent = useCallback((event) => {
    const box = boxRef.current
    if (!box) return null
    const rect = box.getBoundingClientRect()
    if (rect.width === 0) return null
    const fraction = ((event.clientX - rect.left) / rect.width) * WIDTH
    return Math.min(1, Math.max(0, (fraction - INSET) / PLOT))
  }, [])

  const handleMove = useCallback(
    (event) => {
      if (dragging.current === null) return
      const value = positionFromEvent(event)
      if (value !== null) onThreshold(dragging.current, Math.round(value * 100) / 100)
    },
    [onThreshold, positionFromEvent],
  )

  useEffect(() => {
    const stop = () => {
      dragging.current = null
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
    }
  }, [handleMove])

  if (!bars) {
    return (
      <Pending>One histogram per group, under a threshold line you can drag across them.</Pending>
    )
  }

  const startDrag = (group) => (event) => {
    event.preventDefault()
    dragging.current = group
    const value = positionFromEvent(event)
    if (value !== null) onThreshold(group, Math.round(value * 100) / 100)
  }

  const barWidth = PLOT / BINS

  const series = [
    { counts: bars.a, color: 'var(--color-groupA)', name: groupNames[0] },
    { counts: bars.b, color: 'var(--color-groupB)', name: groupNames[1] },
  ]

  const lines = splitMode
    ? [
        { group: 0, value: thresholds[0], color: 'var(--color-groupA)' },
        { group: 1, value: thresholds[1], color: 'var(--color-groupB)' },
      ]
    : [{ group: 0, value: thresholds[0], color: 'var(--color-ink)' }]

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex gap-6">
        {series.map((s) => (
          <span key={s.name} className="flex items-center gap-2 text-[11px] text-muted">
            <span className="h-2 w-2 rounded-[1px]" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>

      <div ref={boxRef} className="relative min-h-[200px] flex-1 touch-none select-none">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <g transform={`translate(${INSET}, ${TOP})`}>
            {series.map((s) =>
              s.counts.map((c, i) => {
                const h = (c / bars.peak) * FLOOR
                return (
                  <rect
                    key={`${s.name}-${i}`}
                    x={i * barWidth}
                    y={FLOOR - h}
                    width={barWidth - 0.15}
                    height={h}
                    fill={s.color}
                    opacity={0.7}
                  />
                )
              }),
            )}

            <line
              x1={0}
              x2={PLOT}
              y1={FLOOR}
              y2={FLOOR}
              stroke="var(--color-edge)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />

            {lines.map((line) => (
              <line
                key={line.group}
                x1={line.value * PLOT}
                x2={line.value * PLOT}
                y1={-TOP}
                y2={FLOOR}
                stroke={line.color}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>
        </svg>

        {lines.map((line) => (
          <div
            key={line.group}
            aria-hidden="true"
            onPointerDown={startDrag(line.group)}
            className="absolute top-0 bottom-[4%] w-6 -translate-x-1/2 cursor-ew-resize"
            style={{ left: `${INSET + line.value * PLOT}%` }}
          >
            <span
              className="absolute top-0 left-1/2 h-2 w-2 -translate-x-1/2 rounded-[1px]"
              style={{ background: line.color }}
            />
          </div>
        ))}
      </div>

      <div className="mt-2 flex justify-between text-[11px] text-muted">
        <span className="num">0.00</span>
        <span>model score</span>
        <span className="num">1.00</span>
      </div>
    </div>
  )
}
