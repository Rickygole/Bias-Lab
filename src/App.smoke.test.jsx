import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import App from './App.jsx'

function stubBrowser(search = '') {
  vi.stubGlobal('window', {
    location: { search, pathname: '/Bias-Lab/' },
    history: { replaceState: () => {} },
  })
  vi.stubGlobal('Worker', undefined)
}

beforeEach(() => stubBrowser())
afterEach(() => vi.unstubAllGlobals())

const PANELS = [
  'Score distributions',
  'Outcomes by group',
  'Fairness definitions',
  'What this costs people',
]

describe('App on a bare url', () => {
  it('produces markup without throwing', () => {
    const html = renderToString(<App />)
    expect(html.length).toBeGreaterThan(500)
  })

  it('opens on the picker rather than the instrument', () => {
    const html = renderToString(<App />)
    expect(html).toContain('Choose a dataset')
    expect(html).toContain('What is wrong with the label')
    for (const heading of PANELS) {
      expect(html).not.toContain(heading)
    }
  })

  it('shows the product name and every dataset choice', () => {
    const html = renderToString(<App />)
    expect(html).toContain('Bias Lab')
    expect(html).toContain('Loan approval')
    expect(html).toContain('College admissions')
    expect(html).toContain('Medical risk')
  })

  it('says what a threshold is and offers a way in', () => {
    const html = renderToString(<App />)
    expect(html).toContain('threshold')
    expect(html).toContain('Load and train')
  })

  it('lists every dataset in the selector and explains the selected one', () => {
    const html = renderToString(<App />)
    expect(html).toContain('real data')
    expect(html).toContain('synthetic')
    expect(html).toContain('What is wrong with the label')
  })

  it('holds the tour back until the instrument is on screen', () => {
    const html = renderToString(<App />)
    expect(html).not.toContain('Guided tour')
  })
})

describe('App under url parameters', () => {
  it('skips the picker for any query at all', () => {
    for (const search of ['?dataset=medical&t=0.65', '?tour=1', '?utm_source=slides']) {
      stubBrowser(search)
      const html = renderToString(<App />)
      expect(html).not.toContain('Choose a dataset')
      expect(html).toContain('Score distributions')
    }
  })

  it('shows all four panel headings before data arrives', () => {
    stubBrowser('?dataset=loan')
    const html = renderToString(<App />)
    for (const heading of PANELS) {
      expect(html).toContain(heading)
    }
  })

  it('renders under a url that selects a dataset and threshold', () => {
    stubBrowser('?dataset=medical&t=0.65')
    const html = renderToString(<App />)
    expect(html).toContain('Bias Lab')
    expect(html.length).toBeGreaterThan(500)
  })

  it('renders under separate threshold mode', () => {
    stubBrowser('?dataset=loan&split=1&a=0.62&b=0.44')
    const html = renderToString(<App />)
    expect(html.length).toBeGreaterThan(500)
  })

  it('renders with the tour open', () => {
    stubBrowser('?tour=1')
    const html = renderToString(<App />)
    expect(html).toContain('Guided tour')
    expect(html.length).toBeGreaterThan(500)
  })

  it('survives a hostile query string', () => {
    stubBrowser('?dataset=../etc/passwd&t=NaN&a=&b=999&split=1&tour=yes')
    const html = renderToString(<App />)
    expect(html).toContain('Bias Lab')
    expect(html).not.toContain('Choose a dataset')
  })
})
