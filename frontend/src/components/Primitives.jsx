export function Card({ title, subtitle, actions, children, className = '' }) {
  return (
    <section
      className={`rounded-xl border border-line bg-surface-1 p-4 sm:p-5 ${className}`}
    >
      {(title || actions) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && (
              <h2 className="text-sm font-semibold tracking-tight text-ink">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>
            )}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  )
}

// A stat tile: one number is the message, so there is no plot and no tooltip.
export function StatTile({ label, value, unit, hint, tone = 'neutral' }) {
  const toneClass =
    tone === 'good' ? 'text-good' : tone === 'critical' ? 'text-critical' : 'text-ink'

  return (
    <div className="rounded-xl border border-line bg-surface-1 px-4 py-3">
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p className={`tnum mt-1 text-2xl font-semibold tracking-tight ${toneClass}`}>
        {value}
        {unit && <span className="ml-0.5 text-base font-medium text-ink-muted">{unit}</span>}
      </p>
      {hint && <p className="mt-0.5 text-xs text-ink-muted">{hint}</p>}
    </div>
  )
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink-soft">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-muted">{hint}</span>}
    </label>
  )
}

const CONTROL_CLASS =
  'w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink ' +
  'outline-none transition focus:border-transparent focus:ring-2 focus:ring-[var(--series-1)]'

export function Select({ value, onChange, options, disabled }) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={CONTROL_CLASS}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export function NumberInput({ value, onChange, min, max, disabled }) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={CONTROL_CLASS}
    />
  )
}

export function Button({ children, onClick, disabled, variant = 'primary', title }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm ' +
    'font-medium transition disabled:cursor-not-allowed disabled:opacity-50'

  const variants = {
    primary: 'bg-[var(--series-1)] text-white hover:brightness-110',
    ghost: 'border border-line bg-surface-2 text-ink hover:bg-surface-0',
  }

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]}`}
    >
      {children}
    </button>
  )
}

// Identity is never carried by color alone: every swatch ships with its label.
export function LegendSwatch({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
      <span
        aria-hidden="true"
        className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
        style={{ background: color }}
      />
      {label}
    </span>
  )
}

export function StatusPill({ status }) {
  const accepted = status === 'accepted'
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
      style={{
        color: accepted ? 'var(--good)' : 'var(--critical)',
        borderColor: accepted ? 'var(--good)' : 'var(--critical)',
      }}
    >
      {accepted ? '✓' : '✕'} {accepted ? 'Accepted' : 'Rejected'}
    </span>
  )
}

export function EmptyState({ children }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface-1 px-6 py-12 text-center">
      <p className="text-sm text-ink-muted">{children}</p>
    </div>
  )
}
