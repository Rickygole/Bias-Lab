import { describe, it, expect } from 'vitest'
import {
  confusion,
  rates,
  overallAccuracy,
  expectedCalibrationError,
  histogram,
  rocCurve,
  fairness,
  humanCost,
} from './metrics.js'

const scores = Float32Array.from([0.9, 0.8, 0.6, 0.4, 0.3, 0.7, 0.55, 0.45, 0.2, 0.1])
const labels = Uint8Array.from([1, 1, 0, 1, 0, 1, 0, 1, 0, 0])
const groups = Uint8Array.from([0, 0, 0, 0, 0, 1, 1, 1, 1, 1])

describe('confusion', () => {
  it('matches a matrix counted by hand for group A at 0.5', () => {
    expect(confusion(scores, labels, groups, 0, 0.5)).toEqual({
      tp: 2,
      fp: 1,
      fn: 1,
      tn: 1,
      n: 5,
    })
  })

  it('matches a matrix counted by hand for group B at 0.5', () => {
    expect(confusion(scores, labels, groups, 1, 0.5)).toEqual({
      tp: 1,
      fp: 1,
      fn: 1,
      tn: 2,
      n: 5,
    })
  })

  it('approves everyone at a threshold of zero', () => {
    const m = confusion(scores, labels, groups, 0, 0)
    expect(m.tp + m.fp).toBe(5)
    expect(m.fn + m.tn).toBe(0)
  })

  it('approves nobody above the highest score', () => {
    const m = confusion(scores, labels, groups, 0, 1.01)
    expect(m.tp + m.fp).toBe(0)
    expect(m.n).toBe(5)
  })

  it('is inclusive at the threshold', () => {
    const s = Float32Array.from([0.5, 0.5])
    const y = Uint8Array.from([1, 0])
    const g = Uint8Array.from([0, 0])
    expect(confusion(s, y, g, 0, 0.5)).toEqual({ tp: 1, fp: 1, fn: 0, tn: 0, n: 2 })
  })
})

describe('rates', () => {
  it('computes group A rates by hand', () => {
    const r = rates(confusion(scores, labels, groups, 0, 0.5))
    expect(r.selectionRate).toBeCloseTo(3 / 5, 10)
    expect(r.tpr).toBeCloseTo(2 / 3, 10)
    expect(r.fpr).toBeCloseTo(1 / 2, 10)
    expect(r.fnr).toBeCloseTo(1 / 3, 10)
    expect(r.ppv).toBeCloseTo(2 / 3, 10)
    expect(r.accuracy).toBeCloseTo(3 / 5, 10)
    expect(r.baseRate).toBeCloseTo(3 / 5, 10)
  })

  it('has tpr and fnr summing to one', () => {
    const r = rates(confusion(scores, labels, groups, 1, 0.5))
    expect(r.tpr + r.fnr).toBeCloseTo(1, 10)
  })

  it('returns null rather than dividing by zero', () => {
    const r = rates({ tp: 0, fp: 0, fn: 0, tn: 4, n: 4 })
    expect(r.tpr).toBeNull()
    expect(r.ppv).toBeNull()
    expect(r.selectionRate).toBe(0)
  })
})

describe('overallAccuracy', () => {
  it('counts every correct decision under one threshold', () => {
    expect(overallAccuracy(scores, labels, [0.5, 0.5], groups)).toBeCloseTo(6 / 10, 10)
  })

  it('honours separate thresholds per group', () => {
    expect(overallAccuracy(scores, labels, [0.5, 0.0], groups)).toBeCloseTo(5 / 10, 10)
  })
})

describe('expectedCalibrationError', () => {
  it('is zero when every bin is perfectly calibrated', () => {
    const s = Float32Array.from([0.05, 0.05, 0.95, 0.95])
    const y = Uint8Array.from([0, 0, 1, 1])
    const g = Uint8Array.from([0, 0, 0, 0])
    expect(expectedCalibrationError(s, y, g, 0)).toBeLessThan(0.06)
  })

  it('is large when confidence is inverted', () => {
    const s = Float32Array.from([0.95, 0.95, 0.05, 0.05])
    const y = Uint8Array.from([0, 0, 1, 1])
    const g = Uint8Array.from([0, 0, 0, 0])
    expect(expectedCalibrationError(s, y, g, 0)).toBeGreaterThan(0.9)
  })

  it('returns null for an empty group', () => {
    expect(expectedCalibrationError(scores, labels, groups, 5)).toBeNull()
  })
})

describe('histogram', () => {
  it('assigns every row of a group to exactly one bin', () => {
    const counts = histogram(scores, groups, 0, 20)
    expect(counts.reduce((a, b) => a + b, 0)).toBe(5)
  })

  it('puts a score of one in the last bin', () => {
    const counts = histogram(Float32Array.from([1]), Uint8Array.from([0]), 0, 20)
    expect(counts[19]).toBe(1)
  })
})

