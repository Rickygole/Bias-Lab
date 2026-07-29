import { readFileSync } from 'node:fs'
import { train, predict } from '../src/ml/logreg.js'

const [, , datasetPath, epochsArg, lrArg] = process.argv
const data = JSON.parse(readFileSync(datasetPath, 'utf8'))

const model = train(data.train.X, data.train.y, {
  epochs: Number(epochsArg),
  lr: Number(lrArg),
  reportEvery: 1e9,
})

process.stdout.write(
  JSON.stringify({
    weights: model.weights,
    bias: model.bias,
    scores: Array.from(predict(data.test.X, model.weights, model.bias)),
  }),
)
