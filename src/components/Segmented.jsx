export default function Segmented({ label, options, value, onChange, vertical = false }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`flex rounded-md border border-edge p-1 ${vertical ? 'flex-col' : 'flex-wrap'}`}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`rounded-[4px] px-3 py-2 whitespace-nowrap transition-colors duration-150 ${
              vertical ? 'text-left' : ''
            } ${selected ? 'bg-edge text-ink' : 'text-muted hover:text-ink'}`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
