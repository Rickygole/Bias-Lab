export default function Panel({ title, note, footer, children, className = '' }) {
  return (
    <section className={`plate flex min-w-0 flex-col px-5 pt-3.5 pb-3.5 ${className}`}>
      <header className="flex items-baseline justify-between gap-4 border-b border-edge pb-3">
        <h2 className="label shrink-0 whitespace-nowrap text-ink">{title}</h2>
        {note ? <span className="note truncate text-dim">{note}</span> : null}
      </header>

      <div className="scroller flex min-w-0 flex-1 flex-col overflow-x-auto pt-4">{children}</div>

      {footer ? (
        <p className="note mt-4 border-t border-hair pt-3 text-muted">{footer}</p>
      ) : null}
    </section>
  )
}
