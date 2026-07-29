import AnimatedNumber from './AnimatedNumber.jsx'
import { count, percent } from '../lib/format.js'

function DotGrid({ fraction, color }) {
  const filled = Math.round((fraction ?? 0) * 100)
  return (
    <div className="mt-3 grid grid-cols-20 gap-[2px]" style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }}>
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
      <div className="mb-2 flex items-center gap-2">
        <span className="h-2 w-2 rounded-[1px]" style={{ background: color }} />
        <span className="text-[11px] text-muted">{name}</span>
      </div>

      <div className="flex items-baseline gap-2">
        <AnimatedNumber
          value={cost.deniedButQualified}
          format={count}
          className="num text-[28px] leading-none"
        />
        <span className="num text-[13px] text-muted">
          of <AnimatedNumber value={cost.qualified} format={count} />
        </span>
      </div>

      <p className="mt-1 text-[12px] leading-snug text-muted">
        people who {qualifiedLabel} were denied. That is{' '}
        <span className="num">{percent(cost.missRate, 1)}</span> of them.
      </p>

      <DotGrid fraction={cost.missRate} color={color} />
    </div>
  )
}

export default function HumanCost({ costs, groupNames, qualifiedLabel }) {
  if (!costs) {
    return (
      <div className="flex h-full items-center justify-center text-[13px] text-muted">
        Train the model to see who absorbs the errors.
      </div>
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
