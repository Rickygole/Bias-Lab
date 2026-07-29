export default function Panel({ title, note, children, className = '' }) {
  return (
    <section
      className={`flex min-h-0 flex-col rounded-md border border-edge bg-panel p-6 ${className}`}
    >
      <header className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="label">{title}</h2>
        {note ? <span className="text-[11px] text-muted">{note}</span> : null}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  )
}
