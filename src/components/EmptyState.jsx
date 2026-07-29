export default function EmptyState({ children }) {
  return (
    <div className="flex h-full flex-col">
      <div className="h-px w-6 bg-edge" />
      <div className="label mt-4">Not yet trained</div>
      <p className="mt-2 max-w-[52ch] leading-relaxed text-muted">{children}</p>
    </div>
  )
}
