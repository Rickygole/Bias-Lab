import AnimatedNumber from './AnimatedNumber.jsx'
import Pending from './Pending.jsx'
import { count, percent } from '../lib/format.js'

function DotGrid({ fraction, color }) {
  const filled = Math.round((fraction ?? 0) * 100)
  return (
    <div className="mt-4 grid max-w-[260px] grid-cols-10 gap-[2px]" aria-hidden="true">
      {Array.from({ length: 100 }, (_, i) => (
        <span
          key={i}
          className="aspect-square rounded-[1px] transition-colors duration-200"
          style={{ background: i < filled ? color : 'var(--color-edge)' }}
        />
      ))}
    </div>
  )
}

function Side({ cost, name, color, qualifiedLabel }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-4 flex items-center gap-2">
        <span className="h-2 w-2 rounded-[1px]" style={{ background: color }} />
        <span className="text-[11px] text-muted">{name}</span>
      </div>

      <div className="flex items-baseline gap-2">
        <AnimatedNumber
          value={cost.deniedButQualified}
          format={count}
          className="num text-[20px] leading-none"
        />
        <span className="num text-muted">
          of <AnimatedNumber value={cost.qualified} format={count} />
        </span>
      </div>

      <p className="mt-2 leading-snug text-muted">
        people who {qualifiedLabel} were denied. That is{' '}
        <span className="num text-ink">{percent(cost.missRate, 1)}</span> of them.
      </p>

      <DotGrid fraction={cost.missRate} color={color} />
    </div>
  )
}

export default function HumanCost({ costs, groupNames, qualifiedLabel }) {
  if (!costs) {
    return (
      <Pending>
        One hundred squares per group, filled to the share of qualified people turned away.
      </Pending>
    )
  }

  return (
    <div className="flex h-full gap-6">
      <Side
        cost={costs[0]}
        name={groupNames[0]}
        color="var(--color-groupA)"
        qualifiedLabel={qualifiedLabel}
      />
      <Side
        cost={costs[1]}
        name={groupNames[1]}
        color="var(--color-groupB)"
        qualifiedLabel={qualifiedLabel}
      />
    </div>
  )
}
