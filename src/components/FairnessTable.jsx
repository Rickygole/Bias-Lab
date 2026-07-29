import { useEffect, useRef, useState } from 'react'
import AnimatedNumber from './AnimatedNumber.jsx'
import { percent } from '../lib/format.js'

const MAX_GAP = 0.6

function GapBar({ values }) {
  const [a, b] = values
  if (a === null || b === null) return <div className="h-4" />

  const signed = b - a
  const magnitude = Math.min(1, Math.abs(signed) / MAX_GAP)
  const color = signed >= 0 ? 'var(--color-groupB)' : 'var(--color-groupA)'

  return (
    <div className="relative h-4 w-full">
      <div className="absolute inset-y-0 left-1/2 w-px bg-edge" />
      <div
        className="absolute top-1/2 h-[6px] -translate-y-1/2 rounded-[1px] transition-all duration-200"
        style={{
          background: color,
          width: `${magnitude * 50}%`,
          left: signed >= 0 ? '50%' : undefined,
          right: signed < 0 ? '50%' : undefined,
        }}
      />
    </div>
  )
}

function Row({ definition, dim }) {
  return (
    <tr className={dim ? 'opacity-60' : undefined}>
      <td className="py-2 pr-3 align-middle">
        <div className="text-[13px] leading-tight">{definition.name}</div>
        <div className="text-[11px] leading-tight text-muted">{definition.question}</div>
      </td>
      <td className="num w-20 py-2 text-right align-middle text-[13px]">
        <AnimatedNumber value={definition.values[0]} format={(v) => percent(v, 1)} />
      </td>
      <td className="num w-20 py-2 text-right align-middle text-[13px]">
        <AnimatedNumber value={definition.values[1]} format={(v) => percent(v, 1)} />
      </td>
      <td className="w-32 py-2 pl-4 align-middle">
        <GapBar values={definition.values} />
      </td>
      <td className="num w-16 py-2 pl-2 text-right align-middle text-[13px]">
        <AnimatedNumber value={definition.gap} format={(v) => percent(v, 1)} />
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
      definitions.filter((d) => d.live && d.gap !== null).map((d) => [d.key, { gap: d.gap, name: d.name }]),
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
      <div className="flex h-full items-center justify-center text-[13px] text-muted">
        Train the model to see all four definitions at once.
      </div>
    )
  }

  const live = result.definitions.filter((d) => d.live)
  const stat = result.definitions.filter((d) => !d.live)

  return (
    <div className="flex h-full flex-col">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-edge">
            <th className="label pb-2 text-left font-normal">Definition</th>
            <th className="label pb-2 text-right font-normal">{groupNames[0]}</th>
            <th className="label pb-2 text-right font-normal">{groupNames[1]}</th>
            <th className="label pb-2 pl-4 text-left font-normal">Gap</th>
            <th className="label pb-2 pl-2 text-right font-normal" />
          </tr>
        </thead>
        <tbody className="divide-y divide-edge">
          {live.map((d) => (
            <Row key={d.key} definition={d} />
          ))}
          {stat.map((d) => (
            <Row key={d.key} definition={d} dim />
          ))}
        </tbody>
      </table>

      <p className="mt-3 text-[11px] leading-snug text-muted">
        Calibration is a property of the scores, not of the threshold, so it does not move when you
        drag. It is the reason the rows above cannot all reach zero at once.
      </p>

      <p className="mt-auto pt-3 text-[13px] italic leading-snug text-muted">
        {sentence ?? 'Move the threshold and watch which gaps trade against each other.'}
      </p>
    </div>
  )
}
