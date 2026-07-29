import { useCallback, useEffect, useMemo, useRef } from 'react'
import { histogram } from '../ml/metrics.js'

const BINS = 20
const HEIGHT = 200
const PAD = { top: 12, right: 8, bottom: 26, left: 8 }

export default function ScoreDistribution({
  scores,
  groups,
  groupNames,
  thresholds,
  splitMode,
  onThreshold,
}) {
  const svgRef = useRef(null)
  const dragging = useRef(null)

  const bars = useMemo(() => {
    if (!scores) return null
    const a = histogram(scores, groups, 0, BINS)
    const b = histogram(scores, groups, 1, BINS)
    const peak = Math.max(...a, ...b, 1)
    return { a, b, peak }
  }, [scores, groups])

  const positionFromEvent = useCallback((event) => {
    const svg = svgRef.current
    if (!svg) return null
    const box = svg.getBoundingClientRect()
    const x = (event.touches ? event.touches[0].clientX : event.clientX) - box.left
    const usable = box.width - PAD.left - PAD.right
    return Math.min(1, Math.max(0, (x - PAD.left) / usable))
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
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', stop)
    }
  }, [handleMove])

  if (!bars) {
    return (
      <div className="flex h-full items-center justify-center text-[13px] text-muted">
        Train the model to see the score distributions.
      </div>
    )
  }

  const startDrag = (group) => (event) => {
    event.preventDefault()
    dragging.current = group
    const value = positionFromEvent(event)
    if (value !== null) onThreshold(group, Math.round(value * 100) / 100)
  }

  const width = 100
  const usable = width - 2
  const barWidth = usable / BINS

  const series = [
    { counts: bars.a, color: 'var(--color-groupA)', name: groupNames[0] },
    { counts: bars.b, color: 'var(--color-groupB)', name: groupNames[1] },
  ]

  const lines = splitMode
    ? [
        { group: 0, value: thresholds[0], color: 'var(--color-groupA)' },
        { group: 1, value: thresholds[1], color: 'var(--color-groupB)' },
      ]
    : [{ group: 0, value: thresholds[0], color: '#ffffff' }]

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex gap-4">
        {series.map((s) => (
          <span key={s.name} className="flex items-center gap-2 text-[11px] text-muted">
            <span className="h-2 w-2 rounded-[1px]" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="w-full flex-1 touch-none select-none"
        style={{ minHeight: HEIGHT }}
      >
        <g transform={`translate(1, ${PAD.top})`}>
          {series.map((s) =>
            s.counts.map((c, i) => {
              const h = (c / bars.peak) * (HEIGHT - PAD.top - PAD.bottom)
              return (
                <rect
                  key={`${s.name}-${i}`}
                  x={i * barWidth}
                  y={HEIGHT - PAD.top - PAD.bottom - h}
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
            x2={usable}
            y1={HEIGHT - PAD.top - PAD.bottom}
            y2={HEIGHT - PAD.top - PAD.bottom}
            stroke="var(--color-edge)"
            strokeWidth={0.4}
          />

          {lines.map((line) => (
            <g key={line.group}>
              <line
                x1={line.value * usable}
                x2={line.value * usable}
                y1={-6}
                y2={HEIGHT - PAD.top - PAD.bottom + 4}
                stroke={line.color}
                strokeWidth={0.5}
              />
              <rect
                x={line.value * usable - 2}
                y={-8}
                width={4}
                height={HEIGHT - PAD.bottom}
                fill="transparent"
                className="cursor-ew-resize"
                onPointerDown={startDrag(line.group)}
              />
            </g>
          ))}
        </g>
      </svg>

      <div className="mt-1 flex justify-between text-[11px] text-muted">
        <span className="num">0.00</span>
        <span>model score</span>
        <span className="num">1.00</span>
      </div>
    </div>
  )
}
