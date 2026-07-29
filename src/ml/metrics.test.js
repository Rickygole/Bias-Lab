import { describe, it, expect } from 'vitest'
import {
  confusion,
  rates,
  overallAccuracy,
  expectedCalibrationError,
  calibrationDisparity,
  differenceInterval,
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
    expect(overallAccuracy(scores, labels, groups, [0.5, 0.5])).toBeCloseTo(6 / 10, 10)
  })

  it('honours separate thresholds per group', () => {
    expect(overallAccuracy(scores, labels, groups, [0.5, 0.0])).toBeCloseTo(5 / 10, 10)
  })
})

describe('expectedCalibrationError', () => {
  it('equals the average distance between confidence and outcome', () => {
    const s = Float32Array.from([0.05, 0.05, 0.95, 0.95])
    const y = Uint8Array.from([0, 0, 1, 1])
    const g = Uint8Array.from([0, 0, 0, 0])
    expect(expectedCalibrationError(s, y, g, 0)).toBeCloseTo(0.05, 6)
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

describe('calibrationDisparity', () => {
  it('catches groups miscalibrated in opposite directions, which a difference of error magnitudes cannot', () => {
    const n = 2000
    const s = new Float32Array(n)
    const y = new Uint8Array(n)
    const g = new Uint8Array(n)
    for (let i = 0; i < n; i++) {
      const group = i < n / 2 ? 0 : 1
      const within = i % (n / 2)
      g[i] = group
      s[i] = 0.7
      y[i] = within < (group === 0 ? 800 : 600) ? 1 : 0
    }

    const eceA = expectedCalibrationError(s, y, g, 0)
    const eceB = expectedCalibrationError(s, y, g, 1)
    expect(Math.abs(eceA - eceB)).toBeLessThan(0.001)

    const disparity = calibrationDisparity(s, y, g)
    expect(disparity.worst).toBeCloseTo(0.2, 6)
    expect(disparity.weighted).toBeCloseTo(0.2, 6)
  })

  it('is zero when both groups have the same outcome rate in every bin', () => {
    const s = Float32Array.from([0.2, 0.2, 0.8, 0.8])
    const y = Uint8Array.from([0, 0, 1, 1])
    const g = Uint8Array.from([0, 1, 0, 1])
    expect(calibrationDisparity(s, y, g).worst).toBe(0)
  })

  it('returns null when a group is missing', () => {
    const s = Float32Array.from([0.5, 0.5])
    const y = Uint8Array.from([1, 0])
    const g = Uint8Array.from([0, 0])
    expect(calibrationDisparity(s, y, g)).toBeNull()
  })
})

describe('differenceInterval', () => {
  it('separates a twenty point gap measured on a thousand people', () => {
    const interval = differenceInterval(600, 1000, 400, 1000)
    expect(interval.separated).toBe(true)
    expect(interval.thin).toBe(false)
  })

  it('refuses to separate the identical gap measured on ten people', () => {
    const interval = differenceInterval(6, 10, 4, 10)
    expect(interval.separated).toBe(false)
    expect(interval.thin).toBe(true)
    expect(interval.smallest).toBe(10)
  })

  it('still separates a gap wide enough to survive a small sample', () => {
    expect(differenceInterval(9, 10, 1, 10).separated).toBe(true)
  })

  it('returns null when a denominator is empty', () => {
    expect(differenceInterval(0, 0, 5, 10)).toBeNull()
  })
})

describe('histogram', () => {
  it('ignores scores that are not finite', () => {
    const counts = histogram(
      Float32Array.from([0.5, NaN, -1, 2]),
      Uint8Array.from([0, 0, 0, 0]),
      0,
      20,
    )
    expect(counts.reduce((a, b) => a + b, 0)).toBe(3)
    expect(counts.length).toBe(20)
  })

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

function overlappingFixture(n, baseRateA, baseRateB) {
  const s = new Float32Array(n)
  const y = new Uint8Array(n)
  const g = new Uint8Array(n)

  let seed = 7
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed / 2147483648
  }
  const normal = () => {
    const u = Math.max(1e-9, random())
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random())
  }

  for (let i = 0; i < n; i++) {
    const group = i < n / 2 ? 0 : 1
    const positive = random() < (group === 0 ? baseRateA : baseRateB) ? 1 : 0
    g[i] = group
    y[i] = positive
    s[i] = Math.min(0.999, Math.max(0.001, (positive ? 0.62 : 0.38) + normal() * 0.22))
  }
  return { s, y, g }
}

describe('the impossibility result', () => {
  const { s, y, g } = overlappingFixture(8000, 0.6, 0.25)

  it('has genuine overlap, so the perfect prediction escape clause does not apply', () => {
    const roc = rocCurve(s, y, g, null)
    expect(roc.auc).toBeGreaterThan(0.6)
    expect(roc.auc).toBeLessThan(0.95)
  })

  it('cannot close true positive, false positive and predictive parity gaps together, even with separate thresholds', () => {
    let best = 1

    for (let ta = 0.05; ta <= 0.95; ta += 0.01) {
      for (let tb = 0.05; tb <= 0.95; tb += 0.01) {
        const r = fairness(s, y, g, [ta, tb])
        const byKey = Object.fromEntries(r.definitions.map((d) => [d.key, d]))
        const tprGap = byKey.equalizedOddsTpr.gap
        const fprGap = byKey.equalizedOddsFpr.gap
        const ppvGap = byKey.predictiveParity.gap
        if (tprGap === null || fprGap === null || ppvGap === null) continue

        const selectedA = r.matrices[0].tp + r.matrices[0].fp
        const selectedB = r.matrices[1].tp + r.matrices[1].fp
        if (selectedA / r.matrices[0].n < 0.1 || selectedB / r.matrices[1].n < 0.1) continue
        if (selectedA < 20 || selectedB < 20) continue

        best = Math.min(best, Math.max(tprGap, fprGap, ppvGap))
      }
    }

    expect(best).toBeGreaterThan(0.05)
  })

  it('closes when base rates are equal, which is what makes base rates the cause', () => {
    const equal = overlappingFixture(8000, 0.4, 0.4)
    let best = 1

    for (let ta = 0.3; ta <= 0.7; ta += 0.01) {
      const r = fairness(equal.s, equal.y, equal.g, [ta, ta])
      const byKey = Object.fromEntries(r.definitions.map((d) => [d.key, d]))
      const gaps = [
        byKey.equalizedOddsTpr.gap,
        byKey.equalizedOddsFpr.gap,
        byKey.predictiveParity.gap,
      ]
      if (gaps.some((v) => v === null)) continue
      best = Math.min(best, Math.max(...gaps))
    }

    expect(best).toBeLessThan(0.05)
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

describe('question wording', () => {
  it('defaults to approval language', () => {
    const r = fairness(scores, labels, groups, [0.5, 0.5])
    expect(r.definitions[0].question).toBe('Is the same share of each group approved?')
  })

  it('takes the verbs the dataset supplies', () => {
    const r = fairness(scores, labels, groups, [0.5, 0.5], {
      picked: 'flagged',
      qualify: 'are actually sick',
    })
    const byKey = Object.fromEntries(r.definitions.map((d) => [d.key, d]))
    expect(byKey.demographicParity.question).toBe('Is the same share of each group flagged?')
    expect(byKey.equalOpportunity.question).toBe(
      'Among those who are actually sick, is the same share flagged?',
    )
    expect(byKey.predictiveParity.question).toBe('Among those flagged, is the same share correct?')
  })
})
