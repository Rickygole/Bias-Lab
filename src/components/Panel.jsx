export default function Panel({ title, note, children, className = '' }) {
  return (
    <section
      className={`flex flex-col rounded-md border border-edge bg-panel p-5 ${className}`}
    >
      <header className="mb-5 flex items-baseline justify-between gap-4">
        <h2 className="label text-ink">{title}</h2>
        {note ? <span className="text-[11px] text-muted">{note}</span> : null}
      </header>
      <div className="flex-1">{children}</div>
    </section>
  )
}
