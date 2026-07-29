import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { train, predict } from '../ml/logreg.js'
import { fairness } from '../ml/metrics.js'
import { hollowEquality } from './FairnessTable.jsx'

function trained(id) {
  const data = JSON.parse(readFileSync(new URL(`../data/${id}.json`, import.meta.url), 'utf8'))
  const model = train(data.train.X, data.train.y, { epochs: 4000, lr: 1.5, reportEvery: 1e9 })
  return {
    scores: predict(data.test.X, model.weights, model.bias),
    y: Uint8Array.from(data.test.y),
    g: Uint8Array.from(data.test.g),
  }
}

describe('hollow equality', () => {
  const medical = trained('medical')

  it('fires at the threshold pair that closes every gap by approving almost nobody', () => {
    const result = fairness(medical.scores, medical.y, medical.g, [0.72, 0.67])
    const live = result.definitions.filter((d) => d.live)
    expect(Math.max(...live.map((d) => d.gap))).toBeLessThan(0.05)

    const hollow = hollowEquality(result.definitions, true)
    expect(hollow).not.toBeNull()
    expect(hollow[0]).toBeLessThan(0.15)
    expect(hollow[1]).toBeLessThan(0.15)
  })

  it('stays quiet at an ordinary operating point', () => {
    const result = fairness(medical.scores, medical.y, medical.g, [0.5, 0.5])
    expect(hollowEquality(result.definitions, true)).toBeNull()
  })

  it('stays quiet before the model has trained', () => {
    const result = fairness(medical.scores, medical.y, medical.g, [0.72, 0.67])
    expect(hollowEquality(result.definitions, false)).toBeNull()
  })

  it('covers every slider pair on every dataset that closes all gaps', () => {
    for (const id of ['loan', 'admissions', 'medical']) {
      const { scores, y, g } = trained(id)
      for (let a = 5; a <= 95; a += 1) {
        for (let b = 5; b <= 95; b += 1) {
          const result = fairness(scores, y, g, [a / 100, b / 100])
          const live = result.definitions.filter((d) => d.live)
          if (live.some((d) => d.gap === null)) continue
          if (Math.max(...live.map((d) => d.gap)) >= 0.05) continue

          const parity = result.definitions.find((d) => d.key === 'demographicParity')
          const quiet = hollowEquality(result.definitions, true) === null
          if (quiet) {
            expect(Math.max(parity.values[0], parity.values[1])).toBeGreaterThanOrEqual(0.15)
          }
        }
      }
    }
  })
})
