import { useMemo } from 'react'

import { LABELS, utilizationColor } from '../lib/constants'
import {
  LB_HEIGHT,
  LB_WIDTH,
  LB_Y,
  SERVER_HEIGHT,
  SERVER_TOP,
  VIEW_WIDTH,
} from '../lib/layout'

/*
  The topology: one load balancer fanning out to the server pool. Geometry
  constants live in lib/layout.js so this file exports only the component.
*/

export default function FlowTopology({
  servers,
  positions,
  loads,
  utilizations,
  rates,
  shares,
  particles,
  height,
}) {
  const viewHeight = SERVER_TOP + SERVER_HEIGHT + 46

  const lbX = VIEW_WIDTH / 2
  const lbBottom = LB_Y + LB_HEIGHT

  const labelEvery = useMemo(() => {
    if (servers.length <= 12) return 1
    if (servers.length <= 24) return 2
    return Math.ceil(servers.length / 12)
  }, [servers.length])

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${viewHeight}`}
      style={{ width: '100%', height }}
      role="img"
      aria-label="Load balancer distributing requests across the server pool"
    >
      {/* Connection lines. Thickness is that server's share of dispatched
          traffic, which is where the algorithms visibly differ. */}
      {positions.map((position) => {
        const share = shares[position.index] ?? 0
        return (
          <line
            key={`wire-${position.index}`}
            x1={lbX}
            y1={lbBottom}
            x2={position.cx}
            y2={SERVER_TOP}
            stroke="var(--border)"
            strokeWidth={0.7 + Math.min(share, 3) * 1.9}
            strokeLinecap="round"
          />
        )
      })}

      {/* Requests in transit from the balancer to their chosen server. */}
      {particles.map((particle) => {
        const position = positions[particle.index]
        if (!position) return null

        const x = lbX + (position.cx - lbX) * particle.progress
        const y = lbBottom + (SERVER_TOP - lbBottom) * particle.progress

        return (
          <circle
            key={particle.key}
            cx={x}
            cy={y}
            r={particle.rejected ? 2.6 : 3.2}
            fill={particle.rejected ? 'var(--critical)' : 'var(--series-1)'}
            opacity={particle.rejected ? 0.5 : 0.9}
          />
        )
      })}

      {/* The load balancer */}
      <rect
        x={lbX - LB_WIDTH / 2}
        y={LB_Y}
        width={LB_WIDTH}
        height={LB_HEIGHT}
        rx={10}
        fill="var(--surface-2)"
        stroke="var(--series-1)"
        strokeWidth={1.5}
      />
      <text
        x={lbX}
        y={LB_Y + 23}
        textAnchor="middle"
        fill="var(--text-primary)"
        fontSize={13}
        fontWeight={600}
      >
        LOAD BALANCER
      </text>
      <text
        x={lbX}
        y={LB_Y + 41}
        textAnchor="middle"
        fill="var(--text-secondary)"
        fontSize={11}
      >
        {servers.length} servers in pool
      </text>

      {/* Servers */}
      {positions.map((position) => {
        const server = servers[position.index]
        const utilization = utilizations[position.index] ?? 0
        const load = loads[position.index] ?? 0
        const rate = rates[position.index] ?? 0

        const fill = Math.min(100, utilization)
        const fillHeight = (SERVER_HEIGHT - 26) * (fill / 100)
        const full = utilization >= 99.5

        const left = position.cx - position.width / 2
        const showLabel = position.index % labelEvery === 0

        return (
          <g key={`server-${position.index}`}>
            {/* Tank outline */}
            <rect
              x={left}
              y={SERVER_TOP}
              width={position.width}
              height={SERVER_HEIGHT - 26}
              rx={6}
              fill="var(--surface-0)"
              stroke={full ? 'var(--critical)' : 'var(--border)'}
              strokeWidth={full ? 1.8 : 1}
            />

            {/* Live fill */}
            <rect
              x={left + 2}
              y={SERVER_TOP + (SERVER_HEIGHT - 26) - fillHeight - 2}
              width={Math.max(0, position.width - 4)}
              height={Math.max(0, fillHeight)}
              rx={4}
              fill={utilizationColor(utilization)}
            />

            {/* Utilization, inside the tank where there is room */}
            {position.width >= 34 && (
              <text
                x={position.cx}
                y={SERVER_TOP + 16}
                textAnchor="middle"
                fill="var(--text-primary)"
                fontSize={10}
                fontWeight={600}
              >
                {Math.round(utilization)}%
              </text>
            )}

            {showLabel && (
              <text
                x={position.cx}
                y={SERVER_TOP + SERVER_HEIGHT - 12}
                textAnchor="middle"
                fill="var(--text-secondary)"
                fontSize={10}
                fontWeight={600}
              >
                {LABELS.server(server.server_id)}
              </text>
            )}

            {showLabel && (
              <text
                x={position.cx}
                y={SERVER_TOP + SERVER_HEIGHT + 2}
                textAnchor="middle"
                fill="var(--text-muted)"
                fontSize={9}
              >
                {rate.toFixed(2)}/s
              </text>
            )}

            {/* Capacity reached */}
            {full && (
              <text
                x={position.cx}
                y={SERVER_TOP - 6}
                textAnchor="middle"
                fill="var(--critical)"
                fontSize={10}
                fontWeight={700}
              >
                FULL
              </text>
            )}

            <title>
              {`${LABELS.server(server.server_id)} — power ${server.processing_power}, `}
              {`capacity ${server.capacity}, load ${Math.round(load)} (${utilization.toFixed(1)}%), `}
              {`${rate.toFixed(2)} req/s`}
            </title>
          </g>
        )
      })}
    </svg>
  )
}
