export default function GroupTag({ name, color, className = '' }) {
  return (
    <span className={`flex min-w-0 items-center gap-2 ${className}`}>
      <span className="swatch" style={{ background: color }} />
      <span className="note truncate text-muted">{name}</span>
    </span>
  )
}
