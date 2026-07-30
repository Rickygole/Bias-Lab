import { useState } from 'react'
import { cards } from '../data/cards.js'
import ThresholdSlider from './ThresholdSlider.jsx'
import Segmented from './Segmented.jsx'
import AnimatedNumber from './AnimatedNumber.jsx'
import { count, decimal, percent } from '../lib/format.js'

const CHANCE = Math.LN2
const CURVE_W = 100
const CURVE_H = 34

const modeOptions = [
  { value: false, label: 'Single threshold' },
  { value: true, label: 'Separate thresholds' },
]

function Card({ title, note, children, className = '' }) {
  return (
    <section className={`plate px-4 pt-3 pb-3.5 ${className}`}>
      <header className="flex items-baseline justify-between gap-3 border-b border-edge pb-2.5">
        <h2 className="label text-ink">{title}</h2>
        {note ? <span className="note text-dim">{note}</span> : null}
      </header>
      <div className="pt-3.5">{children}</div>
    </section>
  )
}

function LossCurve({ history, epochs }) {
  const span = Math.log1p(epochs)
  const series = [{ epoch: 0, loss: CHANCE }, ...history]
  const points = series
    .map((h) => {
      const x = Math.min(1, Math.log1p(h.epoch) / span) * CURVE_W
      const y = CURVE_H - Math.min(1, Math.max(0, h.loss / CHANCE)) * CURVE_H
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  return (
    <svg
      viewBox={`0 0 ${CURVE_W} ${CURVE_H}`}
      preserveAspectRatio="none"
      className="h-[34px] w-full"
      aria-hidden="true"
    >
      <line
        x1={0}
        x2={CURVE_W}
        y1={0.5}
        y2={0.5}
        stroke="var(--color-edge)"
        strokeWidth={1}
        strokeDasharray="2 3"
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1={0}
        x2={CURVE_W}
        y1={CURVE_H - 0.5}
        y2={CURVE_H - 0.5}
        stroke="var(--color-edge)"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      {series.length > 1 ? (
        <polyline
          points={points}
          fill="none"
          stroke="var(--color-groupA)"
          strokeWidth={1.25}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
    </svg>
  )
}

function DatasetCard({ datasetId, dataset }) {
  const [open, setOpen] = useState(false)
  const card = cards[datasetId]

  return (
    <Card
      title={dataset ? (dataset.source === 'real' ? 'Real data' : 'Synthetic data') : 'Dataset'}
      note={dataset?.groupAttribute}
    >
      <p className="read">{card.short}</p>

      {open ? (
        <div className="mt-3.5 space-y-3 border-t border-hair pt-3.5">
          {card.full.map((paragraph, i) => (
            <p key={i} className="read">
              {paragraph}
            </p>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="link note mt-3.5 inline-block"
      >
        {open ? 'Show less' : 'Read the full card'}
      </button>
    </Card>
  )
}

function CompositionCard({ composition, groupNames, qualifiedLabel }) {
  const total = composition ? composition[0].n + composition[1].n : null

  return (
    <Card title="Test set" note={total === null ? null : `${count(total)} people`}>
      <div className="flex flex-col gap-3">
        {[0, 1].map((g) => {
          const color = g === 0 ? 'var(--color-groupA)' : 'var(--color-groupB)'
          const rate = composition?.[g].baseRate ?? null
          return (
            <div key={g}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="swatch" style={{ background: color }} />
                  <span className="note truncate text-ink">{groupNames[g]}</span>
                </span>
                <AnimatedNumber
                  value={composition?.[g].n ?? null}
                  format={count}
                  className="n-xs text-dim"
                  blankWidth={20}
                />
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="h-[5px] flex-1 bg-edge">
                  <span
                    className="block h-[5px] transition-[width] duration-300 ease-out"
                    style={{ width: `${(rate ?? 0) * 100}%`, background: color }}
                  />
                </span>
                <AnimatedNumber
                  value={rate}
                  format={(v) => percent(v, 1)}
                  className="n-sm w-12 text-right text-ink"
                  blankWidth={20}
                />
              </div>
            </div>
          )
        })}
      </div>

      <p className="note mt-3 text-dim">Share of each group who {qualifiedLabel}.</p>
    </Card>
  )
}

function ModelCard({ status, epoch, epochs, history, auc }) {
  const last = history.at(-1)?.loss ?? null

  return (
    <Card
      title="Model"
      note={status === 'trained' ? `${count(epochs)} epochs` : `epoch ${count(epoch)}`}
    >
      <LossCurve history={history} epochs={epochs} />

      <div className="mt-2 flex items-baseline justify-between gap-3">
        <span className="note text-dim">Loss</span>
        <span className="n-xs text-muted">
          {decimal(CHANCE, 3)}
          <span className="px-1 text-dim">to</span>
          <span className="text-ink">{last === null ? decimal(CHANCE, 3) : decimal(last, 3)}</span>
        </span>
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-3">
        <span className="note text-dim">AUC</span>
        <AnimatedNumber
          value={auc}
          format={(v) => decimal(v, 3)}
          className="n-xs text-ink"
          blankWidth={26}
        />
      </div>
    </Card>
  )
}

export default function LeftRail({
  datasetId,
  dataset,
  composition,
  status,
  epoch,
  epochs,
  history,
  auc,
  thresholds,
  splitMode,
  onThreshold,
  onSplitMode,
}) {
  const groupNames = dataset?.groupNames ?? ['Group A', 'Group B']
  const qualifiedLabel = dataset?.qualifiedLabel ?? 'qualify'

  return (
    <aside className="scroller order-last flex w-full min-w-0 max-w-full shrink-0 flex-col gap-3 border-edge px-4 py-4 sm:px-6 lg:order-none lg:w-[340px] lg:overflow-y-auto lg:border-r lg:px-5">
      <DatasetCard datasetId={datasetId} dataset={dataset} />

      <CompositionCard
        composition={composition}
        groupNames={groupNames}
        qualifiedLabel={qualifiedLabel}
      />

      <Card title="Decision" note="the only control">
        <div className="hidden flex-col gap-4 pb-4 lg:flex">
          {splitMode ? (
            <>
              <ThresholdSlider
                swatch
                value={thresholds[0]}
                onChange={(v) => onThreshold(0, v)}
                color="var(--color-groupA)"
                label={groupNames[0]}
              />
              <ThresholdSlider
                swatch
                value={thresholds[1]}
                onChange={(v) => onThreshold(1, v)}
                color="var(--color-groupB)"
                label={groupNames[1]}
              />
            </>
          ) : (
            <ThresholdSlider
              value={thresholds[0]}
              onChange={(v) => onThreshold(0, v)}
              color="var(--color-ink)"
              label="Threshold"
            />
          )}
        </div>

        <div className="lg:border-t lg:border-hair lg:pt-4">
          <Segmented
            vertical
            label="Threshold mode"
            options={modeOptions}
            value={splitMode}
            onChange={onSplitMode}
          />
        </div>
      </Card>

      <ModelCard status={status} epoch={epoch} epochs={epochs} history={history} auc={auc} />
    </aside>
  )
}
