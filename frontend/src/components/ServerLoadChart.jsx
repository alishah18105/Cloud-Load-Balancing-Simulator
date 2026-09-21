import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { utilizationColor } from '../lib/constants'
import ChartTooltip from './ChartTooltip'

// Utilization is a magnitude per named server, so: horizontal bars, one hue
// stepped light → dark. A single series needs no legend — the title names it.
// Values are direct-labelled, which is also the relief the lighter steps owe.
export default function ServerLoadChart({ servers, height = 260 }) {
  const data = servers.map((server) => ({
    name: `S${server.server_id}`,
    utilization: server.utilization,
    load: server.final_load,
    capacity: server.capacity,
    power: server.processing_power,
    requests: server.assigned_requests.length,
  }))

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 52, bottom: 4, left: 8 }}
          barCategoryGap={6}
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            unit="%"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={34}
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'var(--surface-2)' }}
            content={
              <ChartTooltip
                rows={(row) => [
                  { label: 'Utilization', value: `${row.utilization}%` },
                  { label: 'Load / capacity', value: `${row.load} / ${row.capacity}` },
                  { label: 'Processing power', value: row.power },
                  { label: 'Requests held', value: row.requests },
                ]}
              />
            }
          />
          <Bar dataKey="utilization" radius={[0, 4, 4, 0]} isAnimationActive={false}>
            {data.map((row) => (
              <Cell key={row.name} fill={utilizationColor(row.utilization)} />
            ))}
            <LabelList
              dataKey="utilization"
              position="right"
              formatter={(value) => `${value}%`}
              style={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
