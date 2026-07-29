import { useState } from 'react'
import { cards } from '../data/cards.js'
import ThresholdSlider from './ThresholdSlider.jsx'
import { decimal, percent } from '../lib/format.js'

function LossSparkline({ history, draw }) {
  if (history.length < 2) return <div className="h-10" />
  const values = history.map((h) => h.loss)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${40 - ((v - min) / span) * 36}`)
    .join(' ')

  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-10 w-full">
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
    <div className="rounded-md border border-edge p-4">
      <div className="label mb-2">{dataset?.source === 'real' ? 'Real data' : 'Synthetic data'}</div>
      <p className="text-[12px] leading-snug text-muted">{card.short}</p>

      {open ? (
        <div className="mt-3 space-y-2 border-t border-edge pt-3">
          {card.full.map((paragraph, i) => (
            <p key={i} className="text-[12px] leading-snug text-muted">
              {paragraph}
            </p>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-2 text-[11px] text-muted underline underline-offset-2 hover:text-ink"
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
  onTrain,
  onThreshold,
  onSplitMode,
}) {
  const groupNames = dataset?.groupNames ?? ['Group A', 'Group B']
  const positive = dataset?.positiveLabel?.toLowerCase() ?? 'approved'

  return (
    <aside className="flex w-full shrink-0 flex-col gap-4 overflow-y-auto border-edge p-6 lg:w-80 lg:border-r">
      <DatasetCard datasetId={datasetId} dataset={dataset} />

      <div className="rounded-md border border-edge p-4">
        {status === 'trained' ? (
          <div>
            <div className="label mb-2">Trained</div>
            <LossSparkline history={history} draw />
            <div className="mt-2 flex justify-between text-[12px] text-muted">
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
            <div className="label mb-2">Training</div>
            <LossSparkline history={history} />
            <div className="num mt-2 text-[12px] text-muted">epoch {epoch}</div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onTrain}
            disabled={status !== 'ready'}
            className="w-full rounded-[4px] border border-edge py-2 text-[13px] transition-colors duration-150 hover:bg-edge disabled:opacity-40"
          >
            Train the model
          </button>
        )}
      </div>

      {status === 'trained' ? (
        <div className="flex flex-col gap-4 rounded-md border border-edge p-4">
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
              color="#ffffff"
              caption={`Applicants scoring above ${decimal(thresholds[0], 2)} are ${positive}.`}
            />
          )}

          <div className="border-t border-edge pt-3">
            <div className="flex rounded-md border border-edge p-[3px]">
              <button
                type="button"
                onClick={() => onSplitMode(false)}
                className={`flex-1 rounded-[4px] px-2 py-[6px] text-[12px] transition-colors duration-150 ${
                  splitMode ? 'text-muted hover:text-ink' : 'bg-edge text-ink'
                }`}
              >
                Single threshold
              </button>
              <button
                type="button"
                onClick={() => onSplitMode(true)}
                className={`flex-1 rounded-[4px] px-2 py-[6px] text-[12px] transition-colors duration-150 ${
                  splitMode ? 'bg-edge text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                Separate thresholds
              </button>
            </div>
            <p className="mt-2 text-[11px] leading-snug text-muted">
              Setting a different bar for each group is illegal in some contexts and required for
              fairness in others.
            </p>
          </div>
        </div>
      ) : null}
    </aside>
  )
}
