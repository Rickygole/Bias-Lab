import AnimatedNumber from './AnimatedNumber.jsx'
import { count, percent } from '../lib/format.js'

function Cell({ value, share, harm }) {
  return (
    <td className="py-2.5 pl-4 align-baseline">
      <div className="flex items-baseline justify-end gap-2">
        <AnimatedNumber
          value={value}
          format={count}
          className={`n-md ${harm ? 'text-ink' : 'text-dim'}`}
          blankWidth={16}
        />
        <span className="n-xs w-7 shrink-0 text-right text-dim">{percent(share, 0)}</span>
      </div>
    </td>
  )
}

function Block({ matrix, name, color, outcomes, first }) {
  const n = matrix?.n ?? 0
  const share = (key) => (matrix && n > 0 ? matrix[key] / n : null)

  return (
    <tbody>
      <tr>
        <th
          scope="colgroup"
          colSpan={3}
          className={`pb-2 text-left font-normal ${first ? 'pt-0' : 'pt-4'}`}
        >
          <span className="flex items-center gap-2">
            <span className="swatch" style={{ background: color }} />
            <span className="note text-ink">{name}</span>
          </span>
        </th>
      </tr>
      <tr className="border-t border-hair">
        <th scope="row" className="note py-2.5 pr-2 text-left font-normal whitespace-nowrap text-muted">
          {outcomes.actual[0]}
        </th>
        <Cell value={matrix?.tp ?? null} share={share('tp')} />
        <Cell value={matrix?.fn ?? null} share={share('fn')} harm />
      </tr>
      <tr className="border-t border-hair">
        <th scope="row" className="note py-2.5 pr-2 text-left font-normal whitespace-nowrap text-muted">
          {outcomes.actual[1]}
        </th>
        <Cell value={matrix?.fp ?? null} share={share('fp')} harm />
        <Cell value={matrix?.tn ?? null} share={share('tn')} />
      </tr>
    </tbody>
  )
}

export default function ConfusionMatrices({ matrices, groupNames, outcomes }) {
  return (
    <table className="w-full border-collapse">
      <caption className="sr-only">
        Counts of each outcome for both groups at the current threshold
      </caption>
      <thead>
        <tr className="border-b border-edge">
          <th className="label pb-2 text-left font-medium">Outcome</th>
          <th className="label pb-2 pl-4 text-right font-medium text-ink">
            {outcomes.predicted[0]}
          </th>
          <th className="label pb-2 pl-4 text-right font-medium text-ink">
            {outcomes.predicted[1]}
          </th>
        </tr>
      </thead>
      <Block
        first
        matrix={matrices?.[0] ?? null}
        name={groupNames[0]}
        color="var(--color-groupA)"
        outcomes={outcomes}
      />
      <Block
        matrix={matrices?.[1] ?? null}
        name={groupNames[1]}
        color="var(--color-groupB)"
        outcomes={outcomes}
      />
    </table>
  )
}
