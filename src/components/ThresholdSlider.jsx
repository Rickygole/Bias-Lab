import { decimal } from '../lib/format.js'

export default function ThresholdSlider({ value, onChange, color, label, caption }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        {label ? (
          <span className="flex items-center gap-2 text-[11px] text-muted">
            <span className="h-2 w-2 rounded-[1px]" style={{ background: color }} />
            {label}
          </span>
        ) : (
          <span className="label">Threshold</span>
        )}
        <span className="num text-[20px] leading-none">{decimal(value, 2)}</span>
      </div>

      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label ? `${label} threshold` : 'Decision threshold'}
        aria-valuetext={decimal(value, 2)}
        className="mt-2 h-12 w-full cursor-ew-resize appearance-none bg-transparent"
        style={{ color }}
      />

      {caption ? <p className="text-[11px] leading-snug text-muted">{caption}</p> : null}
    </div>
  )
}
