import { useState } from 'react'
import { cards } from '../data/cards.js'
import ThresholdSlider from './ThresholdSlider.jsx'
import Segmented from './Segmented.jsx'
import { decimal, percent } from '../lib/format.js'

const modeOptions = [
  { value: false, label: 'Single threshold' },
  { value: true, label: 'Separate thresholds' },
]

function LossSparkline({ history, draw }) {
  if (history.length < 2) return <div className="h-10" />
  const values = history.map((h) => Math.log(Math.max(h.loss, 1e-6)))
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${40 - ((v - min) / span) * 36}`)
    .join(' ')

  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-10 w-full" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke="var(--color-groupA)"
        strokeWidth={1.2}
        vectorEffect="non-scaling-stroke"
        style={
          draw
            ? {
                strokeDasharray: 400,
                strokeDashoffset: 400,
                animation: 'draw-in 900ms ease-out forwards',
              }
            : undefined
        }
      />
    </svg>
  )
}

function DatasetCard({ datasetId, dataset }) {
  const [open, setOpen] = useState(false)
  const card = cards[datasetId]

  return (
    <div className="rounded-md border border-edge bg-panel p-4">
      <div className="label mb-2 text-ink">
        {dataset?.source === 'real' ? 'Real data' : 'Synthetic data'}
      </div>
      <p className="leading-relaxed text-muted">{card.short}</p>

      {open ? (
        <div className="mt-4 space-y-4 border-t border-edge pt-4">
          {card.full.map((paragraph, i) => (
            <p key={i} className="leading-relaxed text-muted">
              {paragraph}
            </p>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-4 rounded-[2px] text-[11px] text-muted underline underline-offset-4 transition-colors duration-150 hover:text-ink"
      >
        {open ? 'Show less' : 'Read the full card'}
      </button>
    </div>
  )
}

export default function LeftRail({
  datasetId,
  dataset,
  status,
  epoch,
  history,
  accuracy,
  auc,
  thresholds,
  splitMode,
  onThreshold,
  onSplitMode,
  onTour,
}) {
  const groupNames = dataset?.groupNames ?? ['Group A', 'Group B']
  const positive = dataset?.positiveLabel?.toLowerCase() ?? 'approved'

  return (
    <aside className="scroller flex w-full shrink-0 flex-col gap-4 border-edge p-6 lg:w-80 lg:overflow-y-auto lg:border-r">
      <DatasetCard datasetId={datasetId} dataset={dataset} />

      <div className="rounded-md border border-edge bg-panel p-4">
        {status === 'trained' ? (
          <div>
            <div className="mb-2 flex items-baseline justify-between gap-4">
              <span className="label text-ink">Trained</span>
              <span className="text-[11px] text-muted">training loss</span>
            </div>
            <LossSparkline history={history} draw />
            <div className="mt-4 flex justify-between text-[11px] text-muted">
              <span>
                Test accuracy <span className="num text-ink">{percent(accuracy, 1)}</span>
              </span>
              <span>
                AUC <span className="num text-ink">{decimal(auc, 3)}</span>
              </span>
            </div>
          </div>
        ) : status === 'training' ? (
          <div>
            <div className="mb-2 flex items-baseline justify-between gap-4">
              <span className="label text-ink">Training</span>
              <span className="text-[11px] text-muted">training loss</span>
            </div>
            <LossSparkline history={history} />
            <div className="mt-4 text-[11px] text-muted">
              epoch <span className="num text-ink">{epoch}</span>
            </div>
          </div>
        ) : (
          <div className="label text-muted">Loading dataset</div>
        )}
      </div>

      {status === 'trained' ? (
        <div className="flex flex-col gap-4 rounded-md border border-edge bg-panel p-4">
          {splitMode ? (
            <>
              <ThresholdSlider
                value={thresholds[0]}
                onChange={(v) => onThreshold(0, v)}
                color="var(--color-groupA)"
                label={groupNames[0]}
              />
              <ThresholdSlider
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
              caption={
                <>
                  Applicants scoring above <span className="num">{decimal(thresholds[0], 2)}</span>{' '}
                  are {positive}.
                </>
              }
            />
          )}

          <div className="border-t border-edge pt-4">
            <Segmented
              vertical
              label="Threshold mode"
              options={modeOptions}
              value={splitMode}
              onChange={onSplitMode}
            />
            <p className="mt-4 text-[11px] leading-snug text-muted">
              Setting a different bar for each group is illegal in some contexts and required for
              fairness in others.
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-auto hidden pt-4 lg:block">
        <p className="text-[11px] leading-snug text-muted">
          Six definitions, one threshold. You cannot satisfy them all at once.
        </p>
        <button
          type="button"
          onClick={onTour}
          className="mt-3 rounded-[2px] text-[11px] text-ink underline underline-offset-4 transition-colors duration-150 hover:text-muted"
        >
          Walk through it in six steps
        </button>
      </div>
    </aside>
  )
}
