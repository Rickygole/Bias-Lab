export default function Mark({ size = 19 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="shrink-0"
      role="presentation"
    >
      <rect x="3" y="7" width="23" height="7" fill="var(--color-groupA)" />
      <rect x="3" y="18" width="11" height="7" fill="var(--color-groupB)" />
      <rect x="17" y="4" width="3" height="24" fill="var(--color-ink)" />
    </svg>
  )
}
