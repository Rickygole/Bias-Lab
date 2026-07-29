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

describe('App renders', () => {
  it('produces markup without throwing', () => {
    const html = renderToString(<App />)
    expect(html.length).toBeGreaterThan(500)
  })

  it('shows the product name and every dataset choice', () => {
    const html = renderToString(<App />)
    expect(html).toContain('Bias Lab')
    expect(html).toContain('Loan approval')
    expect(html).toContain('College admissions')
    expect(html).toContain('Medical risk')
  })

  it('shows all four panel headings before data arrives', () => {
    const html = renderToString(<App />)
    for (const heading of [
      'Score distributions',
      'Outcomes by group',
      'Fairness definitions',
      'Human cost',
    ]) {
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
    expect(html.length).toBeGreaterThan(500)
  })

  it('survives a hostile query string', () => {
    stubBrowser('?dataset=../etc/passwd&t=NaN&a=&b=999&split=1&tour=yes')
    const html = renderToString(<App />)
    expect(html).toContain('Bias Lab')
  })
})