describe('rocCurve', () => {
  it('gives auc of one for a perfect ranking', () => {
    const s = Float32Array.from([0.9, 0.8, 0.2, 0.1])
    const y = Uint8Array.from([1, 1, 0, 0])
    const g = Uint8Array.from([0, 0, 0, 0])
    expect(rocCurve(s, y, g, 0).auc).toBeCloseTo(1, 10)
  })

  it('gives auc of a half for a tied ranking', () => {
    const s = Float32Array.from([0.5, 0.5, 0.5, 0.5])
    const y = Uint8Array.from([1, 0, 1, 0])
    const g = Uint8Array.from([0, 0, 0, 0])
    expect(rocCurve(s, y, g, 0).auc).toBeCloseTo(0.5, 10)
  })

  it('gives auc of zero for a reversed ranking', () => {
    const s = Float32Array.from([0.9, 0.8, 0.2, 0.1])
    const y = Uint8Array.from([0, 0, 1, 1])
    const g = Uint8Array.from([0, 0, 0, 0])
    expect(rocCurve(s, y, g, 0).auc).toBeCloseTo(0, 10)
  })
})

describe('fairness', () => {
  const result = fairness(scores, labels, groups, [0.5, 0.5])
  const byKey = Object.fromEntries(result.definitions.map((d) => [d.key, d]))

  it('reports demographic parity as the selection rate gap', () => {
    expect(byKey.demographicParity.values[0]).toBeCloseTo(3 / 5, 10)
    expect(byKey.demographicParity.values[1]).toBeCloseTo(2 / 5, 10)
    expect(byKey.demographicParity.gap).toBeCloseTo(1 / 5, 10)
  })

  it('reports equal opportunity as the true positive rate gap', () => {
    expect(byKey.equalOpportunity.values[0]).toBeCloseTo(2 / 3, 10)
    expect(byKey.equalOpportunity.values[1]).toBeCloseTo(1 / 2, 10)
    expect(byKey.equalOpportunity.gap).toBeCloseTo(1 / 6, 10)
  })

  it('splits equalized odds into a true and a false positive row', () => {
    expect(byKey.equalizedOddsTpr.gap).toBeCloseTo(1 / 6, 10)
    expect(byKey.equalizedOddsFpr.values[0]).toBeCloseTo(1 / 2, 10)
    expect(byKey.equalizedOddsFpr.values[1]).toBeCloseTo(1 / 3, 10)
  })

  it('reports predictive parity as the precision gap', () => {
    expect(byKey.predictiveParity.values[0]).toBeCloseTo(2 / 3, 10)
    expect(byKey.predictiveParity.values[1]).toBeCloseTo(1 / 2, 10)
  })

  it('marks calibration as not responding to the threshold', () => {
    expect(byKey.calibration.live).toBe(false)
  })

  it('leaves calibration unchanged when the threshold moves', () => {
    const low = fairness(scores, labels, groups, [0.2, 0.2])
    const high = fairness(scores, labels, groups, [0.8, 0.8])
    const a = low.definitions.find((d) => d.key === 'calibration')
    const b = high.definitions.find((d) => d.key === 'calibration')
    expect(a.gap).toBeCloseTo(b.gap, 12)
  })

  it('changes the live definitions when the threshold moves', () => {
    const low = fairness(scores, labels, groups, [0.2, 0.2])
    const high = fairness(scores, labels, groups, [0.8, 0.8])
    const a = low.definitions.find((d) => d.key === 'demographicParity')
    const b = high.definitions.find((d) => d.key === 'demographicParity')
    expect(a.values[0]).not.toBeCloseTo(b.values[0], 6)
  })
})

describe('the impossibility result', () => {
  it('cannot equalize predictive parity and false positive rate at once when base rates differ', () => {
    const n = 4000
    const s = new Float32Array(n)
    const y = new Uint8Array(n)
    const g = new Uint8Array(n)

    let seed = 7
    const random = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648
      return seed / 2147483648
    }

    for (let i = 0; i < n; i++) {
      const group = i < n / 2 ? 0 : 1
      const baseRate = group === 0 ? 0.6 : 0.25
      const positive = random() < baseRate ? 1 : 0
      g[i] = group
      y[i] = positive
      s[i] = Math.min(0.999, Math.max(0.001, (positive ? 0.68 : 0.32) + (random() - 0.5) * 0.5))
    }

    let bestFprGap = Infinity
    let ppvGapThere = null

    for (let ta = 0.05; ta <= 0.95; ta += 0.01) {
      for (let tb = 0.05; tb <= 0.95; tb += 0.01) {
        const r = fairness(s, y, g, [ta, tb])
        const fprGap = r.definitions.find((d) => d.key === 'equalizedOddsFpr').gap
        const tprGap = r.definitions.find((d) => d.key === 'equalizedOddsTpr').gap
        const ppvGap = r.definitions.find((d) => d.key === 'predictiveParity').gap
        if (fprGap === null || tprGap === null || ppvGap === null) continue
        const oddsGap = Math.max(fprGap, tprGap)
        if (oddsGap < bestFprGap) {
          bestFprGap = oddsGap
          ppvGapThere = ppvGap
        }
      }
    }

    expect(bestFprGap).toBeLessThan(0.02)
    expect(ppvGapThere).toBeGreaterThan(0.1)
  })
})

describe('humanCost', () => {
  it('converts rates into counts of people', () => {
    const result = fairness(scores, labels, groups, [0.5, 0.5])
    const cost = humanCost(result.matrices, result.rates)
    expect(cost[0].deniedButQualified).toBe(1)
    expect(cost[1].deniedButQualified).toBe(1)
    expect(cost[0].qualified).toBe(3)
    expect(cost[1].qualified).toBe(2)
    expect(cost[0].total).toBe(5)
  })
})
