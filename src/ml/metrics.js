export function confusion(scores, labels, groups, group, threshold) {
  let tp = 0
  let fp = 0
  let fn = 0
  let tn = 0

  for (let i = 0; i < scores.length; i++) {
    if (groups[i] !== group) continue
    const predicted = scores[i] >= threshold
    const actual = labels[i] === 1
    if (predicted && actual) tp++
    else if (predicted && !actual) fp++
    else if (!predicted && actual) fn++
    else tn++
  }

  return { tp, fp, fn, tn, n: tp + fp + fn + tn }
}

function rate(numerator, denominator) {
  return denominator === 0 ? null : numerator / denominator
}

export function rates(matrix) {
  const { tp, fp, fn, tn, n } = matrix
  return {
    selectionRate: rate(tp + fp, n),
    tpr: rate(tp, tp + fn),
    fpr: rate(fp, fp + tn),
    fnr: rate(fn, tp + fn),
    ppv: rate(tp, tp + fp),
    accuracy: rate(tp + tn, n),
    baseRate: rate(tp + fn, n),
  }
}

export function overallAccuracy(scores, labels, groups, thresholds) {
  let correct = 0
  for (let i = 0; i < scores.length; i++) {
    const predicted = scores[i] >= thresholds[groups[i]] ? 1 : 0
    if (predicted === labels[i]) correct++
  }
  return correct / scores.length
}

export function expectedCalibrationError(scores, labels, groups, group, bins = 10) {
  const counts = new Array(bins).fill(0)
  const sumScore = new Array(bins).fill(0)
  const sumLabel = new Array(bins).fill(0)
  let total = 0

  for (let i = 0; i < scores.length; i++) {
    if (groups[i] !== group) continue
    if (!Number.isFinite(scores[i])) continue
    const bin = Math.min(bins - 1, Math.max(0, Math.floor(scores[i] * bins)))
    counts[bin]++
    sumScore[bin] += scores[i]
    sumLabel[bin] += labels[i]
    total++
  }

  if (total === 0) return null

  let error = 0
  for (let b = 0; b < bins; b++) {
    if (counts[b] === 0) continue
    const confidence = sumScore[b] / counts[b]
    const observed = sumLabel[b] / counts[b]
    error += (counts[b] / total) * Math.abs(confidence - observed)
  }
  return error
}

export function calibrationDisparity(scores, labels, groups, bins = 10) {
  const counts = [new Array(bins).fill(0), new Array(bins).fill(0)]
  const positives = [new Array(bins).fill(0), new Array(bins).fill(0)]
  const totals = [0, 0]

  for (let i = 0; i < scores.length; i++) {
    const g = groups[i]
    if (g !== 0 && g !== 1) continue
    const bin = Math.min(bins - 1, Math.max(0, Math.floor(scores[i] * bins)))
    counts[g][bin]++
    positives[g][bin] += labels[i]
    totals[g]++
  }

  if (totals[0] === 0 || totals[1] === 0) return null

  let weighted = 0
  let mass = 0
  let worst = 0

  for (let b = 0; b < bins; b++) {
    const nA = counts[0][b]
    const nB = counts[1][b]
    if (nA === 0 || nB === 0) continue
    const observedA = positives[0][b] / nA
    const observedB = positives[1][b] / nB
    const difference = Math.abs(observedA - observedB)
    const share = (nA + nB) / (totals[0] + totals[1])
    weighted += share * difference
    mass += share
    if (difference > worst) worst = difference
  }

  return mass === 0 ? null : { weighted: weighted / mass, worst, coverage: mass }
}

export function reliabilityCurve(scores, labels, groups, group, bins = 10) {
  const counts = new Array(bins).fill(0)
  const sumScore = new Array(bins).fill(0)
  const sumLabel = new Array(bins).fill(0)

  for (let i = 0; i < scores.length; i++) {
    if (groups[i] !== group) continue
    const bin = Math.min(bins - 1, Math.floor(scores[i] * bins))
    counts[bin]++
    sumScore[bin] += scores[i]
    sumLabel[bin] += labels[i]
  }

  return counts.map((count, b) => ({
    bin: b,
    count,
    confidence: count === 0 ? null : sumScore[b] / count,
    observed: count === 0 ? null : sumLabel[b] / count,
  }))
}

export function histogram(scores, groups, group, bins = 20) {
  const counts = new Array(bins).fill(0)
  for (let i = 0; i < scores.length; i++) {
    if (groups[i] !== group) continue
    if (!Number.isFinite(scores[i])) continue
    counts[Math.min(bins - 1, Math.max(0, Math.floor(scores[i] * bins)))]++
  }
  return counts
}

