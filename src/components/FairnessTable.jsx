import { useEffect, useRef, useState } from 'react'
import AnimatedNumber from './AnimatedNumber.jsx'
import Pending from './Pending.jsx'
import { percent } from '../lib/format.js'

const MAX_GAP = 0.6

function GapBar({ values, interval }) {
  const [a, b] = values
  if (a === null || b === null) return <div className="h-4" />

  const signed = b - a
  const magnitude = Math.min(1, Math.abs(signed) / MAX_GAP)
  const color = signed >= 0 ? 'var(--color-groupB)' : 'var(--color-groupA)'
  const uncertain = interval !== null && interval !== undefined && !interval.separated
  const margin = interval ? Math.min(1, interval.margin / MAX_GAP) * 50 : 0

  return (
    <div className="relative h-4 w-full">
      <div className="absolute inset-y-0 left-1/2 w-px bg-edge" />
      <div
        className="absolute top-1/2 h-2 -translate-y-1/2 rounded-[1px] transition-all duration-200"
        style={{
          background: color,
          opacity: uncertain ? 0.35 : 1,
          width: `${magnitude * 50}%`,
          left: signed >= 0 ? '50%' : undefined,
          right: signed < 0 ? '50%' : undefined,
        }}
      />
      {interval ? (
        <div
          className="absolute top-1/2 h-px -translate-y-1/2 transition-all duration-200"
          style={{
            background: 'var(--color-muted)',
            width: `${margin * 2}%`,
            left: signed >= 0 ? `${50 + magnitude * 50 - margin}%` : undefined,
            right: signed < 0 ? `${50 + magnitude * 50 - margin}%` : undefined,
          }}
        />
      ) : null}
    </div>
  )
}

function Row({ definition }) {
  const interval = definition.interval
  const uncertain = interval && !interval.separated

  return (
    <tr>
      <td className="py-2.5 pr-4 align-middle">
        <div className="leading-tight font-medium">{definition.name}</div>
        <div className="text-[11px] leading-tight text-muted">{definition.question}</div>
      </td>
      <td className="num w-16 py-2.5 pl-3 text-right align-middle text-muted">
        <AnimatedNumber value={definition.values[0]} format={(v) => percent(v, 1)} />
      </td>
      <td className="num w-16 py-2.5 pl-3 text-right align-middle text-muted">
        <AnimatedNumber value={definition.values[1]} format={(v) => percent(v, 1)} />
      </td>
      <td className="w-24 py-2.5 pl-4 align-middle">
        <GapBar values={definition.values} interval={interval} />
      </td>
      <td className="w-20 py-2.5 pl-2 text-right align-middle">
        <AnimatedNumber
          value={definition.gap}
          format={(v) => percent(v, 1)}
          className={`num text-[16px] ${uncertain ? 'text-muted' : 'text-ink'}`}
        />
        {uncertain ? <div className="text-[11px] leading-tight text-muted">not certain</div> : null}
      </td>
    </tr>
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

export default function FairnessTable({ result, groupNames }) {
  const sentence = useTradeSentence(result?.definitions)

  if (!result) {
    return (
      <Pending>Six definitions of fairness, every one of them visible at the same time.</Pending>
    )
  }

  const live = result.definitions.filter((d) => d.live)
  const stat = result.definitions.filter((d) => !d.live)

  return (
    <div className="flex h-full flex-col">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-edge">
            <th className="label pr-4 pb-2 text-left font-normal">Definition</th>
            <th className="label w-16 pb-2 pl-3 text-right font-normal">{groupNames[0]}</th>
            <th className="label w-16 pb-2 pl-3 text-right font-normal">{groupNames[1]}</th>
            <th className="label w-24 pb-2 pl-4 text-left font-normal">
              <span className="sr-only">Gap direction</span>
            </th>
            <th className="label w-20 pb-2 pl-2 text-right font-normal text-ink">Gap</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-edge">
          {live.map((d) => (
            <Row key={d.key} definition={d} />
          ))}
        </tbody>
        {stat.length ? (
          <tbody className="divide-y divide-edge border-t border-edge">
            <tr>
              <td colSpan={5} className="label pt-4 pb-2">
                Does not move with the threshold
              </td>
            </tr>
            {stat.map((d) => (
              <Row key={d.key} definition={d} />
            ))}
          </tbody>
        ) : null}
      </table>

      <div className="mt-4 grid gap-x-6 gap-y-2 text-[11px] leading-snug text-muted lg:grid-cols-2">
        <p>
          Calibration is a property of the scores, not the threshold, so it holds still while you
          drag. It is why the rows above cannot all reach zero at once.
        </p>
        <p>
          The thin line on each bar is a 95 percent interval. Where it crosses the centre the gap is
          marked not certain: this test set is too small to tell it apart from zero. A gap you cannot
          measure is not a gap that is not there.
        </p>
      </div>

      <p className="mt-auto border-t border-edge pt-4 leading-relaxed">
        {sentence ?? 'Move the threshold and watch which gaps trade against each other.'}
      </p>
    </div>
  )
}
