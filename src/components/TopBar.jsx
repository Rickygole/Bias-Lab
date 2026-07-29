import { datasetIds, datasetNames } from '../data/index.js'
import Segmented from './Segmented.jsx'

const options = datasetIds.map((id) => ({ value: id, label: datasetNames[id] }))

export default function TopBar({ datasetId, onSelect, onReset, onTour }) {
  return (
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-edge px-6 py-3 lg:h-14 lg:flex-nowrap lg:py-0 lg:pr-5 lg:pl-5">
      <div className="flex items-baseline gap-3">
        <h1 className="tracking-[-0.01em] font-medium">Bias Lab</h1>
        <span className="note hidden text-dim sm:inline">one threshold, two outcomes</span>
      </div>

      <nav className="order-3 w-full lg:order-none lg:w-auto">
        <Segmented label="Dataset" options={options} value={datasetId} onChange={onSelect} />
      </nav>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onTour}
          className="rounded-[3px] px-3 py-2 text-muted transition-colors duration-150 hover:text-ink"
        >
          Tour
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-[3px] px-3 py-2 text-muted transition-colors duration-150 hover:text-ink"
        >
          Reset
        </button>
      </div>
    </header>
  )
}
