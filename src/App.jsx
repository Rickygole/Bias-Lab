import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { appReducer, makeInitialState } from './state/appReducer.js'
import { loadDataset } from './data/index.js'
import { outcomes as outcomeLabels } from './data/cards.js'
import { fairness, humanCost, overallAccuracy, rocCurve } from './ml/metrics.js'
import { runTraining } from './ml/runTraining.js'
import { readUrlState, shouldOpenTour, writeUrlState } from './lib/urlState.js'
import TopBar from './components/TopBar.jsx'
import LeftRail from './components/LeftRail.jsx'
import Panel from './components/Panel.jsx'
import ScoreDistribution from './components/ScoreDistribution.jsx'
import ConfusionMatrices from './components/ConfusionMatrices.jsx'
import FairnessTable, { hollowEquality } from './components/FairnessTable.jsx'
import HumanCost from './components/HumanCost.jsx'
import AccuracyBanner from './components/AccuracyBanner.jsx'
import ThresholdBar from './components/ThresholdBar.jsx'
import Tour from './components/Tour.jsx'

const EPOCHS = 4000
const LR = 1.5
const EMPTY = fairness([], [], [], [0.5, 0.5]).definitions

export default function App() {
  const [state, dispatch] = useReducer(appReducer, undefined, () =>
    makeInitialState({
      ...readUrlState(window.location.search),
      ...(shouldOpenTour(window.location.search, window.sessionStorage) ? { tourStep: 0 } : {}),
    }),
  )
  const cancelRef = useRef(null)

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

    cancelRef.current?.()
    cancelRef.current = runTraining({
      trainSet: state.dataset.train,
      test: state.dataset.test,
      epochs: EPOCHS,
      lr: LR,
      onProgress: (epoch, loss) =>
        dispatch({ type: 'trainProgress', epoch, point: { epoch, loss } }),
      onDone: ({ weights, bias, history, scores }) => {
        cancelRef.current = null
        dispatch({
          type: 'trainDone',
          model: { weights, bias },
          scores,
          history,
        })
      },
    })
  }, [state.dataset])

  useEffect(() => {
    if (state.status === 'ready') train()
  }, [state.status, train])

  useEffect(() => () => cancelRef.current?.(), [])

  useEffect(() => {
    const query = writeUrlState({
      datasetId: state.datasetId,
      thresholds: state.thresholds,
      splitMode: state.splitMode,
    })
    window.history.replaceState(null, '', `${window.location.pathname}${query}`)
  }, [state.datasetId, state.thresholds, state.splitMode])

  const derived = useMemo(() => {
    if (!state.scores || !state.dataset) return null
    const { y, g } = state.dataset.test
    const result = fairness(state.scores, y, g, state.thresholds, outcomeLabels[state.datasetId]?.verbs)
    return {
      ...result,
      costs: humanCost(result.matrices, result.rates),
      accuracy: overallAccuracy(state.scores, y, g, state.thresholds),
    }
  }, [state.scores, state.dataset, state.thresholds, state.datasetId])

  const auc = useMemo(() => {
    if (!state.scores || !state.dataset) return null
    return rocCurve(state.scores, state.dataset.test.y, state.dataset.test.g, null).auc
  }, [state.scores, state.dataset])

  const composition = useMemo(() => {
    if (!state.dataset) return null
    const { y, g } = state.dataset.test
    const size = [0, 0]
    const positives = [0, 0]
    for (let i = 0; i < y.length; i++) {
      if (g[i] !== 0 && g[i] !== 1) continue
      size[g[i]]++
      positives[g[i]] += y[i]
    }
    return [0, 1].map((k) => ({
      n: size[k],
      baseRate: size[k] === 0 ? null : positives[k] / size[k],
    }))
  }, [state.dataset])

  const largestGap = useMemo(() => {
    if (!derived) return null
    const gaps = derived.definitions.filter((d) => d.live && d.gap !== null).map((d) => d.gap)
    return gaps.length ? Math.max(...gaps) : null
  }, [derived])

  const setThreshold = useCallback(
    (group, value) => dispatch({ type: 'setThreshold', group, value }),
    [],
  )

  const hollow = derived ? hollowEquality(derived.definitions, true) : null

  const dataset = state.dataset
  const groupNames = dataset?.groupNames ?? ['Group A', 'Group B']
  const outcomes = outcomeLabels[state.datasetId]
  const trained = derived !== null

  return (
    <div className="flex min-h-dvh w-full max-w-full min-w-0 flex-col overflow-x-clip lg:h-dvh">
      <TopBar
        datasetId={state.datasetId}
        onSelect={(id) => dispatch({ type: 'selectDataset', id })}
        onReset={() => dispatch({ type: 'reset' })}
        onTour={() => dispatch({ type: 'setTourStep', step: 0 })}
      />

      <div className="flex w-full min-w-0 flex-1 flex-col lg:min-h-0 lg:flex-row">
        <LeftRail
          datasetId={state.datasetId}
          dataset={dataset}
          composition={composition}
          status={state.status}
          epoch={state.epoch}
          epochs={EPOCHS}
          history={state.history}
          accuracy={derived?.accuracy ?? null}
          auc={auc}
          thresholds={state.thresholds}
          splitMode={state.splitMode}
          onThreshold={setThreshold}
          onSplitMode={(value) => dispatch({ type: 'setSplitMode', value })}
          onTour={() => dispatch({ type: 'setTourStep', step: 0 })}
        />

        <main className="flex w-full min-w-0 flex-1 flex-col lg:min-h-0">
          <div className="scroller grid min-w-0 flex-1 auto-rows-min grid-cols-1 content-start gap-4 px-4 pt-3.5 pb-2.5 sm:px-6 lg:min-h-0 lg:grid-cols-12 lg:overflow-y-auto lg:px-5">
            <Panel
              title="Score distributions"
              note="share of each group at or above the score"
              className="lg:order-1 lg:col-span-5"
              footer="Drag the line. Everything to its right is approved, and it crosses the two curves at different heights."
            >
              <ScoreDistribution
                scores={state.scores}
                groups={dataset?.test.g}
                groupNames={groupNames}
                thresholds={state.thresholds}
                splitMode={state.splitMode}
                onThreshold={setThreshold}
              />
            </Panel>

            <Panel title="Outcomes by group" className="order-3 lg:order-2 lg:col-span-4">
              <ConfusionMatrices
                matrices={derived?.matrices}
                groupNames={groupNames}
                outcomes={outcomes}
              />
            </Panel>

            <Panel title="Fairness definitions" className="order-1 lg:order-4 lg:col-span-12">
              <FairnessTable
                definitions={derived?.definitions ?? EMPTY}
                groupNames={groupNames}
                ready={trained}
              />
            </Panel>

            <Panel title="What this costs people" className="order-2 lg:order-3 lg:col-span-3">
              <HumanCost
                costs={derived?.costs}
                groupNames={groupNames}
                qualifiedLabel={dataset?.qualifiedLabel ?? 'qualify'}
              />
            </Panel>
          </div>

        </main>
      </div>

      <div className="sticky bottom-0 z-20 shrink-0 bg-bg lg:static">
        <Tour
          step={state.tourStep}
          accuracy={derived?.accuracy ?? null}
          onStep={(step) => dispatch({ type: 'setTourStep', step })}
          onClose={() => dispatch({ type: 'setTourStep', step: null })}
        />
        <ThresholdBar
          thresholds={state.thresholds}
          splitMode={state.splitMode}
          groupNames={groupNames}
          onThreshold={setThreshold}
          onSplitMode={(value) => dispatch({ type: 'setSplitMode', value })}
        />
        <AccuracyBanner
          accuracy={derived?.accuracy ?? null}
          largestGap={largestGap}
          hollow={hollow}
          groupNames={groupNames}
        />
      </div>
    </div>
  )
}
