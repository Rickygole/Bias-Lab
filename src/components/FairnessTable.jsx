import { useEffect, useRef, useState } from 'react'
import AnimatedNumber from './AnimatedNumber.jsx'
import { percent, points } from '../lib/format.js'

const MAX_GAP = 0.4

function GapBar({ values, interval }) {
  const [a, b] = values
  if (a === null || b === null || a === undefined || b === undefined) {
    return (
      <div className="relative h-4 w-full" aria-hidden="true">
        <div className="absolute inset-y-1 left-1/2 w-px bg-edge" />
      </div>
    )
  }

  const signed = b - a
  const magnitude = Math.min(1, Math.abs(signed) / MAX_GAP)
  const color = signed >= 0 ? 'var(--color-groupB)' : 'var(--color-groupA)'
  const uncertain = interval !== null && interval !== undefined && !interval.separated
  const margin = interval ? Math.min(1, interval.margin / MAX_GAP) * 50 : 0
  const side = signed >= 0 ? 'left' : 'right'

  return (
    <div className="relative h-4 w-full" aria-hidden="true">
      <div className="absolute inset-y-0 left-1/2 w-px bg-edge" />
      <div
        className="absolute top-1/2 h-[7px] -translate-y-1/2 transition-all duration-200 ease-out"
        style={{
          background: uncertain ? 'transparent' : color,
          boxShadow: uncertain ? `inset 0 0 0 1px ${color}` : 'none',
          opacity: uncertain ? 0.7 : 1,
          width: `${magnitude * 50}%`,
          [side]: '50%',
        }}
      />
      {interval ? (
        <div
          className="absolute top-1/2 h-px -translate-y-1/2 bg-dim transition-all duration-200 ease-out"
          style={{
            width: `${margin * 2}%`,
            [side]: `${50 + magnitude * 50 - margin}%`,
          }}
        />
      ) : null}
    </div>
  )
}

function Row({ definition, family, variant, tail }) {
  const interval = definition.interval
  const uncertain = interval && !interval.separated

  return (
    <tr className={tail ? '' : 'border-b border-hair'}>
      <td className="py-2.5 pr-4 align-top">
        <div className="leading-[19px]">
          {family ? <span className="font-medium text-ink">{family}</span> : null}
          {variant ? (
            <span className={family ? 'text-muted' : 'pl-4 text-muted'}>
              {family ? ', ' : ''}
              {variant}
            </span>
          ) : null}
        </div>
        <div className="note text-dim">{definition.question}</div>
      </td>
      <td className="n-sm w-[92px] py-2.5 pl-3 text-right align-baseline text-muted">
        <AnimatedNumber value={definition.values[0]} format={(v) => percent(v, 1)} blankWidth={14} />
      </td>
      <td className="n-sm w-[92px] py-2.5 pl-3 text-right align-baseline text-muted">
        <AnimatedNumber value={definition.values[1]} format={(v) => percent(v, 1)} blankWidth={14} />
      </td>
      <td className="hidden w-[150px] py-2.5 pl-5 align-middle sm:table-cell">
        <GapBar values={definition.values} interval={interval} />
      </td>
      <td className="hidden w-[124px] py-2.5 pl-4 text-right align-baseline whitespace-nowrap sm:table-cell">
        {interval ? (
          <span className="n-xs text-dim">
            {`± ${points(interval.margin, 1)}`}
            {uncertain ? <span className="pl-2 text-muted">not certain</span> : null}
          </span>
        ) : null}
      </td>
      <td className="w-[100px] py-2.5 pl-4 text-right align-baseline">
        <AnimatedNumber
          value={definition.gap}
          format={(v) => percent(v, 1)}
          blankWidth={22}
          className={`n-md ${uncertain ? 'text-muted' : 'text-ink'}`}
        />
      </td>
    </tr>
  )
}

function rowsFor(definitions) {
  return definitions.map((d) => {
    const [family, variant] = d.name.split(', ')
    return { d, family, variant: variant ?? null }
  })
}

