export default function Panel({ title, note, footer, children, className = '' }) {
  return (
    <section className={`plate flex flex-col px-5 pt-4 pb-4 ${className}`}>
      <header className="flex items-baseline justify-between gap-4 border-b border-edge pb-3">
        <h2 className="label text-ink">{title}</h2>
        {note ? <span className="note text-dim">{note}</span> : null}
      </header>

      <div className="flex flex-1 flex-col pt-4">{children}</div>

      {footer ? (
        <p className="note mt-4 border-t border-hair pt-3 text-muted">{footer}</p>
      ) : null}
    </section>
  )
}
