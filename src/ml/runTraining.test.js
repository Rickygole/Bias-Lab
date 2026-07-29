import { describe, it, expect, vi, afterEach } from 'vitest'
import { runTraining } from './runTraining.js'

const dataset = {
  trainSet: { X: [[-2], [-1], [1], [2]], y: [0, 0, 1, 1] },
  test: { X: [[-2], [2]] },
  epochs: 200,
  lr: 0.5,
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('runTraining', () => {
  it('falls back to the main thread when Worker is unavailable', async () => {
    vi.stubGlobal('Worker', undefined)

    const result = await new Promise((resolve) => {
      runTraining({ ...dataset, onProgress: () => {}, onDone: resolve })
    })

    expect(result.scores.length).toBe(2)
    expect(result.scores[0]).toBeLessThan(result.scores[1])
    expect(Number.isFinite(result.bias)).toBe(true)
  })

  it('falls back when the worker throws on construction', async () => {
    vi.stubGlobal(
      'Worker',
      class {
        constructor() {
          throw new Error('blocked')
        }
      },
    )

    const result = await new Promise((resolve) => {
      runTraining({ ...dataset, onProgress: () => {}, onDone: resolve })
    })

    expect(result.weights.length).toBe(1)
  })

  it('falls back when the worker reports an error', async () => {
    const instances = []
    vi.stubGlobal(
      'Worker',
      class {
        constructor() {
          instances.push(this)
        }
        postMessage() {
          setTimeout(() => this.onerror?.(new Error('boom')), 0)
        }
        terminate() {}
      },
    )

    const result = await new Promise((resolve) => {
      runTraining({ ...dataset, onProgress: () => {}, onDone: resolve })
    })

    expect(instances.length).toBe(1)
    expect(result.scores.length).toBe(2)
  })

  it('uses the worker result when the worker answers', async () => {
    vi.stubGlobal(
      'Worker',
      class {
        postMessage() {
          setTimeout(() => {
            this.onmessage({
              data: {
                type: 'done',
                weights: [9],
                bias: 9,
                history: [{ epoch: 1, loss: 0.1 }],
                scores: Float32Array.from([0.25, 0.75]),
              },
            })
          }, 0)
        }
        terminate() {}
      },
    )

    const result = await new Promise((resolve) => {
      runTraining({ ...dataset, onProgress: () => {}, onDone: resolve })
    })

    expect(result.bias).toBe(9)
  })

  it('does not deliver a result after the caller cancels', async () => {
    vi.stubGlobal(
      'Worker',
      class {
        postMessage() {
          setTimeout(() => this.onerror?.(new Error('late')), 5)
        }
        terminate() {}
      },
    )

    const onDone = vi.fn()
    const cancel = runTraining({ ...dataset, onProgress: () => {}, onDone })
    cancel()

    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(onDone).not.toHaveBeenCalled()
  })
})
