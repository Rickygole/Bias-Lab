export default function Blank({ width = 18 }) {
  return (
    <>
      <span aria-hidden="true" className="inline-block h-px bg-edge align-middle" style={{ width }} />
      <span className="sr-only">no reading yet</span>
    </>
  )
}
