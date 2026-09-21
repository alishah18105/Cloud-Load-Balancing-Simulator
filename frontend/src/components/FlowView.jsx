import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ALGORITHM_BY_KEY } from '../lib/constants'
import { runTimeline } from '../lib/api'
import FlowTopology from './FlowTopology'
import { layoutServers } from '../lib/layout'
import { Button, Card, EmptyState, Field, NumberInput, StatTile } from './Primitives'

// How long, in simulated seconds, a request is drawn travelling down its wire.
// Presentation only — the model dispatches instantly — so it is labelled as
// such in the UI rather than passed off as network latency. It scales with the
// arrival rate so the wires read as a stream at 2/s and are not a solid smear
// at 500/s.
const TARGET_IN_FLIGHT = 14

function transitFor(arrivalRate) {
  if (!arrivalRate || arrivalRate <= 0) return 1.2
  return Math.min(20, Math.max(0.35, TARGET_IN_FLIGHT / arrivalRate))
}

const SPEEDS = [
  { label: '0.5x', multiplier: 0.5 },
  { label: '1x', multiplier: 1 },
  { label: '4x', multiplier: 4 },
  { label: '20x', multiplier: 20 },
  { label: '100x', multiplier: 100 },
]

const MAX_PARTICLES = 90

export default function FlowView({ config }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [arrivalRate, setArrivalRate] = useState(2)
  const [clock, setClock] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speedIndex, setSpeedIndex] = useState(2)

  const algorithm = ALGORITHM_BY_KEY[config.algorithm]
  // Derived from the rate the RUN used, not the current input box.
  const transit = useMemo(
    () => transitFor(data?.configuration?.arrival_rate ?? 0),
    [data],
  )
  const duration = data?.duration ?? 0

  /* ---------------- data ---------------- */

  const run = useCallback(async () => {
    setLoading(true)
    setError(null)
    setPlaying(false)

    try {
      const result = await runTimeline(config, arrivalRate)
      setData(result)
      setClock(0)
      setPlaying(true)
    } catch (runError) {
      setError(runError.message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [config, arrivalRate])

  /* ---------------- clock ---------------- */

  const frame = useRef(0)
  const last = useRef(0)

  useEffect(() => {
    if (!playing || !duration) return undefined

    last.current = performance.now()

    const tick = (now) => {
      const elapsed = (now - last.current) / 1000
      last.current = now

      setClock((current) => {
        const next = current + elapsed * SPEEDS[speedIndex].multiplier
        return next >= duration ? duration : next
      })

      frame.current = requestAnimationFrame(tick)
    }

    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [playing, speedIndex, duration])

  const finished = duration > 0 && clock >= duration

  useEffect(() => {
    if (playing && finished) setPlaying(false)
  }, [playing, finished])

  /* ---------------- derived state ---------------- */

  // Stable across frames: a fresh [] each render would invalidate every memo
  // below, and this component re-renders on every animation frame.
  const servers = useMemo(() => data?.servers ?? [], [data])
  const positions = useMemo(() => layoutServers(servers.length), [servers.length])

  // Requests sorted by arrival, so the particle sweep is a moving window
  // rather than a full scan every frame.
  const byArrival = useMemo(() => {
    if (!data) return []
    return [...data.requests].sort((a, b) => a.arrival - b.arrival)
  }, [data])

  const serverColumn = useMemo(() => {
    const map = new Map()
    servers.forEach((server, index) => map.set(server.server_id, index))
    return map
  }, [servers])

  // Cumulative dispatches per server on the sample grid, used for line
  // thickness (each server's share of the traffic so far).
  const dispatchGrid = useMemo(() => {
    if (!data || !data.samples.length) return []

    const step = data.duration / (data.samples.length - 1 || 1)
    const grid = data.samples.map(() => new Array(servers.length).fill(0))

    data.requests.forEach((record) => {
      if (record.status !== 'accepted') return
      const column = serverColumn.get(record.server)
      if (column == null) return

      const bucket = Math.min(grid.length - 1, Math.floor(record.arrival / step))
      grid[bucket][column] += 1
    })

    for (let index = 1; index < grid.length; index += 1) {
      for (let column = 0; column < servers.length; column += 1) {
        grid[index][column] += grid[index - 1][column]
      }
    }

    return grid
  }, [data, servers.length, serverColumn])

  const sampleIndex = useMemo(() => {
    if (!data || !data.samples.length) return 0
    const step = data.duration / (data.samples.length - 1 || 1)
    if (!step) return 0
    return Math.max(0, Math.min(data.samples.length - 1, Math.floor(clock / step)))
  }, [data, clock])

  const sample = data?.samples?.[sampleIndex]

  const utilizations = useMemo(() => {
    if (!sample) return []
    return servers.map((server, index) =>
      server.capacity ? (sample.load[index] / server.capacity) * 100 : 0,
    )
  }, [sample, servers])

  // Share of dispatched traffic, expressed as a MULTIPLE of an even split.
  // Normalising to the busiest server instead would pin every wire at maximum
  // whenever the algorithm distributes evenly, which is the common case.
  const shares = useMemo(() => {
    const row = dispatchGrid[sampleIndex]
    if (!row || !servers.length) return servers.map(() => 0)

    const total = row.reduce((carry, value) => carry + value, 0)
    if (!total) return servers.map(() => 0)

    return row.map((value) => (value / total) * servers.length)
  }, [dispatchGrid, sampleIndex, servers])

  // Per-server throughput in requests per second, from processing power.
  const rates = useMemo(() => {
    const map = new Map(
      (data?.system?.per_server_rate ?? []).map((entry) => [entry.server_id, entry.rate]),
    )
    return servers.map((server) => map.get(server.server_id) ?? 0)
  }, [data, servers])

  // Particles: requests dispatched within the last `transit` seconds.
  const particles = useMemo(() => {
    if (!byArrival.length) return []

    const from = clock - transit
    const result = []

    // Binary search for the first arrival inside the window.
    let low = 0
    let high = byArrival.length - 1
    let start = byArrival.length

    while (low <= high) {
      const mid = (low + high) >> 1
      if (byArrival[mid].arrival >= from) {
        start = mid
        high = mid - 1
      } else {
        low = mid + 1
      }
    }

    for (let index = start; index < byArrival.length; index += 1) {
      const record = byArrival[index]
      if (record.arrival > clock) break
      if (result.length >= MAX_PARTICLES) break

      const column =
        record.status === 'accepted'
          ? serverColumn.get(record.server)
          : index % Math.max(1, servers.length)

      if (column == null) continue

      result.push({
        key: record.request_id,
        index: column,
        progress: Math.min(1, (clock - record.arrival) / transit),
        rejected: record.status !== 'accepted',
      })
    }

    return result
  }, [byArrival, clock, serverColumn, servers.length, transit])

  // Counters that are exact, unlike the sampled particles.
  const counters = useMemo(() => {
    if (!data || !sample) {
      return { arrived: 0, completed: 0, rejected: 0, inFlight: 0 }
    }

    // Arrivals are evenly spaced, so the count at time t is a lookup.
    let arrived = byArrival.length
    let low = 0
    let high = byArrival.length - 1

    while (low <= high) {
      const mid = (low + high) >> 1
      if (byArrival[mid].arrival > clock) {
        arrived = mid
        high = mid - 1
      } else {
        low = mid + 1
      }
    }

    const completed = sample.completed.reduce((carry, value) => carry + value, 0)
    const rejected = sample.rejected

    return {
      arrived,
      completed,
      rejected,
      inFlight: Math.max(0, arrived - completed - rejected),
    }
  }, [data, sample, byArrival, clock])

  /* ---------------- render ---------------- */

  const totalQueued = sample
    ? sample.load.reduce((carry, value) => carry + value, 0)
    : 0

  const capacityRate = data?.system?.capacity_rate ?? 0
  const overloaded = arrivalRate > 0 && capacityRate > 0 && arrivalRate > capacityRate

  return (
    <div className="space-y-4">
      <Card
        title="Live request flow"
        subtitle={`Discrete-event run: requests arrive over time, and a finished request frees its server's capacity. ${algorithm?.label ?? ''} decides where each one goes.`}
      >
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-44">
            <Field
              label="Arrival rate (req/s)"
              hint={data ? `pool sustains ≈ ${capacityRate}/s` : '0 = all at once'}
            >
              <NumberInput
                value={arrivalRate}
                onChange={setArrivalRate}
                min={0}
                max={100000}
                disabled={loading}
              />
            </Field>
          </div>

          <Button onClick={run} disabled={loading}>
            {loading ? 'Simulating…' : 'Run live simulation'}
          </Button>

          {data && (
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  if (finished) setClock(0)
                  setPlaying((value) => (finished ? true : !value))
                }}
              >
                {finished ? 'Replay' : playing ? 'Pause' : 'Play'}
              </Button>

              <div className="flex items-center gap-1 rounded-lg border border-line bg-surface-2 p-0.5">
                {SPEEDS.map((speed, index) => (
                  <button
                    key={speed.label}
                    type="button"
                    onClick={() => setSpeedIndex(index)}
                    className={`rounded-md px-2 py-1 text-xs font-medium transition ${
                      speedIndex === index
                        ? 'bg-surface-1 text-ink'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {speed.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {data && overloaded && (
          <p className="mt-3 text-xs" style={{ color: 'var(--critical)' }}>
            Arrivals ({arrivalRate}/s) exceed what the pool can clear (
            {capacityRate}/s), so queues build and requests start being refused.
          </p>
        )}

        {error && (
          <p className="mt-3 text-xs" style={{ color: 'var(--critical)' }}>
            {error}
          </p>
        )}
      </Card>

      {!data && !loading && !error && (
        <EmptyState>
          Set an arrival rate and run the live simulation to watch requests flow
          from the balancer into the pool.
        </EmptyState>
      )}

      {loading && <EmptyState>Running the discrete-event simulation&hellip;</EmptyState>}

      {data && (
        <>
          <Card
            title="Topology"
            subtitle="Line thickness is each server's share of dispatched traffic. Tank fill is capacity in use right now."
          >
            <FlowTopology
              servers={servers}
              positions={positions}
              loads={sample?.load ?? []}
              utilizations={utilizations}
              rates={rates}
              shares={shares}
              particles={particles}
              height={Math.max(300, 340)}
            />

            <div className="mt-3">
              <input
                type="range"
                min={0}
                max={duration}
                step={duration / 1000 || 0.01}
                value={clock}
                onChange={(event) => {
                  setPlaying(false)
                  setClock(Number(event.target.value))
                }}
                className="w-full accent-[var(--series-1)]"
                aria-label="Simulation time"
              />
              <div className="mt-1 flex justify-between text-xs text-ink-muted">
                <span className="tnum">
                  t = {clock.toFixed(1)}s of {duration.toFixed(1)}s
                </span>
                <span className="tnum">
                  {totalQueued.toLocaleString()} workload units in the pool
                </span>
              </div>
            </div>

            <p className="mt-2 text-xs text-ink-muted">
              Counters below are exact. The moving dots are a capped sample of at
              most {MAX_PARTICLES} in flight, and their travel time is a visual
              flourish — the model dispatches a request the moment it arrives.
            </p>
          </Card>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Arrived"
              value={counters.arrived.toLocaleString()}
              hint={`of ${data.summary.requests_sent.toLocaleString()} total`}
            />
            <StatTile
              label="In the pool"
              value={counters.inFlight.toLocaleString()}
              hint="queued or being served"
            />
            <StatTile
              label="Completed"
              value={counters.completed.toLocaleString()}
              tone="good"
              hint="served and released"
            />
            <StatTile
              label="Rejected"
              value={counters.rejected.toLocaleString()}
              tone={counters.rejected > 0 ? 'critical' : 'neutral'}
              hint="no server had room"
            />
          </div>

          <Card
            title="Run totals"
            subtitle="Final figures for the whole discrete-event run"
          >
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile
                label="Acceptance rate"
                value={data.summary.acceptance_rate}
                unit="%"
                hint={`${data.summary.requests_accepted.toLocaleString()} accepted`}
              />
              <StatTile
                label="Throughput"
                value={data.metrics.throughput}
                unit="/s"
                hint={`pool sustains ≈ ${capacityRate}/s`}
              />
              <StatTile
                label="Avg waiting time"
                value={data.metrics.average_waiting_time}
                hint="queued before service began"
              />
              <StatTile
                label="Avg response time"
                value={data.metrics.average_response_time}
                hint="wait + processing"
              />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile
                label="Makespan"
                value={data.metrics.makespan}
                unit="s"
                hint="time until the last request finished"
              />
              <StatTile
                label="Busiest server"
                value={data.metrics.maximum_utilization}
                unit="%"
                hint="share of time busy"
              />
              <StatTile
                label="Load imbalance"
                value={data.metrics.load_imbalance}
                unit="pp"
                hint="busiest minus quietest"
              />
              <StatTile
                label="Servers used"
                value={`${data.metrics.servers_used} / ${servers.length}`}
                hint="served ≥ 1 request"
              />
            </div>

            <p className="mt-3 text-xs text-ink-muted">
              Utilization here is share of <strong>time busy</strong>, not share of
              capacity, and a finished request releases its workload. That is why
              these figures differ from the Dashboard tab, which asks a different
              question: where does everything land if it all arrives at once and
              nothing ever completes?
            </p>
          </Card>
        </>
      )}
    </div>
  )
}
