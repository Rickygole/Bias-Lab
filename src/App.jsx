import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { appReducer, initialState } from './state/appReducer.js'
import { loadDataset } from './data/index.js'
import { fairness, humanCost, overallAccuracy, rocCurve } from './ml/metrics.js'
import TopBar from './components/TopBar.jsx'
import LeftRail from './components/LeftRail.jsx'
import Panel from './components/Panel.jsx'
import ScoreDistribution from './components/ScoreDistribution.jsx'
import ConfusionMatrices from './components/ConfusionMatrices.jsx'
import FairnessTable from './components/FairnessTable.jsx'
import HumanCost from './components/HumanCost.jsx'
import AccuracyBanner from './components/AccuracyBanner.jsx'
import Tour from './components/Tour.jsx'

const EPOCHS = 4000
const LR = 1.5

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const workerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    loadDataset(state.datasetId).then((dataset) => {
      if (!cancelled) dispatch({ type: 'datasetLoaded', dataset })
    })
    return () => {
      cancelled = true
    }
  }, [state.datasetId])

  const train = useCallback(() => {
    if (!state.dataset) return
    dispatch({ type: 'trainStarted' })

    workerRef.current?.terminate()
    const worker = new Worker(new URL('./ml/train.worker.js', import.meta.url), { type: 'module' })
    workerRef.current = worker

    worker.onmessage = (event) => {
      const message = event.data
      if (message.type === 'progress') {
        dispatch({
          type: 'trainProgress',
          epoch: message.epoch,
          point: { epoch: message.epoch, loss: message.loss },
        })
      } else if (message.type === 'done') {
        dispatch({
          type: 'trainDone',
          model: { weights: message.weights, bias: message.bias },
          scores: message.scores,
          history: message.history,
        })
        worker.terminate()
        workerRef.current = null
      }
    }

    worker.postMessage({
      train: state.dataset.train,
      test: { X: state.dataset.test.X },
      epochs: EPOCHS,
      lr: LR,
    })
  }, [state.dataset])

  useEffect(() => () => workerRef.current?.terminate(), [])

  const derived = useMemo(() => {
    if (!state.scores || !state.dataset) return null
    const { y, g } = state.dataset.test
    const result = fairness(state.scores, y, g, state.thresholds)
    return {
      ...result,
      costs: humanCost(result.matrices, result.rates),
      accuracy: overallAccuracy(state.scores, y, g, state.thresholds),
    }
  }, [state.scores, state.dataset, state.thresholds])

  const auc = useMemo(() => {
    if (!state.scores || !state.dataset) return null
    return rocCurve(state.scores, state.dataset.test.y, state.dataset.test.g, null).auc
  }, [state.scores, state.dataset])

  const largestGap = useMemo(() => {
    if (!derived) return null
    const gaps = derived.definitions.filter((d) => d.live && d.gap !== null).map((d) => d.gap)
    return gaps.length ? Math.max(...gaps) : null
  }, [derived])

  const setThreshold = useCallback(
    (group, value) => dispatch({ type: 'setThreshold', group, value }),
    [],
  )

  const dataset = state.dataset
  const groupNames = dataset?.groupNames ?? ['Group A', 'Group B']

  return (
    <div className="flex min-h-dvh flex-col lg:h-dvh">
      <TopBar
        datasetId={state.datasetId}
        onSelect={(id) => dispatch({ type: 'selectDataset', id })}
        onReset={() => dispatch({ type: 'reset' })}
        onTour={() => dispatch({ type: 'setTourStep', step: 0 })}
      />

      <div className="flex flex-1 flex-col lg:min-h-0 lg:flex-row">
        <LeftRail
          datasetId={state.datasetId}
          dataset={dataset}
          status={state.status}
          epoch={state.epoch}
          history={state.history}
          accuracy={derived?.accuracy ?? null}
          auc={auc}
          thresholds={state.thresholds}
          splitMode={state.splitMode}
          onTrain={train}
          onThreshold={setThreshold}
          onSplitMode={(value) => dispatch({ type: 'setSplitMode', value })}
        />

        <main className="flex flex-1 flex-col lg:min-h-0">
          <div className="grid flex-1 grid-cols-1 gap-4 p-6 lg:min-h-0 lg:grid-cols-2 lg:overflow-y-auto">
            <Panel title="Score distributions" note="drag the line">
              <ScoreDistribution
                scores={state.scores}
                groups={dataset?.test.g}
                groupNames={groupNames}
                thresholds={state.thresholds}
                splitMode={state.splitMode}
                onThreshold={setThreshold}
              />
            </Panel>

            <Panel title="Outcomes by group" note="test set" className="order-1 lg:order-none">
              <ConfusionMatrices matrices={derived?.matrices} groupNames={groupNames} />
            </Panel>

            <Panel title="Fairness definitions" note="all at once, on purpose">
              <FairnessTable result={derived} groupNames={groupNames} />
            </Panel>

            <Panel title="What this costs people" note="test set counts">
              <HumanCost
                costs={derived?.costs}
                groupNames={groupNames}
                qualifiedLabel={dataset?.qualifiedLabel ?? 'qualify'}
              />
            </Panel>
          </div>

          <AccuracyBanner accuracy={derived?.accuracy ?? null} largestGap={largestGap} />
        </main>
      </div>

      <Tour
        step={state.tourStep}
        onStep={(step) => dispatch({ type: 'setTourStep', step })}
        onClose={() => dispatch({ type: 'setTourStep', step: null })}
      />
    </div>
  )
}
