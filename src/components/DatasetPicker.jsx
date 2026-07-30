import { datasetIds, datasetNames } from '../data/index.js'
import { picks } from '../data/cards.js'

const groupColors = ['var(--color-groupA)', 'var(--color-groupB)']

function Choice({ id, lead, onChoose }) {
  const pick = picks[id]

  return (
    <li className="flex min-w-0">
      <button
        type="button"
        onClick={() => onChoose(id)}
        aria-labelledby={`pick-${id}-name`}
        aria-describedby={`pick-${id}-origin pick-${id}-decision pick-${id}-groups pick-${id}-why`}
        className={`plate group flex w-full min-w-0 flex-col px-4 py-3.5 text-left transition-colors duration-150 hover:bg-bg sm:px-5 sm:py-4 ${
          lead ? 'border-ink' : 'hover:border-dim'
        }`}
      >
        <span className="flex items-baseline justify-between gap-3">
          <span id={`pick-${id}-name`} className="font-medium text-ink">
            {datasetNames[id]}
          </span>
          {lead ? <span className="label text-ink">Start here</span> : null}
        </span>

        <span id={`pick-${id}-origin`} className="note mt-1.5 block max-w-[62ch] text-dim">
          <span className="text-muted">{pick.kind}.</span> {pick.origin}
        </span>

        <span
          id={`pick-${id}-decision`}
          className="note mt-3 block max-w-[62ch] border-t border-hair pt-3 text-muted"
        >
          {pick.decision}
        </span>

        <span id={`pick-${id}-groups`} className="mt-3 block border-t border-hair pt-3">
          <span className="label block">Two groups, split by {pick.attribute.toLowerCase()}</span>
          <span className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
            {pick.groups.map((group, i) => (
              <span key={group} className="flex items-center gap-2">
                <span className="swatch" style={{ background: groupColors[i] }} />
                <span className="note text-muted">{group}</span>
              </span>
            ))}
          </span>
        </span>

        <span className="mt-3 block border-t border-hair pt-3">
          <span className="label block">What is wrong with the label</span>
          <span id={`pick-${id}-why`} className="read mt-1.5 block max-w-[62ch]">
            {pick.label}
          </span>
        </span>

        <span className="note link mt-3.5 self-start transition-colors duration-150 group-hover:border-dim group-hover:text-ink lg:mt-auto lg:pt-3.5">
          Load and train
        </span>
      </button>
    </li>
  )
}

export default function DatasetPicker({ onChoose }) {
  return (
    <div className="flex min-h-dvh w-full max-w-full min-w-0 flex-col overflow-x-clip">
      <header className="flex w-full shrink-0 items-center border-b border-edge px-4 py-3 sm:px-6 lg:h-14 lg:px-5 lg:py-0">
        <div className="flex items-baseline gap-3">
          <h1 className="font-medium tracking-[-0.01em]">Bias Lab</h1>
          <span className="note hidden text-dim sm:inline">one threshold, two outcomes</span>
        </div>
      </header>

      <main className="flex w-full min-w-0 flex-1 flex-col px-4 pt-6 pb-8 sm:px-6 lg:justify-center lg:px-5 lg:pt-7 lg:pb-10">
        <div>
          <div className="grid gap-x-3 gap-y-3 lg:grid-cols-3">
            <p className="text-[15px] leading-[24px] text-ink lg:pr-8">
              A model gives every person a score. A threshold is the line you draw across those
              scores: everyone above it gets a yes, everyone below gets a no. It is the whole
              decision, and here you are the one who moves it.
            </p>
            <p className="read lg:pr-8">
              Each dataset below has something wrong with its label before the model ever sees it.
              That is the part worth reading. Choose one and you get a single line to drag, with six
              definitions of fairness watching where you put it.
            </p>
            <p className="note text-dim">
              No backend and no accounts. The model is trained on this page, in your browser, and
              nothing you do here is sent anywhere.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-edge pb-2.5">
            <h2 className="label">Choose a dataset</h2>
            <span className="note text-dim">a click loads it and starts training</span>
          </div>

          <ul className="mt-3 grid grid-cols-1 items-stretch gap-3 lg:grid-cols-3">
            {datasetIds.map((id, i) => (
              <Choice key={id} id={id} lead={i === 0} onChoose={onChoose} />
            ))}
          </ul>
        </div>
      </main>
    </div>
  )
}
