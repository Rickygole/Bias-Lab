import { describe, it, expect } from 'vitest'
import { readUrlState, shouldOpenTour, writeUrlState } from './urlState.js'

describe('readUrlState', () => {
  it('is empty for no query', () => {
    expect(readUrlState('')).toEqual({})
  })

  it('reads a known dataset and ignores an unknown one', () => {
    expect(readUrlState('?dataset=medical').datasetId).toBe('medical')
    expect(readUrlState('?dataset=nonsense').datasetId).toBeUndefined()
  })

  it('applies a single threshold to both groups', () => {
    expect(readUrlState('?t=0.63').thresholds).toEqual([0.63, 0.63])
    expect(readUrlState('?t=0.63').splitMode).toBe(false)
  })

  it('reads separate thresholds only when split is set', () => {
    expect(readUrlState('?split=1&a=0.67&b=0.51').thresholds).toEqual([0.67, 0.51])
    expect(readUrlState('?split=1&a=0.67&b=0.51').splitMode).toBe(true)
    expect(readUrlState('?a=0.67&b=0.51').splitMode).toBe(false)
  })

  it('clamps out of range values instead of trusting them', () => {
    expect(readUrlState('?t=5').thresholds).toEqual([1, 1])
    expect(readUrlState('?t=-3').thresholds).toEqual([0, 0])
  })

  it('ignores values that are not numbers', () => {
    expect(readUrlState('?t=abc').thresholds).toBeUndefined()
  })

  it('rounds to the slider step', () => {
    expect(readUrlState('?t=0.6349').thresholds).toEqual([0.63, 0.63])
  })

  it('falls back to t when a is present but empty', () => {
    expect(readUrlState('?t=0.7&a=').thresholds).toEqual([0.7, 0.7])
  })

  it('ignores whitespace rather than reading it as zero', () => {
    expect(readUrlState('?t=%20').thresholds).toBeUndefined()
    expect(readUrlState('?t=+').thresholds).toBeUndefined()
  })

  it('opens the tour when asked', () => {
    expect(readUrlState('?tour=1').tourStep).toBe(0)
    expect(readUrlState('?tour=0').tourStep).toBeUndefined()
  })
})

describe('writeUrlState', () => {
  it('round trips a single threshold', () => {
    const query = writeUrlState({ datasetId: 'loan', thresholds: [0.45, 0.45], splitMode: false })
    expect(readUrlState(query)).toEqual({
      datasetId: 'loan',
      thresholds: [0.45, 0.45],
      splitMode: false,
    })
  })

  it('round trips separate thresholds', () => {
    const query = writeUrlState({
      datasetId: 'medical',
      thresholds: [0.6, 0.35],
      splitMode: true,
    })
    expect(readUrlState(query)).toEqual({
      datasetId: 'medical',
      thresholds: [0.6, 0.35],
      splitMode: true,
    })
  })
})

describe('shouldOpenTour', () => {
  const store = () => {
    const map = new Map()
    return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) }
  }

  it('opens on a clean first visit', () => {
    expect(shouldOpenTour('', store())).toBe(true)
  })

  it('does not open twice in the same session', () => {
    const s = store()
    expect(shouldOpenTour('', s)).toBe(true)
    expect(shouldOpenTour('', s)).toBe(false)
  })

  it('never interrupts a shared link', () => {
    expect(shouldOpenTour('?dataset=medical&t=0.65', store())).toBe(false)
    expect(shouldOpenTour('?t=0.45', store())).toBe(false)
  })

  it('opens when storage is unavailable rather than failing', () => {
    const hostile = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {},
    }
    expect(shouldOpenTour('', hostile)).toBe(true)
    expect(shouldOpenTour('', undefined)).toBe(true)
  })
})
