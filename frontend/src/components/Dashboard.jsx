import { ALGORITHM_BY_KEY } from '../lib/constants'
import { Card, StatTile } from './Primitives'
import { ConfigTable, RequestTable, ServerResultsTable } from './Tables'
import ServerLoadChart from './ServerLoadChart'

function titleCase(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value
}

export default function Dashboard({ result }) {
  const { summary, metrics, servers, requests, configuration } = result
  const algorithm = ALGORITHM_BY_KEY[result.algorithm]

  return (
    <div className="space-y-4">
      {/* 1 — Simulation Configuration */}
      <Card
        title="Simulation Configuration"
        subtitle={algorithm?.blurb}
      >
        <ConfigTable
          rows={[
            { label: 'Algorithm', value: algorithm?.label ?? result.algorithm },
            { label: 'Servers', value: configuration.number_of_servers.toLocaleString() },
            { label: 'Requests', value: configuration.number_of_requests.toLocaleString() },
            { label: 'Server Type', value: titleCase(configuration.server_type) },
            { label: 'Workload', value: titleCase(configuration.workload_type) },
          ]}
        />
      </Card>

      {/* Summary — the headline numbers for the run */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Accepted"
          value={summary.requests_accepted.toLocaleString()}
          hint={`${summary.acceptance_rate}% of ${summary.requests_sent.toLocaleString()}`}
          tone="good"
        />
        <StatTile
          label="Rejected"
          value={summary.requests_rejected.toLocaleString()}
          hint={`${summary.rejection_rate}% — no server had room`}
          tone={summary.requests_rejected > 0 ? 'critical' : 'neutral'}
        />
        <StatTile
          label="Load imbalance"
          value={metrics.load_imbalance}
          unit="pp"
          hint={`min ${metrics.minimum_utilization}% · max ${metrics.maximum_utilization}%`}
        />
        <StatTile
          label="Servers used"
          value={`${metrics.servers_used} / ${configuration.number_of_servers}`}
          hint="servers holding ≥ 1 request"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Average utilization"
          value={metrics.average_utilization}
          unit="%"
          hint="mean share of capacity in use"
        />
        <StatTile
          label="Maximum utilization"
          value={metrics.maximum_utilization}
          unit="%"
          hint="busiest server"
        />
        <StatTile
          label="Simulated avg processing time"
          value={metrics.average_processing_time}
          hint="workload ÷ processing power"
        />
        <StatTile
          label="Simulated avg response time"
          value={metrics.average_response_time}
          hint="queue wait + processing"
        />
      </div>

      {/* 2 — Server Utilization Chart */}
      <Card
        title="Server Utilization"
        subtitle="Share of each server's capacity that ended up in use"
      >
        <ServerLoadChart
          servers={servers}
          height={Math.max(220, servers.length * 26)}
        />
      </Card>

      {/* 3 — Server Results */}
      <Card
        title="Server Results"
        subtitle="Final state of every server, with the requests it accepted"
      >
        <ServerResultsTable servers={servers} />
      </Card>

      {/* 4 — Request Results */}
      <Card
        title="Request Results"
        subtitle="Every request and where it landed, 15 per page"
      >
        <RequestTable requests={requests} />
      </Card>
    </div>
  )
}
