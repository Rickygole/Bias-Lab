import AnimatedNumber from './AnimatedNumber.jsx'
import { count, percent } from '../lib/format.js'

const COLUMNS = 25
const ROWS = 4

function UnitChart({ fraction, color }) {
  const filled = fraction === null || fraction === undefined ? -1 : Math.round(fraction * 100)
  return (
    <div
      className="mt-2.5 grid gap-[2px]"
      style={{ gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))` }}
      aria-hidden="true"
    >
      {Array.from({ length: COLUMNS * ROWS }, (_, i) => (
        <span
          key={i}
          className="aspect-square rounded-[1px] transition-colors duration-150 ease-out"
          style={{ background: i < filled ? color : 'var(--color-hair)' }}
        />
      ))}
    </div>
  )
}

function Row({ cost, name, color, qualifiedLabel }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="flex min-w-0 items-center gap-2">
          <span className="swatch" style={{ background: color }} />
          <span className="note truncate text-ink">{name}</span>
        </span>
        <AnimatedNumber
          value={cost?.missRate ?? null}
          format={(v) => percent(v, 1)}
          className="n-md text-ink"
          blankWidth={22}
        />
      </div>

      <UnitChart fraction={cost?.missRate ?? null} color={color} />

      <p className="note mt-2 text-muted">
        <AnimatedNumber value={cost?.deniedButQualified ?? null} format={count} className="num text-ink" blankWidth={14} />
        {' of '}
        <AnimatedNumber value={cost?.qualified ?? null} format={count} className="num text-ink" blankWidth={14} />
        {` people who ${qualifiedLabel} were turned away.`}
      </p>
    </div>
  )
}

export default function HumanCost({ costs, groupNames, qualifiedLabel }) {
  return (
    <div className="flex flex-col gap-5">
      <Row
        cost={costs?.[0] ?? null}
        name={groupNames[0]}
        color="var(--color-groupA)"
        qualifiedLabel={qualifiedLabel}
      />
      <Row
        cost={costs?.[1] ?? null}
        name={groupNames[1]}
        color="var(--color-groupB)"
        qualifiedLabel={qualifiedLabel}
      />
    </div>
  )
}
