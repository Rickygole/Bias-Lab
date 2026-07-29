import { useCallback, useEffect, useMemo, useRef } from 'react'
import { histogram } from '../ml/metrics.js'
import GroupTag from './GroupTag.jsx'

const BINS = 40
const W = 100
const HALF = 78
const H = HALF * 2
const DIM = 0.24
const TICKS = [0, 0.25, 0.5, 0.75, 1]

function density(counts) {
  const total = counts.reduce((sum, c) => sum + c, 0)
  return total === 0 ? counts.map(() => 0) : counts.map((c) => c / total)
}

function Bars({ series, peak, up, lit }) {
  const width = W / BINS
  return series.map((value, i) => {
    const h = peak === 0 ? 0 : (value / peak) * HALF
    if (h <= 0) return null
    return (
      <rect
        key={i}
        x={i * width}
        y={up ? HALF - h : HALF}
        width={width - 0.35}
        height={h}
        fill={lit}
      />
    )
  })
}

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
    if (!scores || !groups) return null
    const a = density(histogram(scores, groups, 0, BINS))
    const b = density(histogram(scores, groups, 1, BINS))
    return { a, b, peak: Math.max(...a, ...b, 1e-9) }
  }, [scores, groups])

  const positionFromEvent = useCallback((event) => {
    const box = boxRef.current
    if (!box) return null
    const rect = box.getBoundingClientRect()
    if (rect.width === 0) return null
    return Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
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

  const startDrag = (group) => (event) => {
    event.preventDefault()
    dragging.current = group
    const value = positionFromEvent(event)
    if (value !== null) onThreshold(group, Math.round(value * 100) / 100)
  }

  const lines = splitMode
    ? [
        { group: 0, value: thresholds[0], color: 'var(--color-groupA)', up: true },
        { group: 1, value: thresholds[1], color: 'var(--color-groupB)', up: false },
      ]
    : [{ group: 0, value: thresholds[0], color: 'var(--color-ink)', up: null }]

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex items-center gap-5">
        <GroupTag name={`${groupNames[0]} above`} color="var(--color-groupA)" />
        <GroupTag name={`${groupNames[1]} below`} color="var(--color-groupB)" />
      </div>

      <div ref={boxRef} className="relative h-[168px] touch-none select-none">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <clipPath id="lit-a">
              <rect x={thresholds[0] * W} y={0} width={W} height={HALF} />
            </clipPath>
            <clipPath id="lit-b">
              <rect
                x={(splitMode ? thresholds[1] : thresholds[0]) * W}
                y={HALF}
                width={W}
                height={HALF}
              />
            </clipPath>
          </defs>

          {bars ? (
            <>
              <g className="rise-up" style={{ '--rise-origin': '100%' }}>
                <g opacity={DIM}>
                  <Bars series={bars.a} peak={bars.peak} up lit="var(--color-groupA)" />
                </g>
                <g clipPath="url(#lit-a)">
                  <Bars series={bars.a} peak={bars.peak} up lit="var(--color-groupA)" />
                </g>
              </g>
              <g className="rise-up" style={{ '--rise-origin': '0%' }}>
                <g opacity={DIM}>
                  <Bars series={bars.b} peak={bars.peak} up={false} lit="var(--color-groupB)" />
                </g>
                <g clipPath="url(#lit-b)">
                  <Bars series={bars.b} peak={bars.peak} up={false} lit="var(--color-groupB)" />
                </g>
              </g>
            </>
          ) : null}

          <line
            x1={0}
            x2={W}
            y1={HALF}
            y2={HALF}
            stroke="var(--color-edge)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />

          {lines.map((line) => (
            <line
              key={line.group}
              x1={line.value * W}
              x2={line.value * W}
              y1={line.up === false ? HALF : 0}
              y2={line.up === true ? HALF : H}
              stroke={line.color}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {lines.map((line) => (
          <div
            key={line.group}
            aria-hidden="true"
            onPointerDown={startDrag(line.group)}
            className="absolute w-7 -translate-x-1/2 cursor-ew-resize"
            style={{
              left: `${line.value * 100}%`,
              top: line.up === false ? '50%' : 0,
              bottom: line.up === true ? '50%' : 0,
            }}
          >
            <span
              className="absolute left-1/2 h-[7px] w-[7px] -translate-x-1/2 rounded-[1px]"
              style={{
                background: line.color,
                [line.up === false ? 'bottom' : 'top']: 0,
              }}
            />
          </div>
        ))}
      </div>

      <div className="relative mt-2 h-6">
        {TICKS.map((t, i) => (
          <span
            key={t}
            className="absolute top-0 flex flex-col items-center gap-1.5"
            style={{
              left: `${t * 100}%`,
              transform:
                i === 0
                  ? 'none'
                  : i === TICKS.length - 1
                    ? 'translateX(-100%)'
                    : 'translateX(-50%)',
            }}
          >
            <span className="h-1.5 w-px bg-edge" />
            <span className="n-xs text-dim">{t.toFixed(2)}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
