import AnimatedNumber from './AnimatedNumber.jsx'
import Pending from './Pending.jsx'
import { count, percent } from '../lib/format.js'

const CELLS = [
  { key: 'tp', label: 'Approved and qualified', good: true },
  { key: 'fp', label: 'Approved, not qualified', good: false },
  { key: 'fn', label: 'Denied but qualified', good: false },
  { key: 'tn', label: 'Denied, not qualified', good: true },
]

function Matrix({ matrix, name, color }) {
  const peak = Math.max(matrix.tp, matrix.fp, matrix.fn, matrix.tn, 1)

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-4 flex items-center gap-2">
        <span className="h-2 w-2 rounded-[1px]" style={{ background: color }} />
        <span className="text-[11px] text-muted">{name}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {CELLS.map((cell) => {
          const value = matrix[cell.key]
          const weight = value / peak
          const tint = cell.good ? '61, 214, 140' : '255, 92, 92'
          return (
            <div
              key={cell.key}
              className="rounded-[3px] border border-edge p-2 transition-colors duration-200"
              style={{ background: `rgba(${tint}, ${0.05 + weight * 0.16})` }}
            >
              <AnimatedNumber
                value={value}
                format={count}
                className="num block text-[20px] leading-none"
              />
              <div className="num mt-2 text-[11px] text-muted">
                {percent(matrix.n === 0 ? null : value / matrix.n, 0)}
              </div>
              <div className="mt-2 text-[11px] leading-tight text-muted">{cell.label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ConfusionMatrices({ matrices, groupNames }) {
  if (!matrices) {
    return (
      <Pending>Four outcomes per group, counted on the test set.</Pending>
    )
  }

  return (
    <div className="flex h-full gap-6">
      <Matrix matrix={matrices[0]} name={groupNames[0]} color="var(--color-groupA)" />
      <Matrix matrix={matrices[1]} name={groupNames[1]} color="var(--color-groupB)" />
    </div>
  )
}
