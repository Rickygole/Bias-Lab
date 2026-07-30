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
      <td className="py-1.5 pr-6 align-baseline">
        <div className="grid items-baseline gap-x-6 sm:grid-cols-[minmax(0,264px)_minmax(0,1fr)]">
          <div className="leading-[19px]">
            {family ? <span className="font-medium text-ink">{family}</span> : null}
            {variant ? (
              <span className="text-muted">
                {family ? ', ' : ''}
                {variant}
              </span>
            ) : null}
          </div>
          <div className="note text-dim">{definition.question}</div>
        </div>
        <div className="mt-1 flex items-center gap-4 sm:hidden">
          <span className="flex items-center gap-1.5">
            <span className="swatch" style={{ background: 'var(--color-groupA)' }} />
            <AnimatedNumber
              value={definition.values[0]}
              format={(v) => percent(v, 1)}
              blankWidth={14}
              className="n-xs text-muted"
            />
          </span>
          <span className="flex items-center gap-1.5">
            <span className="swatch" style={{ background: 'var(--color-groupB)' }} />
            <AnimatedNumber
              value={definition.values[1]}
              format={(v) => percent(v, 1)}
              blankWidth={14}
              className="n-xs text-muted"
            />
          </span>
          {uncertain ? <span className="n-xs text-dim">not certain</span> : null}
        </div>
      </td>
      <td className="n-sm hidden w-[92px] py-1.5 pl-3 text-right align-baseline text-muted sm:table-cell">
        <AnimatedNumber value={definition.values[0]} format={(v) => percent(v, 1)} blankWidth={14} />
      </td>
      <td className="n-sm hidden w-[92px] py-1.5 pl-3 text-right align-baseline text-muted sm:table-cell">
        <AnimatedNumber value={definition.values[1]} format={(v) => percent(v, 1)} blankWidth={14} />
      </td>
      <td className="hidden w-[150px] py-1.5 pl-5 align-middle sm:table-cell">
        {definition.live ? <GapBar values={definition.values} interval={interval} /> : null}
      </td>
      <td className="w-[112px] py-1.5 pl-3 align-baseline whitespace-nowrap sm:w-[176px] sm:pl-4">
        <span className="flex items-baseline justify-end gap-3">
          {interval ? (
            <span className="n-xs hidden text-dim sm:inline">
              {uncertain ? 'not certain' : `± ${points(interval.margin, 1)}`}
            </span>
          ) : null}
          <AnimatedNumber
            value={definition.gap}
            format={(v) => percent(v, 1)}
            blankWidth={22}
            className={`n-md ${uncertain ? 'text-muted' : 'text-ink'}`}
          />
        </span>
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
    <th scope="col" className="hidden w-[92px] pb-2 pl-3 align-bottom font-medium sm:table-cell">
      <div className="flex min-h-7 flex-col items-end justify-end gap-1">
        <span className="swatch" style={{ background: color }} />
        <span className="label text-right leading-[13px] normal-case tracking-normal">{name}</span>
      </div>
    </th>
  )
}

const HOLLOW_GAP = 0.05
const HOLLOW_SELECTION = 0.15

export function hollowEquality(definitions, ready) {
  if (!ready) return null
  const live = definitions.filter((d) => d.live)
  if (!live.length || live.some((d) => d.gap === null)) return null
  if (Math.max(...live.map((d) => d.gap)) >= HOLLOW_GAP) return null

  const parity = definitions.find((d) => d.key === 'demographicParity')
  const [a, b] = parity?.values ?? []
  if (a === null || b === null || a === undefined || b === undefined) return null
  if (Math.max(a, b) >= HOLLOW_SELECTION) return null
  return [a, b]
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
  const hollow = hollowEquality(definitions, ready)

  return (
    <div className="flex flex-1 flex-col">
      <table className="w-full table-auto border-collapse lg:table-fixed">
        <thead>
          <tr className="border-b border-edge">
            <th className="label pb-2 pr-4 text-left font-medium text-ink">Definition</th>
            <ColumnHead name={groupNames[0]} color="var(--color-groupA)" />
            <ColumnHead name={groupNames[1]} color="var(--color-groupB)" />
            <th className="label hidden w-[150px] pb-2 pl-5 text-left font-medium sm:table-cell">
              <span className="sr-only">Gap direction</span>
            </th>
            <th className="label w-[112px] pb-2 pl-3 text-right font-medium text-ink sm:w-[176px] sm:pl-4">
              Gap
            </th>
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
            <td colSpan={5} className="border-t border-edge pt-3 pb-1.5">
              <div className="label whitespace-nowrap text-dim">Does not move with the threshold</div>
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

      <p className="mt-auto min-h-[21px] pt-3 leading-[21px]" aria-live="polite">
        {sentence}
      </p>
    </div>
  )
}
