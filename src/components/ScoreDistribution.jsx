import { useCallback, useEffect, useMemo, useRef } from 'react'
import { percent } from '../lib/format.js'
import GroupTag from './GroupTag.jsx'

const GRID = 100
const W = 100
const H = 100
const FILL = 0.9
const SCRIM = 0.72
const EDGE_DIM = 0.42
const GUIDES = [0.25, 0.5, 0.75]
const TICKS = [0, 0.25, 0.5, 0.75, 1]

function shareAtOrAbove(scores, groups, group) {
  const reach = new Array(GRID + 1).fill(0)
  let total = 0
  for (let i = 0; i < scores.length; i++) {
    if (groups[i] !== group) continue
    const value = scores[i]
    if (!Number.isFinite(value)) continue
    total++
    reach[Math.min(GRID, Math.max(0, Math.floor(value * GRID)))]++
  }

  const share = new Array(GRID + 1).fill(0)
  let running = 0
  for (let k = GRID; k >= 0; k--) {
    running += reach[k]
    share[k] = total === 0 ? 0 : running / total
  }
  return share
}

function points(share) {
  return share.map((value, k) => [(k / GRID) * W, (1 - value) * H])
}

function line(pts) {
  return pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ')
}

function area(pts) {
  return `M0 ${H} ${pts.map((p) => `L${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ')} L${W} ${H} Z`
}

function band(outer, inner) {
  const back = inner
    .slice()
    .reverse()
    .map((p) => `L${p[0].toFixed(2)} ${p[1].toFixed(2)}`)
    .join(' ')
  return `${line(outer)} ${back} Z`
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

  const curves = useMemo(() => {
    if (!scores || !groups) return null
    const a = shareAtOrAbove(scores, groups, 0)
    const b = shareAtOrAbove(scores, groups, 1)
    const pa = points(a)
    const pb = points(b)
    return {
      a,
      b,
      areaA: area(pa),
      areaB: area(pb),
      lineA: line(pa),
      lineB: line(pb),
      gap: band(pa, pb),
    }
  }, [scores, groups])

  const cut = [thresholds[0], splitMode ? thresholds[1] : thresholds[0]]
  const value = curves
    ? [curves.a[Math.round(cut[0] * GRID)], curves.b[Math.round(cut[1] * GRID)]]
    : [null, null]

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
      const next = positionFromEvent(event)
      if (next !== null) onThreshold(dragging.current, Math.round(next * 100) / 100)
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
    const next = positionFromEvent(event)
    if (next !== null) onThreshold(group, Math.round(next * 100) / 100)
  }

  const lines = splitMode
    ? [
        { group: 0, value: cut[0], color: 'var(--color-groupA)' },
        { group: 1, value: cut[1], color: 'var(--color-groupB)' },
      ]
    : [{ group: 0, value: cut[0], color: 'var(--color-ink)' }]

  const lower = Math.min(cut[0], cut[1])
  const upper = Math.max(cut[0], cut[1])
  const middleClip = cut[1] < cut[0] ? 'url(#cut-gap)' : 'url(#cut-under-b)'

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-6">
        <GroupTag
          name={`${groupNames[0]}${value[0] === null ? '' : ` ${percent(value[0], 0)} approved`}`}
          color="var(--color-groupA)"
        />
        <GroupTag
          name={`${groupNames[1]}${value[1] === null ? '' : ` ${percent(value[1], 0)} approved`}`}
          color="var(--color-groupB)"
        />
      </div>

      <div ref={boxRef} className="relative min-h-[132px] flex-1 touch-none select-none">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          {GUIDES.map((g) => (
            <line
              key={g}
              x1={0}
              x2={W}
              y1={(1 - g) * H}
              y2={(1 - g) * H}
              stroke="var(--color-hair)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {curves ? (
            <>
              <defs>
                <clipPath id="cut-gap">
                  <path d={curves.gap} />
                </clipPath>
                <clipPath id="cut-under-b">
                  <path d={curves.areaB} />
                </clipPath>
                <clipPath id="cut-lit-a">
                  <rect x={cut[0] * W} y={0} width={W} height={H} />
                </clipPath>
                <clipPath id="cut-lit-b">
                  <rect x={cut[1] * W} y={0} width={W} height={H} />
                </clipPath>
              </defs>

              <g className="rise-up" style={{ '--rise-origin': '100%' }}>
                <path d={curves.areaA} fill="var(--color-groupA)" opacity={FILL} />
                <path d={curves.areaB} fill="var(--color-groupB)" opacity={FILL} />

                <rect
                  x={0}
                  y={0}
                  width={lower * W}
                  height={H}
                  fill="var(--color-panel)"
                  opacity={SCRIM}
                />
                {upper > lower ? (
                  <rect
                    x={lower * W}
                    y={0}
                    width={(upper - lower) * W}
                    height={H}
                    fill="var(--color-panel)"
                    opacity={SCRIM}
                    clipPath={middleClip}
                  />
                ) : null}

                <g opacity={EDGE_DIM}>
                  <path
                    d={curves.lineA}
                    fill="none"
                    stroke="var(--color-groupA)"
                    strokeWidth={1.5}
                    vectorEffect="non-scaling-stroke"
                  />
                  <path
                    d={curves.lineB}
                    fill="none"
                    stroke="var(--color-groupB)"
                    strokeWidth={1.5}
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
                <path
                  d={curves.lineA}
                  fill="none"
                  stroke="var(--color-groupA)"
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                  clipPath="url(#cut-lit-a)"
                />
                <path
                  d={curves.lineB}
                  fill="none"
                  stroke="var(--color-groupB)"
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                  clipPath="url(#cut-lit-b)"
                />
              </g>
            </>
          ) : null}

          <line
            x1={0}
            x2={W}
            y1={H}
            y2={H}
            stroke="var(--color-edge)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />

          {lines.map((cutLine) => (
            <line
              key={cutLine.group}
              x1={cutLine.value * W}
              x2={cutLine.value * W}
              y1={0}
              y2={H}
              stroke={cutLine.color}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        <span
          aria-hidden="true"
          className="n-xs pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 bg-panel pl-1 text-dim"
        >
          50%
        </span>

        {lines.map((cutLine) => (
          <div
            key={cutLine.group}
            aria-hidden="true"
            onPointerDown={startDrag(cutLine.group)}
            className="absolute inset-y-0 w-7 -translate-x-1/2 cursor-ew-resize"
            style={{ left: `${cutLine.value * 100}%` }}
          />
        ))}

        {[0, 1].map((group) =>
          value[group] === null ? null : (
            <span
              key={group}
              aria-hidden="true"
              className="pointer-events-none absolute h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-panel"
              style={{
                background: group === 0 ? 'var(--color-groupA)' : 'var(--color-groupB)',
                left: `${cut[group] * 100}%`,
                top: `${(1 - value[group]) * 100}%`,
              }}
            />
          ),
        )}
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