export function rocCurve(scores, labels, groups, group) {
  const rows = []
  for (let i = 0; i < scores.length; i++) {
    if (groups[i] === group || group === null) rows.push([scores[i], labels[i]])
  }
  rows.sort((a, b) => b[0] - a[0])

  const positives = rows.reduce((sum, r) => sum + r[1], 0)
  const negatives = rows.length - positives
  if (positives === 0 || negatives === 0) return { points: [], auc: null }

  const points = [{ fpr: 0, tpr: 0 }]
  let tp = 0
  let fp = 0
  let auc = 0
  let previousFpr = 0
  let previousTpr = 0

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][1] === 1) tp++
    else fp++
    if (i + 1 < rows.length && rows[i + 1][0] === rows[i][0]) continue
    const tpr = tp / positives
    const fpr = fp / negatives
    auc += ((fpr - previousFpr) * (tpr + previousTpr)) / 2
    points.push({ fpr, tpr })
    previousFpr = fpr
    previousTpr = tpr
  }

  return { points, auc }
}

function gap(a, b) {
  return a === null || b === null ? null : Math.abs(a - b)
}

const Z = 1.96
const MIN_CELL = 20

export function differenceInterval(countA, totalA, countB, totalB) {
  if (totalA === 0 || totalB === 0) return null

  const pA = (countA + 1) / (totalA + 2)
  const pB = (countB + 1) / (totalB + 2)
  const se = Math.sqrt(
    (pA * (1 - pA)) / (totalA + 2) + (pB * (1 - pB)) / (totalB + 2),
  )
  const centre = pA - pB
  const margin = Z * se

  return {
    margin,
    low: Math.abs(centre) - margin,
    high: Math.abs(centre) + margin,
    separated: Math.abs(centre) > margin,
    thin: Math.min(totalA, totalB) < MIN_CELL,
    smallest: Math.min(totalA, totalB),
  }
}

export function fairness(scores, labels, groups, thresholds) {
  const matrixA = confusion(scores, labels, groups, 0, thresholds[0])
  const matrixB = confusion(scores, labels, groups, 1, thresholds[1])
  const a = rates(matrixA)
  const b = rates(matrixB)

  const eceA = expectedCalibrationError(scores, labels, groups, 0)
  const eceB = expectedCalibrationError(scores, labels, groups, 1)
  const disparity = calibrationDisparity(scores, labels, groups)

  const A = matrixA
  const B = matrixB

  return {
    matrices: [matrixA, matrixB],
    rates: [a, b],
    definitions: [
      {
        key: 'demographicParity',
        name: 'Demographic parity',
        question: 'Is the same share of each group approved?',
        live: true,
        values: [a.selectionRate, b.selectionRate],
        gap: gap(a.selectionRate, b.selectionRate),
        interval: differenceInterval(A.tp + A.fp, A.n, B.tp + B.fp, B.n),
      },
      {
        key: 'equalOpportunity',
        name: 'Equal opportunity',
        question: 'Among those who qualify, is the same share approved?',
        live: true,
        values: [a.tpr, b.tpr],
        gap: gap(a.tpr, b.tpr),
        interval: differenceInterval(A.tp, A.tp + A.fn, B.tp, B.tp + B.fn),
      },
      {
        key: 'equalizedOddsTpr',
        name: 'Equalized odds, true positive rate',
        question: 'Same true positive rate across groups?',
        live: true,
        group: 'equalizedOdds',
        values: [a.tpr, b.tpr],
        gap: gap(a.tpr, b.tpr),
        interval: differenceInterval(A.tp, A.tp + A.fn, B.tp, B.tp + B.fn),
      },
      {
        key: 'equalizedOddsFpr',
        name: 'Equalized odds, false positive rate',
        question: 'Same false positive rate across groups?',
        live: true,
        group: 'equalizedOdds',
        values: [a.fpr, b.fpr],
        gap: gap(a.fpr, b.fpr),
        interval: differenceInterval(A.fp, A.fp + A.tn, B.fp, B.fp + B.tn),
      },
      {
        key: 'predictiveParity',
        name: 'Predictive parity',
        question: 'Among those approved, is the same share correct?',
        live: true,
        values: [a.ppv, b.ppv],
        gap: gap(a.ppv, b.ppv),
        interval: differenceInterval(A.tp, A.tp + A.fp, B.tp, B.tp + B.fp),
      },
      {
        key: 'calibration',
        name: 'Calibration',
        question: 'Does a score of 0.7 mean 70 percent for both groups?',
        live: false,
        values: [eceA, eceB],
        gap: disparity === null ? null : disparity.weighted,
        detail: disparity,
      },
    ],
  }
}

export function humanCost(matrices, rates) {
  return [0, 1].map((g) => ({
    deniedButQualified: matrices[g].fn,
    approvedButNot: matrices[g].fp,
    qualified: matrices[g].tp + matrices[g].fn,
    total: matrices[g].n,
    missRate: rates[g].fnr,
  }))
}
