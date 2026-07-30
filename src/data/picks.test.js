import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { picks, outcomes, cards } from './cards.js'
import { datasetIds, datasetNames } from './index.js'

const shipped = (id) =>
  JSON.parse(readFileSync(new URL(`./${id}.json`, import.meta.url), 'utf8'))

describe('picker copy agrees with the shipped data', () => {
  it('covers every dataset', () => {
    for (const id of datasetIds) {
      expect(picks[id]).toBeTruthy()
      expect(outcomes[id]).toBeTruthy()
      expect(cards[id]).toBeTruthy()
    }
  })

  it('names the same two groups the instrument names', () => {
    for (const id of datasetIds) {
      expect(picks[id].groups).toEqual(shipped(id).groupNames)
    }
  })

  it('names the same protected attribute', () => {
    for (const id of datasetIds) {
      expect(picks[id].attribute).toBe(shipped(id).groupAttribute)
    }
  })

  it('agrees on whether the data is real or synthetic', () => {
    for (const id of datasetIds) {
      const real = shipped(id).source === 'real'
      expect(picks[id].kind.toLowerCase()).toBe(real ? 'real data' : 'synthetic data')
    }
  })

  it('uses the same dataset titles as the top bar', () => {
    for (const id of datasetIds) {
      expect(shipped(id).name).toBe(datasetNames[id])
    }
  })

  it('says something about every label', () => {
    for (const id of datasetIds) {
      expect(picks[id].label.length).toBeGreaterThan(80)
    }
  })
})
