import { describe, it, expect } from 'vitest'
import { sigmoid, predict, loss, train } from './logreg.js'

describe('sigmoid', () => {
  it('is a half at zero', () => {
    expect(sigmoid(0)).toBe(0.5)
  })

  it('stays in range for large magnitudes', () => {
    expect(sigmoid(1000)).toBe(1)
    expect(sigmoid(-1000)).toBe(0)
    expect(Number.isNaN(sigmoid(-1000))).toBe(false)
  })

  it('is symmetric', () => {
    expect(sigmoid(2) + sigmoid(-2)).toBeCloseTo(1, 12)
  })
})

describe('predict', () => {
  it('applies weights and bias', () => {
    const scores = predict([[1, 0]], [2, 5], -2)
    expect(scores[0]).toBeCloseTo(0.5, 6)
  })
})

describe('loss', () => {
  it('is zero for confident correct answers', () => {
    expect(loss([1, 0], [1, 0])).toBeLessThan(1e-6)
  })

  it('is log 2 for a coin flip', () => {
    expect(loss([1, 0], [0.5, 0.5])).toBeCloseTo(Math.LN2, 10)
  })

  it('is finite when a prediction is exactly wrong', () => {
    expect(Number.isFinite(loss([1], [0]))).toBe(true)
  })
})

describe('train', () => {
  const X = []
  const y = []
  for (let i = 0; i < 400; i++) {
    const x = (i / 400) * 6 - 3
    X.push([x])
    y.push(x > 0.5 ? 1 : 0)
  }

  it('separates a linearly separable problem', () => {
    const model = train(X, y, { epochs: 2000, lr: 1.0, reportEvery: 1e9 })
    const scores = predict(X, model.weights, model.bias)
    let correct = 0
    for (let i = 0; i < y.length; i++) if ((scores[i] >= 0.5 ? 1 : 0) === y[i]) correct++
    expect(correct / y.length).toBeGreaterThan(0.99)
  })

  it('drives loss down monotonically', () => {
    const model = train(X, y, { epochs: 300, lr: 0.5, reportEvery: 10 })
    const history = model.history.map((h) => h.loss)
    expect(history.length).toBe(30)
    for (let i = 1; i < history.length; i++) {
      expect(history[i]).toBeLessThanOrEqual(history[i - 1])
    }
  })

  it('reaches the same optimum from different learning rates', () => {
    const noisyX = []
    const noisyY = []
    for (let i = 0; i < 400; i++) {
      const x = (i / 400) * 6 - 3
      noisyX.push([x])
      noisyY.push(i % 7 === 0 ? (x > 0.5 ? 0 : 1) : x > 0.5 ? 1 : 0)
    }
    const slow = train(noisyX, noisyY, { epochs: 6000, lr: 0.5, reportEvery: 1e9 })
    const fast = train(noisyX, noisyY, { epochs: 6000, lr: 1.5, reportEvery: 1e9 })
    expect(slow.weights[0]).toBeCloseTo(fast.weights[0], 3)
  })

  it('diverges on separable data, which is why the datasets carry label noise', () => {
    const short = train(X, y, { epochs: 500, lr: 1.0, reportEvery: 1e9 })
    const long = train(X, y, { epochs: 4000, lr: 1.0, reportEvery: 1e9 })
    expect(Math.abs(long.weights[0])).toBeGreaterThan(Math.abs(short.weights[0]) * 1.5)
  })
})
