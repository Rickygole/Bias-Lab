import { datasetIds, datasetNames } from '../data/index.js'
import { picks } from '../data/cards.js'

const groupColors = ['var(--color-groupA)', 'var(--color-groupB)']

function Choice({ id, lead, onChoose }) {
  const pick = picks[id]

  return (
    <li>
      <button
        type="button"
        onClick={() => onChoose(id)}
        aria-labelledby={`pick-${id}-name`}
        aria-describedby={`pick-${id}-why`}
        className={`plate group block w-full px-4 py-3.5 text-left transition-colors duration-150 hover:bg-bg sm:px-5 sm:py-4 lg:flex lg:gap-8 ${
          lead ? 'border-ink' : 'hover:border-dim'
        }`}
      >
        <span className="block shrink-0 lg:w-[14rem]">
          <span className="flex items-baseline justify-between gap-3">
            <span id={`pick-${id}-name`} className="font-medium text-ink">
              {datasetNames[id]}
            </span>
            {lead ? <span className="label text-ink">Start here</span> : null}
          </span>
          <span className="note mt-1.5 block text-dim">
            <span className="text-muted">{pick.kind}.</span> {pick.origin}
          </span>

          <span className="note mt-3 block border-t border-hair pt-3 text-muted">
            {pick.decision}
          </span>

          <span className="mt-3 block border-t border-hair pt-3">
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
        </span>

        <span className="mt-4 block border-t border-hair pt-3.5 lg:mt-0 lg:flex lg:flex-1 lg:flex-col lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
          <span className="label block">What is wrong with the label</span>
          <span id={`pick-${id}-why`} className="read mt-2 block max-w-[58ch]">
            {pick.label}
          </span>
          <span className="note mt-3.5 block text-muted transition-colors duration-150 group-hover:text-ink lg:mt-auto lg:pt-3.5">
            Load this one and train
          </span>
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

      <main className="w-full max-w-[58rem] min-w-0 px-4 pt-7 pb-10 sm:px-6 lg:px-5 lg:pt-9">
        <p className="max-w-[54ch] text-[15px] leading-[24px] text-ink">
          A model gives every person a score. A threshold is the line you draw across those scores:
          everyone above it gets a yes, everyone below gets a no. It is the whole decision, and here
          you are the one who moves it.
        </p>
        <p className="read mt-3.5 max-w-[58ch]">
          Each dataset below has something wrong with its label before the model ever sees it. That
          is the part worth reading. Choose one and it trains in your browser, then you get one line
          to drag and six definitions of fairness watching where you put it.
        </p>

        <h2 className="label mt-8 border-b border-edge pb-2.5">Choose a dataset</h2>

        <ul className="mt-4 flex flex-col gap-3">
          {datasetIds.map((id, i) => (
            <Choice key={id} id={id} lead={i === 0} onChoose={onChoose} />
          ))}
        </ul>

        <p className="note mt-5 text-dim">
          Everything runs on this page. The model is trained in your browser and nothing is sent
          anywhere.
        </p>
      </main>
    </div>
  )
}
