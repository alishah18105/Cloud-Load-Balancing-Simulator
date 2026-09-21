import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { ALGORITHMS, LABELS } from '../lib/constants'
import ChartTooltip from './ChartTooltip'
import ServerLoadChart from './ServerLoadChart'
import { Card, LegendSwatch, Select, StatTile } from './Primitives'
import { ConfigTable, RequestTable, ServerResultsTable } from './Tables'

function titleCase(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value
}

/* ---------- Section 3: accepted vs rejected ---------- */

// Accepted / rejected is a STATE, not a series identity, so it uses the
// reserved status colors rather than two categorical slots.
function AcceptedRejectedChart({ rows }) {
  return (
    <div style={{ height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 18, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="2 4" />
          <XAxis
            dataKey="short"
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            cursor={{ fill: 'var(--surface-2)' }}
            content={
              <ChartTooltip
                rows={(row) => [
                  { label: row.label, value: '' },
                  { label: 'Accepted', value: row.accepted, color: 'var(--good)' },
                  { label: 'Rejected', value: row.rejected, color: 'var(--critical)' },
                ]}
              />
            }
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }}
            iconType="square"
            iconSize={9}
          />
          <Bar
            dataKey="accepted"
            name="Accepted"
            fill="var(--good)"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            dataKey="rejected"
            name="Rejected"
            fill="var(--critical)"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ---------- Section 5: one selected performance measure ---------- */

function SingleMeasureChart({ rows, unit }) {
  return (
    <div style={{ height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 20, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="2 4" />
          <XAxis
            dataKey="short"
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            cursor={{ fill: 'var(--surface-2)' }}
            content={
              <ChartTooltip
                rows={(row) => [{ label: row.label, value: `${row.value}${unit}` }]}
              />
            }
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {rows.map((row) => (
              <Cell key={row.key} fill={row.color} />
            ))}
            {/* Direct labels keep every value readable without relying on hue. */}
            <LabelList
              dataKey="value"
              position="top"
              formatter={(value) => `${value}${unit}`}
              style={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

const PERFORMANCE_MEASURES = [
  {
    value: 'average_response_time',
    label: 'Simulated Average Response Time',
    unit: '',
    read: (entry) => entry.metrics.average_response_time,
  },
  {
    value: 'average_processing_time',
    label: 'Simulated Average Processing Time',
    unit: '',
    read: (entry) => entry.metrics.average_processing_time,
  },
]

/* ---------- Section 7: one collapsible detailed result ---------- */

function AlgorithmAccordion({ algorithm, entry, open, onToggle }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface-1">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-2"
      >
        <span
          aria-hidden="true"
          className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
          style={{ background: algorithm.color }}
        />
        <span className="text-sm font-semibold text-ink">{algorithm.label}</span>
        <span className="tnum ml-auto text-xs text-ink-muted">
          {entry.summary.acceptance_rate}% accepted &middot;{' '}
          {entry.metrics.load_imbalance}pp imbalance
        </span>
        <span className="text-ink-muted">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="space-y-5 border-t border-line px-4 py-4">
          <div>
            <h4 className="mb-2 text-xs font-semibold text-ink">Server Results</h4>
            {/* Initial load is omitted here — the shared starting configuration
                is already shown once in section 2. */}
            <ServerResultsTable servers={entry.servers} showInitialLoad={false} />
          </div>

          <div>
            <h4 className="mb-2 text-xs font-semibold text-ink">Request Results</h4>
            <RequestTable requests={entry.requests} />
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- The page ---------- */

export default function ComparisonView({ result }) {
  const { results, configuration, initial_servers: initialServers } = result

  const present = useMemo(
    () => ALGORITHMS.filter((algorithm) => results[algorithm.key]),
    [results],
  )

  const [utilizationAlgorithm, setUtilizationAlgorithm] = useState(present[0]?.key)
  const [performanceMeasure, setPerformanceMeasure] = useState('average_response_time')
  const [openAlgorithm, setOpenAlgorithm] = useState(null)

  const rows = useMemo(
    () =>
      present.map((algorithm) => {
        const entry = results[algorithm.key]
        return {
          key: algorithm.key,
          short: algorithm.short,
          label: algorithm.label,
          color: algorithm.color,
          entry,
          accepted: entry.summary.requests_accepted,
          rejected: entry.summary.requests_rejected,
        }
      }),
    [present, results],
  )

  // Ties are common, so they are reported rather than resolved arbitrarily.
  const bestAcceptance = useMemo(() => {
    if (!rows.length) return null
    const best = Math.max(...rows.map((row) => row.entry.summary.acceptance_rate))
    const tied = rows.filter((row) => row.entry.summary.acceptance_rate === best)
    return {
      value: best,
      label:
        tied.length === rows.length
          ? 'All tied'
          : tied.length > 1
            ? `${tied.length}-way tie`
            : tied[0].label,
    }
  }, [rows])

  const bestImbalance = useMemo(() => {
    if (!rows.length) return null
    const best = Math.min(...rows.map((row) => row.entry.metrics.load_imbalance))
    const tied = rows.filter((row) => row.entry.metrics.load_imbalance === best)
    return {
      value: best,
      label:
        tied.length === rows.length
          ? 'All tied'
          : tied.length > 1
            ? `${tied.length}-way tie`
            : tied[0].label,
    }
  }, [rows])

  const measure = PERFORMANCE_MEASURES.find((item) => item.value === performanceMeasure)
  const selectedUtilization = results[utilizationAlgorithm]

  return (
    <div className="space-y-4">
      {/* 1 — Configuration (common) */}
      <Card
        title="1. Configuration"
        subtitle="Every algorithm received an identical copy of this scenario, so any difference comes from the algorithm alone."
      >
        <ConfigTable
          rows={[
            { label: 'Servers', value: configuration.number_of_servers.toLocaleString() },
            { label: 'Requests', value: configuration.number_of_requests.toLocaleString() },
            { label: 'Server Type', value: titleCase(configuration.server_type) },
            { label: 'Workload', value: titleCase(configuration.workload_type) },
          ]}
        />
      </Card>

      {/* 2 — Initial server configuration (shown once) */}
      <Card
        title="2. Initial Server Configuration"
        subtitle="Shared starting pool. Every algorithm begins from these servers with zero load."
      >
        <div className="max-h-72 overflow-auto">
          <table className="w-full max-w-lg text-left text-xs">
            <thead className="sticky top-0 bg-surface-1 text-ink-muted">
              <tr className="border-b border-line">
                <th className="py-2 pr-4 font-medium">Server</th>
                <th className="py-2 pr-4 text-right font-medium">Capacity</th>
                <th className="py-2 text-right font-medium">Processing Power</th>
              </tr>
            </thead>
            <tbody className="text-ink-soft">
              {(initialServers ?? []).map((server) => (
                <tr key={server.server_id} className="border-b border-line/60">
                  <td className="py-1.5 pr-4 font-medium text-ink">
                    {LABELS.server(server.server_id)}
                  </td>
                  <td className="tnum py-1.5 pr-4 text-right">{server.capacity}</td>
                  <td className="tnum py-1.5 text-right">{server.processing_power}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 3 — Algorithm comparison */}
      <Card
        title="3. Algorithm Comparison"
        subtitle="How many requests each algorithm managed to place"
      >
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatTile
            label="Best acceptance rate"
            value={bestAcceptance?.label ?? '—'}
            hint={`${bestAcceptance?.value}% · higher is better`}
          />
          <StatTile
            label="Best load imbalance"
            value={bestImbalance?.label ?? '—'}
            hint={`${bestImbalance?.value}pp · lower is better`}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-left text-xs">
            <thead className="text-ink-muted">
              <tr className="border-b border-line">
                <th className="py-2 pr-3 font-medium">Algorithm</th>
                <th className="py-2 pr-3 text-right font-medium">Sent</th>
                <th className="py-2 pr-3 text-right font-medium">Accepted</th>
                <th className="py-2 pr-3 text-right font-medium">Rejected</th>
                <th className="py-2 pr-3 text-right font-medium">Acceptance</th>
                <th className="py-2 text-right font-medium">Rejection</th>
              </tr>
            </thead>
            <tbody className="text-ink-soft">
              {rows.map((row) => (
                <tr key={row.key} className="border-b border-line/60">
                  <td className="py-2 pr-3">
                    <span className="inline-flex items-center gap-2 font-medium text-ink">
                      <span
                        aria-hidden="true"
                        className="inline-block h-2.5 w-2.5 rounded-sm"
                        style={{ background: row.color }}
                      />
                      {row.label}
                    </span>
                  </td>
                  <td className="tnum py-2 pr-3 text-right">
                    {row.entry.summary.requests_sent.toLocaleString()}
                  </td>
                  <td className="tnum py-2 pr-3 text-right">
                    {row.accepted.toLocaleString()}
                  </td>
                  <td className="tnum py-2 pr-3 text-right">
                    {row.rejected.toLocaleString()}
                  </td>
                  <td className="tnum py-2 pr-3 text-right">
                    {row.entry.summary.acceptance_rate}%
                  </td>
                  <td className="tnum py-2 text-right">
                    {row.entry.summary.rejection_rate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5">
          <h4 className="mb-2 text-xs font-semibold text-ink">Accepted vs Rejected</h4>
          <AcceptedRejectedChart rows={rows} />
        </div>
      </Card>

      {/* 4 — Load balancing metrics */}
      <Card
        title="4. Load Balancing Metrics"
        subtitle="How evenly each algorithm spread the load across the pool"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-left text-xs">
            <thead className="text-ink-muted">
              <tr className="border-b border-line">
                <th className="py-2 pr-3 font-medium">Algorithm</th>
                <th className="py-2 pr-3 text-right font-medium">Avg Utilization</th>
                <th className="py-2 pr-3 text-right font-medium">Max Utilization</th>
                <th className="py-2 pr-3 text-right font-medium">Min Utilization</th>
                <th className="py-2 pr-3 text-right font-medium">Load Imbalance</th>
                <th className="py-2 text-right font-medium">Servers Used</th>
              </tr>
            </thead>
            <tbody className="text-ink-soft">
              {rows.map((row) => (
                <tr key={row.key} className="border-b border-line/60">
                  <td className="py-2 pr-3">
                    <span className="inline-flex items-center gap-2 font-medium text-ink">
                      <span
                        aria-hidden="true"
                        className="inline-block h-2.5 w-2.5 rounded-sm"
                        style={{ background: row.color }}
                      />
                      {row.label}
                    </span>
                  </td>
                  <td className="tnum py-2 pr-3 text-right">
                    {row.entry.metrics.average_utilization}%
                  </td>
                  <td className="tnum py-2 pr-3 text-right">
                    {row.entry.metrics.maximum_utilization}%
                  </td>
                  <td className="tnum py-2 pr-3 text-right">
                    {row.entry.metrics.minimum_utilization}%
                  </td>
                  <td className="tnum py-2 pr-3 text-right">
                    {row.entry.metrics.load_imbalance}
                  </td>
                  <td className="tnum py-2 text-right">
                    {row.entry.metrics.servers_used} / {configuration.number_of_servers}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-xs font-semibold text-ink">
              Server utilization for one algorithm
            </h4>
            <div className="w-56">
              <Select
                value={utilizationAlgorithm}
                onChange={setUtilizationAlgorithm}
                options={present.map((algorithm) => ({
                  value: algorithm.key,
                  label: algorithm.label,
                }))}
              />
            </div>
          </div>

          {selectedUtilization && (
            <ServerLoadChart
              servers={selectedUtilization.servers}
              height={Math.max(220, selectedUtilization.servers.length * 26)}
            />
          )}
        </div>
      </Card>

      {/* 5 — Performance metrics */}
      <Card
        title="5. Performance Metrics"
        subtitle="Simulated timings derived from workload and processing power — this is a simulation, not a real distributed system."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-left text-xs">
            <thead className="text-ink-muted">
              <tr className="border-b border-line">
                <th className="py-2 pr-3 font-medium">Algorithm</th>
                <th className="py-2 pr-3 text-right font-medium">
                  Simulated Avg Processing Time
                </th>
                <th className="py-2 text-right font-medium">
                  Simulated Avg Response Time
                </th>
              </tr>
            </thead>
            <tbody className="text-ink-soft">
              {rows.map((row) => (
                <tr key={row.key} className="border-b border-line/60">
                  <td className="py-2 pr-3">
                    <span className="inline-flex items-center gap-2 font-medium text-ink">
                      <span
                        aria-hidden="true"
                        className="inline-block h-2.5 w-2.5 rounded-sm"
                        style={{ background: row.color }}
                      />
                      {row.label}
                    </span>
                  </td>
                  <td className="tnum py-2 pr-3 text-right">
                    {row.entry.metrics.average_processing_time}
                  </td>
                  <td className="tnum py-2 text-right">
                    {row.entry.metrics.average_response_time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-xs font-semibold text-ink">Performance metric</h4>
            <div className="w-72">
              <Select
                value={performanceMeasure}
                onChange={setPerformanceMeasure}
                options={PERFORMANCE_MEASURES}
              />
            </div>
          </div>

          <SingleMeasureChart
            unit={measure.unit}
            rows={rows.map((row) => ({
              key: row.key,
              short: row.short,
              label: row.label,
              color: row.color,
              value: measure.read(row.entry),
            }))}
          />
        </div>
      </Card>

      {/* 6 — Algorithm information (static / theoretical) */}
      <Card
        title="6. Algorithm Information"
        subtitle="Theoretical properties of the implementations in backend/algorithms/ — n = requests, m = servers, W = weighted slots, p = population (50), g = generations (50)."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-200 text-left text-xs">
            <thead className="text-ink-muted">
              <tr className="border-b border-line">
                <th className="py-2 pr-3 font-medium">Algorithm</th>
                <th className="py-2 pr-3 font-medium">Approach</th>
                <th className="py-2 pr-3 font-medium">Time Complexity</th>
                <th className="py-2 pr-3 font-medium">Space Complexity</th>
                <th className="py-2 pr-3 text-center font-medium">Priority</th>
                <th className="py-2 text-center font-medium">Processing Power</th>
              </tr>
            </thead>
            <tbody className="text-ink-soft">
              {present.map((algorithm) => (
                <tr key={algorithm.key} className="border-b border-line/60 align-top">
                  <td className="py-2 pr-3">
                    <span className="inline-flex items-center gap-2 font-medium text-ink">
                      <span
                        aria-hidden="true"
                        className="inline-block h-2.5 w-2.5 rounded-sm"
                        style={{ background: algorithm.color }}
                      />
                      {algorithm.label}
                    </span>
                  </td>
                  <td className="py-2 pr-3">
                    {algorithm.approach}
                    <span className="mt-0.5 block text-ink-muted">{algorithm.note}</span>
                  </td>
                  <td className="tnum py-2 pr-3 font-medium text-ink">{algorithm.time}</td>
                  <td className="tnum py-2 pr-3">{algorithm.space}</td>
                  <td className="py-2 pr-3 text-center">
                    {algorithm.priority ? (
                      <span style={{ color: 'var(--good)' }}>✓ Yes</span>
                    ) : (
                      <span className="text-ink-muted">✕ No</span>
                    )}
                  </td>
                  <td className="py-2 text-center">
                    {algorithm.processingPower ? (
                      <span style={{ color: 'var(--good)' }}>✓ Yes</span>
                    ) : (
                      <span className="text-ink-muted">✕ No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-ink-muted">
          Round Robin and Weighted Round Robin are O(n · m) and O(n · W) rather than
          O(n), because each request falls back to scanning the remaining servers
          when its first choice has no capacity left.
        </p>
      </Card>

      {/* 7 — Detailed results, collapsed by default */}
      <Card
        title="7. Detailed Algorithm Results"
        subtitle="Expand one algorithm at a time to see its final servers and its request assignments."
      >
        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-2">
          {present.map((algorithm) => (
            <LegendSwatch
              key={algorithm.key}
              color={algorithm.color}
              label={algorithm.label}
            />
          ))}
        </div>

        <div className="space-y-2">
          {present.map((algorithm) => (
            <AlgorithmAccordion
              key={algorithm.key}
              algorithm={algorithm}
              entry={results[algorithm.key]}
              open={openAlgorithm === algorithm.key}
              onToggle={() =>
                setOpenAlgorithm((current) =>
                  current === algorithm.key ? null : algorithm.key,
                )
              }
            />
          ))}
        </div>
      </Card>
    </div>
  )
}
