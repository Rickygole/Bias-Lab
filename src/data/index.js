export const datasetIds = ['loan', 'admissions', 'medical']

export const datasetNames = {
  loan: 'Loan approval',
  admissions: 'College admissions',
  medical: 'Medical risk',
}

const loaders = {
  loan: () => import('./loan.json'),
  admissions: () => import('./admissions.json'),
  medical: () => import('./medical.json'),
}

export async function loadDataset(id) {
  const module = await loaders[id]()
  const raw = module.default
  return {
    ...raw,
    test: {
      X: raw.test.X,
      y: Uint8Array.from(raw.test.y),
      g: Uint8Array.from(raw.test.g),
    },
  }
}
