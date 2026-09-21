// Shared hover layer. An on-screen chart is interactive by default, so every
// plotted form here gets a tooltip rather than relying on axis labels alone.
export default function ChartTooltip({ active, payload, label, rows }) {
  if (!active || !payload?.length) return null

  const entries = rows ? rows(payload[0].payload) : payload.map((item) => ({
    label: item.name,
    value: item.value,
    color: item.color || item.fill,
  }))

  return (
    <div className="rounded-lg border border-line bg-surface-1 px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-semibold text-ink">{label}</p>
      {entries.map((entry) => (
        <p key={entry.label} className="flex items-center gap-2 text-xs text-ink-soft">
          {entry.color && (
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 rounded-sm"
              style={{ background: entry.color }}
            />
          )}
          <span>{entry.label}</span>
          <span className="tnum ml-auto font-medium text-ink">{entry.value}</span>
        </p>
      ))}
    </div>
  )
}
