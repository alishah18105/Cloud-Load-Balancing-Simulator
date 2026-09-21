import { useMemo, useState } from 'react'

import { LABELS } from '../lib/constants'
import { StatusPill } from './Primitives'

const PAGE_SIZE = 15

/* Builds a page list with ellipses: 1 … 4 5 6 … 20 */
function pageItems(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  // First, last, and a window of two either side of the current page.
  const items = new Set([1, total])
  for (let page = current - 2; page <= current + 2; page += 1) items.add(page)

  const pages = [...items].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b)

  const withGaps = []
  pages.forEach((page, index) => {
    if (index > 0 && page - pages[index - 1] > 1) withGaps.push('gap')
    withGaps.push(page)
  })

  return withGaps
}

export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  const buttonClass =
    'rounded-md px-2.5 py-1 text-xs font-medium transition disabled:cursor-not-allowed ' +
    'disabled:opacity-40'

  return (
    <nav className="mt-3 flex flex-wrap items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className={`${buttonClass} border border-line bg-surface-2 text-ink`}
      >
        &larr; Previous
      </button>

      {pageItems(page, totalPages).map((item, index) =>
        item === 'gap' ? (
          <span key={`gap-${index}`} className="px-1 text-xs text-ink-muted">
            &hellip;
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? 'page' : undefined}
            className={`${buttonClass} ${
              item === page
                ? 'bg-[var(--series-1)] text-white'
                : 'border border-line bg-surface-2 text-ink'
            }`}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className={`${buttonClass} border border-line bg-surface-2 text-ink`}
      >
        Next &rarr;
      </button>
    </nav>
  )
}

const REQUEST_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
]

/* Paginated request table — 15 rows a page, so 1,500 requests never land on
   screen at once. */
export function RequestTable({ requests }) {
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)

  const visible = useMemo(
    () => (filter === 'all' ? requests : requests.filter((r) => r.status === filter)),
    [requests, filter],
  )

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))

  // Filtering can shrink the list below the current page, so clamp while
  // rendering rather than correcting it afterwards in an effect.
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PAGE_SIZE
  const rows = visible.slice(start, start + PAGE_SIZE)

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-ink-muted">
          Showing{' '}
          <span className="tnum text-ink">
            {visible.length === 0 ? 0 : start + 1}&ndash;{start + rows.length}
          </span>{' '}
          of <span className="tnum text-ink">{visible.length}</span>
          {filter !== 'all' && ` ${filter}`} requests
        </p>

        <div className="flex gap-1 rounded-lg border border-line bg-surface-2 p-0.5">
          {REQUEST_FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setFilter(option.value)
                setPage(1)
              }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                filter === option.value
                  ? 'bg-surface-1 text-ink'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-120 text-left text-xs">
          <thead className="text-ink-muted">
            <tr className="border-b border-line">
              <th className="py-2 pr-3 font-medium">Request</th>
              <th className="py-2 pr-3 text-right font-medium">Workload</th>
              <th className="py-2 pr-3 text-right font-medium">Priority</th>
              <th className="py-2 pr-3 font-medium">Server</th>
              <th className="py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="text-ink-soft">
            {rows.map((request) => (
              <tr key={request.request_id} className="border-b border-line/60">
                <td className="py-1.5 pr-3 font-medium text-ink">
                  {LABELS.request(request.request_id)}
                </td>
                <td className="tnum py-1.5 pr-3 text-right">{request.workload}</td>
                <td className="tnum py-1.5 pr-3 text-right">{request.priority}</td>
                <td className="tnum py-1.5 pr-3">
                  {request.assigned_server ? LABELS.server(request.assigned_server) : '—'}
                </td>
                <td className="py-1.5">
                  <StatusPill status={request.status} />
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-ink-muted">
                  No {filter} requests in this run.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
    </div>
  )
}

/* Truncates a long id list to a preview, with "View all" to expand in place. */
function AssignedRequests({ ids }) {
  const [expanded, setExpanded] = useState(false)

  if (!ids.length) return <span className="text-ink-muted">none</span>

  const preview = ids.slice(0, 3).map(LABELS.request).join(', ')

  if (ids.length <= 3) return <span className="tnum">{preview}</span>

  return (
    <span>
      <span className="tnum">
        {expanded ? ids.map(LABELS.request).join(', ') : `${preview}, …`}
      </span>{' '}
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="font-medium text-[var(--series-1)] hover:underline"
      >
        {expanded ? 'Show less' : `View all ${ids.length}`}
      </button>
    </span>
  )
}

/* Final server state. `showInitialLoad` matches the single-algorithm spec,
   which includes the initial load column; the comparison view omits it because
   the shared starting configuration is already shown once at the top. */
export function ServerResultsTable({ servers, showInitialLoad = true }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-160 text-left text-xs">
        <thead className="text-ink-muted">
          <tr className="border-b border-line">
            <th className="py-2 pr-3 font-medium">Server</th>
            <th className="py-2 pr-3 text-right font-medium">Capacity</th>
            <th className="py-2 pr-3 text-right font-medium">Processing Power</th>
            {showInitialLoad && (
              <th className="py-2 pr-3 text-right font-medium">Initial Load</th>
            )}
            <th className="py-2 pr-3 text-right font-medium">Final Load</th>
            <th className="py-2 pr-3 text-right font-medium">Utilization</th>
            <th className="py-2 font-medium">Requests</th>
          </tr>
        </thead>
        <tbody className="text-ink-soft">
          {servers.map((server) => (
            <tr key={server.server_id} className="border-b border-line/60">
              <td className="py-1.5 pr-3 font-medium text-ink">
                {LABELS.server(server.server_id)}
              </td>
              <td className="tnum py-1.5 pr-3 text-right">{server.capacity}</td>
              <td className="tnum py-1.5 pr-3 text-right">{server.processing_power}</td>
              {showInitialLoad && (
                <td className="tnum py-1.5 pr-3 text-right">{server.initial_load}</td>
              )}
              <td className="tnum py-1.5 pr-3 text-right">{server.final_load}</td>
              <td className="tnum py-1.5 pr-3 text-right">{server.utilization}%</td>
              <td className="py-1.5">
                <AssignedRequests ids={server.assigned_requests} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* Key/value configuration card, rendered as a two-column table. */
export function ConfigTable({ rows }) {
  return (
    <table className="w-full max-w-md text-left text-xs">
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} className="border-b border-line/60 last:border-0">
            <td className="py-1.5 pr-4 text-ink-muted">{row.label}</td>
            <td className="tnum py-1.5 font-medium text-ink">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
