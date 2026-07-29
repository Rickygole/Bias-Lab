export const initialState = {
  datasetId: 'loan',
  dataset: null,
  status: 'idle',
  epoch: 0,
  history: [],
  model: null,
  scores: null,
  splitMode: false,
  thresholds: [0.5, 0.5],
  tourStep: null,
}

export function makeInitialState(overrides = {}) {
  const { thresholds, ...rest } = overrides
  return {
    ...initialState,
    ...rest,
    thresholds: thresholds ?? initialState.thresholds,
  }
}

export function appReducer(state, action) {
  switch (action.type) {
    case 'selectDataset':
      return {
        ...initialState,
        datasetId: action.id,
        tourStep: state.tourStep,
      }

    case 'datasetLoaded':
      return { ...state, dataset: action.dataset, status: 'ready' }

    case 'trainStarted':
      return { ...state, status: 'training', epoch: 0, history: [] }

    case 'trainProgress':
      return { ...state, epoch: action.epoch, history: [...state.history, action.point] }

    case 'trainDone':
      return {
        ...state,
        status: 'trained',
        model: action.model,
        scores: action.scores,
        history: action.history,
        epoch: action.history.at(-1)?.epoch ?? state.epoch,
      }

    case 'setThreshold': {
      if (!state.splitMode) return { ...state, thresholds: [action.value, action.value] }
      const next = [...state.thresholds]
      next[action.group] = action.value
      return { ...state, thresholds: next }
    }

    case 'setSplitMode': {
      if (action.value === state.splitMode) return state
      if (action.value) return { ...state, splitMode: true }
      return { ...state, splitMode: false, thresholds: [state.thresholds[0], state.thresholds[0]] }
    }

    case 'reset':
      return { ...initialState, datasetId: state.datasetId, dataset: state.dataset, status: 'ready' }

    case 'setTourStep':
      return { ...state, tourStep: action.step }

    default:
      return state
  }
}
