export function percent(value, digits = 1) {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'n/a'
  return `${(value * 100).toFixed(digits)}%`
}

export function points(value, digits = 1) {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'n/a'
  return `${(value * 100).toFixed(digits)}`
}

export function decimal(value, digits = 2) {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'n/a'
  return value.toFixed(digits)
}

export function count(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'n/a'
  return Math.round(value).toLocaleString('en-US')
}
