import { datasetIds, datasetNames } from '../data/index.js'

export default function TopBar({ datasetId, onSelect, onReset, onTour }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-edge px-6">
      <div className="flex items-baseline gap-3">
        <span className="text-[15px] font-medium tracking-tight">Bias Lab</span>
        <span className="hidden text-[11px] text-muted sm:inline">
          one threshold, two outcomes
        </span>
      </div>

      <nav className="flex rounded-md border border-edge p-[3px]">
        {datasetIds.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={`rounded-[4px] px-3 py-[6px] text-[12px] transition-colors duration-150 ${
              id === datasetId ? 'bg-edge text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            {datasetNames[id]}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onTour}
          className="rounded-[4px] px-3 py-[6px] text-[12px] text-muted transition-colors duration-150 hover:text-ink"
        >
          Tour
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-[4px] px-3 py-[6px] text-[12px] text-muted transition-colors duration-150 hover:text-ink"
        >
          Reset
        </button>
      </div>
    </header>
  )
}
