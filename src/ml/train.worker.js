import { train, predict } from './logreg.js'

self.onmessage = (event) => {
  const { train: trainSet, test, epochs, lr } = event.data

  const model = train(trainSet.X, trainSet.y, {
    epochs,
    lr,
    onEpoch: (epoch, value) => self.postMessage({ type: 'progress', epoch, loss: value }),
  })

  const scores = predict(test.X, model.weights, model.bias)

  self.postMessage(
    {
      type: 'done',
      weights: model.weights,
      bias: model.bias,
      history: model.history,
      scores,
    },
    [scores.buffer],
  )
}
