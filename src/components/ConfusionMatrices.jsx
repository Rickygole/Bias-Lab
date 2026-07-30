import AnimatedNumber from './AnimatedNumber.jsx'
import { count } from '../lib/format.js'

function Cell({ value, harm }) {
  return (
    <td className="py-2 pl-4 text-right align-baseline">
      <AnimatedNumber
        value={value}
        format={count}
        className={`n-md ${harm ? 'text-ink' : 'text-muted'}`}
        blankWidth={16}
      />
    </td>
  )
}

function Block({ matrix, name, color, outcomes, first }) {
  return (
    <tbody>
      <tr>
        <th
          scope="colgroup"
          colSpan={3}
          className={`pb-2 text-left font-normal ${first ? 'pt-0' : 'pt-3'}`}
        >
          <span className="flex items-center gap-2">
            <span className="swatch" style={{ background: color }} />
            <span className="note text-ink">{name}</span>
          </span>
        </th>
      </tr>
      <tr className="border-t border-hair">
        <th scope="row" className="note py-2 pr-2 text-left font-normal whitespace-nowrap text-muted">
          {outcomes.actual[0]}
        </th>
        <Cell value={matrix?.tp ?? null} />
        <Cell value={matrix?.fn ?? null} harm />
      </tr>
      <tr className="border-t border-hair">
        <th scope="row" className="note py-2 pr-2 text-left font-normal whitespace-nowrap text-muted">
          {outcomes.actual[1]}
        </th>
        <Cell value={matrix?.fp ?? null} harm />
        <Cell value={matrix?.tn ?? null} />
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
