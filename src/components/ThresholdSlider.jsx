import { decimal } from '../lib/format.js'

export default function ThresholdSlider({ value, onChange, color, label, swatch, caption }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="flex min-w-0 items-center gap-2">
          {swatch ? <span className="swatch" style={{ background: color }} /> : null}
          <span className="label truncate text-ink">{label}</span>
        </span>
        <span className="n-md text-ink">{decimal(value, 2)}</span>
      </div>

      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={`${label} threshold`}
        aria-valuetext={decimal(value, 2)}
        className="mt-1 h-9 w-full cursor-ew-resize appearance-none bg-transparent"
        style={{ color }}
      />

      {caption ? <p className="note text-dim">{caption}</p> : null}
    </div>
  )
}
