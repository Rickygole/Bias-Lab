export default function Blank({ width = 18 }) {
  return (
    <span className="inline-flex items-center align-baseline" style={{ height: '1em' }}>
      <span aria-hidden="true" className="block h-px bg-edge" style={{ width }} />
      <span className="sr-only">no reading yet</span>
    </span>
  )
}
