import { useState } from 'react'
import { datasetIds, datasetNames } from '../data/index.js'
import { picks } from '../data/cards.js'
import Mark from './Mark.jsx'

const groupColors = ['var(--color-groupA)', 'var(--color-groupB)']

function Detail({ id }) {
  const pick = picks[id]

  return (
    <div className="mt-5">
      <p className="read">
        <span className="text-ink">{pick.kind}.</span> {pick.origin} {pick.decision}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5">
        <span className="label">{pick.attribute}</span>
        {pick.groups.map((group, i) => (
          <span key={group} className="flex items-center gap-2">
            <span className="swatch" style={{ background: groupColors[i] }} />
            <span className="note text-muted">{group}</span>
          </span>
        ))}
      </div>

      <div className="mt-4 border-t border-hair pt-4">
        <span className="label block">What is wrong with the label</span>
        <p className="read mt-2">{pick.label}</p>
      </div>
    </div>
  )
}

export default function DatasetPicker({ onChoose }) {
  const [selected, setSelected] = useState(datasetIds[0])

  return (
    <div className="flex min-h-dvh w-full max-w-full min-w-0 flex-col overflow-x-clip">
      <header className="flex w-full shrink-0 items-center border-b border-edge px-4 py-3 sm:px-6 lg:h-14 lg:px-5 lg:py-0">
        <div className="flex items-center gap-2.5">
          <Mark />
          <h1 className="font-medium tracking-[-0.01em]">Bias Lab</h1>
          <span className="note hidden text-dim sm:inline">one threshold, two outcomes</span>
        </div>
      </header>

      <main className="flex w-full min-w-0 flex-1 flex-col px-4 pt-6 pb-8 sm:px-6 lg:justify-center lg:px-5 lg:pt-7 lg:pb-10">
        <div className="mx-auto w-full max-w-[760px]">
          <p className="text-[15px] leading-[24px] text-ink">
            A model gives every person a score. A threshold is the line you draw across those scores:
            everyone above it gets a yes, everyone below gets a no. It is the whole decision, and here
            you are the one who moves it.
          </p>

          <p className="read mt-3">
            Each dataset has something wrong with its label before the model ever sees it. That is
            the part worth reading. Pick one and you get a single line to drag, with six definitions
            of fairness watching where you put it.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <label htmlFor="dataset" className="sr-only">
              Dataset
            </label>
            <select
              id="dataset"
              value={selected}
              onChange={(event) => setSelected(event.target.value)}
              className="plate min-w-[240px] cursor-pointer px-3 py-2.5 text-ink"
            >
              {datasetIds.map((id) => (
                <option key={id} value={id}>
                  {datasetNames[id]}
                  {id === datasetIds[0] ? ' (real data)' : ' (synthetic)'}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => onChoose(selected)}
              className="cursor-pointer border border-ink bg-ink px-4 py-2.5 text-bg transition-colors duration-150 hover:border-muted hover:bg-muted"
            >
              Load and train
            </button>
          </div>

          <Detail id={selected} />

          <p className="note mt-8 border-t border-hair pt-4 text-dim">
            No backend, no accounts, no API. The model is trained on this page, in your browser.
          </p>
        </div>
      </main>
    </div>
  )
}
