import { ALGORITHMS, SERVER_TYPES, WORKLOAD_TYPES } from '../lib/constants'
import { Button, Field, NumberInput, Select } from './Primitives'

// Filters sit in one row above the charts, and stay mounted while a run is in
// flight so the instructor can see exactly which scenario produced a result.
export default function ConfigPanel({ config, onChange, onRun, loading }) {
  const set = (key) => (value) => onChange({ ...config, [key]: value })

  const algorithmOptions = [
    ...ALGORITHMS.map((algorithm) => ({
      value: algorithm.key,
      label: algorithm.label,
    })),
    { value: 'all', label: 'Compare all five' },
  ]

  const workload = WORKLOAD_TYPES.find((type) => type.value === config.workloadType)
  const serverType = SERVER_TYPES.find((type) => type.value === config.serverType)

  return (
    <section className="rounded-xl border border-line bg-surface-1 p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <Field label="Algorithm">
            <Select
              value={config.algorithm}
              onChange={set('algorithm')}
              options={algorithmOptions}
              disabled={loading}
            />
          </Field>
        </div>

        <Field label="Requests">
          <NumberInput
            value={config.numberOfRequests}
            onChange={set('numberOfRequests')}
            min={1}
            max={5000}
            disabled={loading}
          />
        </Field>

        <Field label="Servers">
          <NumberInput
            value={config.numberOfServers}
            onChange={set('numberOfServers')}
            min={1}
            max={50}
            disabled={loading}
          />
        </Field>

        <Field label="Server type" hint={serverType?.hint}>
          <Select
            value={config.serverType}
            onChange={set('serverType')}
            options={SERVER_TYPES}
            disabled={loading}
          />
        </Field>

        <Field label="Workload" hint={workload?.hint}>
          <Select
            value={config.workloadType}
            onChange={set('workloadType')}
            options={WORKLOAD_TYPES}
            disabled={loading}
          />
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button onClick={onRun} disabled={loading}>
          {loading ? 'Running…' : 'Run simulation'}
        </Button>
        <p className="text-xs text-ink-muted">
          Each run generates a fresh random scenario. In compare mode all five
          algorithms receive an identical copy of that scenario.
        </p>
      </div>
    </section>
  )
}
