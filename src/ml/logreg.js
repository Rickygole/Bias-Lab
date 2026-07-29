export function sigmoid(z) {
  return z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z))
}

export function predict(X, weights, bias) {
  const n = X.length
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const row = X[i]
    let z = bias
    for (let j = 0; j < row.length; j++) z += row[j] * weights[j]
    out[i] = sigmoid(z)
  }
  return out
}

export function loss(y, scores) {
  const eps = 1e-12
  let total = 0
  for (let i = 0; i < y.length; i++) {
    const p = Math.min(1 - eps, Math.max(eps, scores[i]))
    total += y[i] === 1 ? -Math.log(p) : -Math.log(1 - p)
  }
  return total / y.length
}

export function step(X, y, weights, bias, lr) {
  const n = X.length
  const d = weights.length
  const gradW = new Float64Array(d)
  let gradB = 0

  for (let i = 0; i < n; i++) {
    const row = X[i]
    let z = bias
    for (let j = 0; j < d; j++) z += row[j] * weights[j]
    const error = sigmoid(z) - y[i]
    for (let j = 0; j < d; j++) gradW[j] += error * row[j]
    gradB += error
  }

  const next = new Float64Array(d)
  for (let j = 0; j < d; j++) next[j] = weights[j] - (lr * gradW[j]) / n
  return { weights: next, bias: bias - (lr * gradB) / n }
}

export function train(X, y, { epochs = 600, lr = 0.5, onEpoch = null, reportEvery = 10 } = {}) {
  let weights = new Float64Array(X[0].length)
  let bias = 0
  const history = []

  for (let epoch = 1; epoch <= epochs; epoch++) {
    const updated = step(X, y, weights, bias, lr)
    weights = updated.weights
    bias = updated.bias

    if (epoch % reportEvery === 0 || epoch === epochs) {
      const value = loss(y, predict(X, weights, bias))
      history.push({ epoch, loss: value })
      if (onEpoch) onEpoch(epoch, value)
    }
  }

  return { weights: Array.from(weights), bias, history }
}