function ColumnHead({ name, color }) {
  return (
    <th scope="col" className="w-[92px] pb-2.5 pl-3 align-bottom font-medium">
      <div className="flex min-h-7 flex-col items-end justify-end gap-1">
        <span className="swatch" style={{ background: color }} />
        <span className="label text-right leading-[13px] normal-case tracking-normal">{name}</span>
      </div>
    </th>
  )
}

function useTradeSentence(definitions) {
  const previous = useRef(null)
  const [sentence, setSentence] = useState(null)

  useEffect(() => {
    if (!definitions) {
      previous.current = null
      return
    }

    const current = Object.fromEntries(
      definitions
        .filter((d) => d.live && d.gap !== null)
        .map((d) => [d.key, { gap: d.gap, name: d.name }]),
    )

    const before = previous.current
    previous.current = current
    if (!before) return

    let improved = null
    let worsened = null

    for (const key of Object.keys(current)) {
      if (!before[key]) continue
      const delta = current[key].gap - before[key].gap
      if (delta < -0.005 && (!improved || delta < improved.delta)) {
        improved = { delta, name: current[key].name }
      }
      if (delta > 0.005 && (!worsened || delta > worsened.delta)) {
        worsened = { delta, name: current[key].name }
      }
    }

    if (improved && worsened) {
      setSentence(
        `${improved.name} improved. ${worsened.name} got worse. This trade is not avoidable here.`,
      )
    } else if (improved && !worsened) {
      setSentence(`${improved.name} improved and nothing else got worse. Keep going.`)
    } else if (worsened && !improved) {
      setSentence(`${worsened.name} got worse and nothing improved.`)
    }
  }, [definitions])

  return sentence
}

export default function FairnessTable({ definitions, groupNames, ready }) {
  const sentence = useTradeSentence(ready ? definitions : null)

  const moving = rowsFor(definitions.filter((d) => d.live))
  const fixed = rowsFor(definitions.filter((d) => !d.live))

  return (
    <div className="flex flex-1 flex-col">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-edge">
            <th className="label pb-2.5 pr-4 text-left font-medium text-ink">Definition</th>
            <ColumnHead name={groupNames[0]} color="var(--color-groupA)" />
            <ColumnHead name={groupNames[1]} color="var(--color-groupB)" />
            <th className="label hidden w-[150px] pb-2.5 pl-5 text-left font-medium sm:table-cell">
              <span className="sr-only">Gap direction</span>
            </th>
            <th className="label hidden w-[124px] pb-2.5 pl-4 text-right font-medium sm:table-cell">
              95% interval
            </th>
            <th className="label w-[100px] pb-2.5 pl-4 text-right font-medium text-ink">Gap</th>
          </tr>
        </thead>
        <tbody>
          {moving.map(({ d, family, variant }, i) => (
            <Row
              key={d.key}
              definition={d}
              family={family}
              variant={variant}
              tail={i === moving.length - 1}
            />
          ))}
        </tbody>
        <tbody>
          <tr>
            <td colSpan={6} className="border-t border-edge pt-3.5 pb-2">
              <div className="label text-dim">Does not move with the threshold</div>
            </td>
          </tr>
          {fixed.map(({ d, family, variant }, i) => (
            <Row
              key={d.key}
              definition={d}
              family={family}
              variant={variant}
              tail={i === fixed.length - 1}
            />
          ))}
        </tbody>
      </table>

      <div className="mt-auto flex flex-col gap-2 pt-4 lg:flex-row lg:items-baseline lg:justify-between lg:gap-10">
        <p className="leading-[21px]">
          {sentence ?? 'Move the threshold and watch which gaps trade against each other.'}
        </p>
        <p className="note max-w-[46ch] shrink-0 text-dim">
          Bar direction shows which group is ahead. A gap marked not certain is one this test set is
          too small to measure, not one that is absent.
        </p>
      </div>
    </div>
  )
}
