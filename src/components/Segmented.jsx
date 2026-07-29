export default function Segmented({ label, options, value, onChange, vertical = false }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`flex rounded-[3px] border border-edge ${vertical ? 'flex-col' : 'w-max min-w-full lg:w-auto lg:min-w-0'}`}
    >
      {options.map((option, i) => {
        const selected = option.value === value
        return (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`px-3 py-2 whitespace-nowrap transition-colors duration-150 ${
              i === 0 ? '' : vertical ? 'border-t border-hair' : 'border-l border-hair'
            } ${vertical ? 'text-left' : ''} ${
              selected ? 'bg-edge text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
