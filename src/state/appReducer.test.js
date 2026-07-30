import { describe, it, expect } from 'vitest'
import { appReducer, initialState, makeInitialState } from './appReducer.js'

const loaded = { ...initialState, dataset: { id: 'loan' }, status: 'trained' }
const inside = { ...loaded, entered: true }

describe('entering from the picker', () => {
  it('starts outside the instrument by default', () => {
    expect(makeInitialState().entered).toBe(false)
  })

  it('keeps the dataset it already loaded when that is the one chosen', () => {
    const next = appReducer(loaded, { type: 'enterDataset', id: 'loan' })
    expect(next.entered).toBe(true)
    expect(next.status).toBe('trained')
  })

  it('loads from scratch when another dataset is chosen', () => {
    const next = appReducer(loaded, { type: 'enterDataset', id: 'medical' })
    expect(next.entered).toBe(true)
    expect(next.datasetId).toBe('medical')
    expect(next.dataset).toBe(null)
    expect(next.status).toBe('idle')
  })

  it('carries the first visit tour into the instrument', () => {
    const waiting = { ...makeInitialState(), tourStep: 0 }
    expect(appReducer(waiting, { type: 'enterDataset', id: 'medical' }).tourStep).toBe(0)
  })
})

describe('staying inside the instrument', () => {
  it('switches dataset without going back to the picker', () => {
    expect(appReducer(inside, { type: 'selectDataset', id: 'admissions' }).entered).toBe(true)
  })

  it('resets without going back to the picker', () => {
    const moved = { ...inside, thresholds: [0.7, 0.2], splitMode: true }
    const next = appReducer(moved, { type: 'reset' })
    expect(next.entered).toBe(true)
    expect(next.status).toBe('ready')
    expect(next.thresholds).toEqual([0.5, 0.5])
    expect(next.splitMode).toBe(false)
  })
})
