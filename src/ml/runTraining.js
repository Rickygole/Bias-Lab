import { train, predict } from './logreg.js'

const WORKER_DEADLINE = 6000

function runOnMainThread({ trainSet, test, epochs, lr, onProgress, onDone }) {
  const model = train(trainSet.X, trainSet.y, {
    epochs,
    lr,
    onEpoch: onProgress,
  })
  onDone({
    weights: model.weights,
    bias: model.bias,
    history: model.history,
    scores: predict(test.X, model.weights, model.bias),
  })
}

export function runTraining({ trainSet, test, epochs, lr, onProgress, onDone }) {
  let settled = false
  let worker = null
  let deadline = null

  const finish = (payload) => {
    if (settled) return
    settled = true
    clearTimeout(deadline)
    worker?.terminate()
    worker = null
    onDone(payload)
  }

  const fallback = () => {
    if (settled) return
    clearTimeout(deadline)
    worker?.terminate()
    worker = null
    setTimeout(() => {
      if (settled) return
      settled = true
      runOnMainThread({ trainSet, test, epochs, lr, onProgress, onDone })
    }, 0)
  }

  try {
    worker = new Worker(new URL('./train.worker.js', import.meta.url), { type: 'module' })
  } catch {
    fallback()
    return () => {}
  }

  deadline = setTimeout(fallback, WORKER_DEADLINE)

  worker.onerror = fallback
  worker.onmessageerror = fallback

  worker.onmessage = (event) => {
    const message = event.data
    if (message.type === 'progress') {
      clearTimeout(deadline)
      deadline = setTimeout(fallback, WORKER_DEADLINE)
      onProgress(message.epoch, message.loss)
    } else if (message.type === 'done') {
      finish({
        weights: message.weights,
        bias: message.bias,
        history: message.history,
        scores: message.scores,
      })
    }
  }

  worker.postMessage({ train: trainSet, test: { X: test.X }, epochs, lr })

  return () => {
    settled = true
    clearTimeout(deadline)
    worker?.terminate()
    worker = null
  }
}
