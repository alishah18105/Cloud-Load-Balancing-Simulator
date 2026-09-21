import { useEffect, useMemo, useState } from 'react'

import { isComparison, runSimulation } from './lib/api'
import FlowView from './components/FlowView'
import ComparisonView from './components/ComparisonView'
import ConfigPanel from './components/ConfigPanel'
import Dashboard from './components/Dashboard'
import { Button, EmptyState } from './components/Primitives'

const DEFAULT_CONFIG = {
  algorithm: 'least_load',
  numberOfRequests: 1500,
  numberOfServers: 20,
  serverType: 'heterogeneous',
  workloadType: 'medium',
}

function ThemeToggle() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('lb-theme') || 'system',
  )

  useEffect(() => {
    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', theme)
    }

    try {
      localStorage.setItem('lb-theme', theme)
    } catch {
      // Storage can be unavailable (private windows); the toggle still works
      // for this session.
    }
  }, [theme])

  const next = { system: 'light', light: 'dark', dark: 'system' }
  const labels = { system: 'Auto', light: 'Light', dark: 'Dark' }

  return (
    <Button variant="ghost" onClick={() => setTheme(next[theme])} title="Switch theme">
      Theme: {labels[theme]}
    </Button>
  )
}

export default function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('dashboard')
  // Bumped per run so the animation remounts with a fresh playhead.
  const [runId, setRunId] = useState(0)

  const comparison = isComparison(result)

  const tabs = useMemo(() => {
    if (!result) return []

    return comparison
      ? [{ key: 'comparison', label: 'Comparison' }]
      : [
          { key: 'dashboard', label: 'Dashboard' },
          { key: 'flow', label: 'Live Flow' },
        ]
  }, [result, comparison])

  const handleRun = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await runSimulation(config)
      setResult(data)
      setRunId((value) => value + 1)
      setTab(data?.mode === 'comparison' ? 'comparison' : 'dashboard')
    } catch (runError) {
      setError(runError.message)
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full bg-surface-0">
      <header className="border-b border-line bg-surface-1">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-ink">
              Cloud Load Balancing Simulator
            </h1>
            <p className="text-xs text-ink-muted">
              Design &amp; Analysis of Algorithms &mdash; five placement strategies
              under a hard server capacity constraint
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-4 px-4 py-5 sm:px-6">
        <ConfigPanel
          config={config}
          onChange={setConfig}
          onRun={handleRun}
          loading={loading}
        />

        {error && (
          <div
            role="alert"
            className="rounded-xl border px-4 py-3 text-sm"
            style={{ borderColor: 'var(--critical)', color: 'var(--critical)' }}
          >
            {error}
          </div>
        )}

        {tabs.length > 1 && (
          <nav className="flex gap-1 rounded-lg border border-line bg-surface-2 p-0.5">
            {tabs.map((entry) => (
              <button
                key={entry.key}
                type="button"
                onClick={() => setTab(entry.key)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  tab === entry.key
                    ? 'bg-surface-1 text-ink'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {entry.label}
              </button>
            ))}
          </nav>
        )}

        {!result && !loading && !error && (
          <EmptyState>
            Choose a configuration and run a simulation. Pick a single algorithm
            for the dashboard and step-by-step animation, or &ldquo;Compare all
            five&rdquo; to rank them on one shared scenario.
          </EmptyState>
        )}

        {loading && <EmptyState>Running the simulation&hellip;</EmptyState>}

        {result && !loading && comparison && <ComparisonView result={result} />}

        {result && !loading && !comparison && tab === 'dashboard' && (
          <Dashboard result={result} />
        )}

        {result && !loading && !comparison && tab === 'flow' && (
          <FlowView key={runId} config={config} />
        )}
      </main>
    </div>
  )
}
