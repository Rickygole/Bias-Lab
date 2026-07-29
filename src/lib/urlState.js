import { datasetIds } from '../data/index.js'

function clampThreshold(raw) {
  if (raw === null || raw === undefined || raw.trim() === '') return null
  const value = Number(raw)
  if (!Number.isFinite(value)) return null
  return Math.min(1, Math.max(0, Math.round(value * 100) / 100))
}

export function readUrlState(search) {
  const params = new URLSearchParams(search)
  const state = {}

  const dataset = params.get('dataset')
  if (dataset && datasetIds.includes(dataset)) state.datasetId = dataset

  const split = params.get('split') === '1'
  const a = clampThreshold(params.get('a')) ?? clampThreshold(params.get('t'))
  const b = clampThreshold(params.get('b'))

  if (split && a !== null && b !== null) {
    state.splitMode = true
    state.thresholds = [a, b]
  } else if (a !== null) {
    state.splitMode = false
    state.thresholds = [a, a]
  }

  if (params.get('tour') === '1') state.tourStep = 0

  return state
}

const SEEN = 'bias-lab-tour-seen'

export function shouldOpenTour(search, storage) {
  if (new URLSearchParams(search).toString() !== '') return false
  try {
    if (storage?.getItem(SEEN)) return false
    storage?.setItem(SEEN, '1')
  } catch {
    return true
  }
  return true
}

export function writeUrlState({ datasetId, thresholds, splitMode }) {
  const params = new URLSearchParams()
  params.set('dataset', datasetId)
  if (splitMode) {
    params.set('split', '1')
    params.set('a', thresholds[0].toFixed(2))
    params.set('b', thresholds[1].toFixed(2))
  } else {
    params.set('t', thresholds[0].toFixed(2))
  }
  return `?${params.toString()}`
}
