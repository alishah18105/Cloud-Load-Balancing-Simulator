# Load Balancer Simulation — Frontend

React interface for the Load Balancer Simulation project. It drives the Flask
simulation engine in [`../backend`](../backend) and presents each run visually:
a metrics dashboard, a live request-flow animation driven by a discrete-event
simulation, and a side-by-side comparison of all five algorithms.

---

## 1. Technology Stack

* **React 19** — UI
* **Vite** — dev server and build
* **Tailwind CSS v4** — styling
* **Recharts** — charts

---

## 2. Running the Project

From the **repository root** (one level up from this folder), one command starts
the backend and the frontend together:

```bash
npm install     # once
npm run dev     # every time
```

* Frontend: `http://localhost:5173`
* Backend API: `http://127.0.0.1:5000`

The first run creates `backend/.venv`, installs the Python requirements and runs
`npm install` in this folder automatically. See the root
[README](../README.md) for troubleshooting.

### Frontend only

If the backend is already running elsewhere, start just the frontend from this
folder:

```bash
npm install
npm run dev
```

### Production build

```bash
npm run build      # outputs to dist/
npm run preview    # serve the build locally
```

---

## 3. How the Frontend Talks to the Backend

The Dashboard and Comparison tabs call:

```http
POST /api/simulate
```

The Live Flow tab calls a second endpoint, described under
"The timeline endpoint" below.

`vite.config.js` proxies `/api` to `http://127.0.0.1:5000`, so the browser only
ever calls its own origin and no CORS configuration is needed in development.

The request body is built in `src/lib/api.js` from the configuration panel:

```json
{
    "algorithm": "least_load",
    "number_of_requests": 100,
    "number_of_servers": 5,
    "server_type": "heterogeneous",
    "workload_type": "medium"
}
```

### Two response shapes

| Mode | Sent as | Response |
| --- | --- | --- |
| Single algorithm | `"algorithm": "least_load"` | flat object, no `mode` key |
| Compare all | `"algorithm": "all"` | `mode: "comparison"` with every algorithm under `results` |

`isComparison()` in `src/lib/api.js` distinguishes them, and the app switches
views accordingly.

### The timeline endpoint

The Live Flow tab calls a different endpoint, `POST /api/simulate/timeline`,
which runs a discrete-event simulation instead. Its numbers are **not**
comparable with the Dashboard's, and the UI says so:

| | Dashboard / Comparison | Live Flow |
| --- | --- | --- |
| Question | If everything arrives at once, where does it land? | As requests arrive over time, what happens? |
| Completion | never | a request finishes and frees its workload |
| Capacity means | total workload ever accepted | concurrent workload |
| Utilization means | share of capacity | share of time busy |

---

## 4. Project Structure

```text
frontend/
│
├── index.html
├── vite.config.js
│
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   │
│   ├── lib/
│   │   ├── api.js
│   │   ├── constants.js
│   │   └── layout.js
│   │
│   └── components/
│       ├── ConfigPanel.jsx
│       ├── Dashboard.jsx
│       ├── FlowView.jsx
│       ├── FlowTopology.jsx
│       ├── ComparisonView.jsx
│       ├── Tables.jsx
│       ├── ServerLoadChart.jsx
│       ├── ChartTooltip.jsx
│       └── Primitives.jsx
│
├── package.json
└── README.md
```

---

## 5. The Three Views

### Dashboard — single algorithm

1. **Simulation Configuration** — algorithm, servers, requests, server type, workload
2. **Summary tiles** — accepted, rejected, load imbalance, servers used, average /
   maximum utilization, simulated processing and response time
3. **Server Utilization** — bar chart across the pool
4. **Server Results** — capacity, processing power, initial load, final load,
   utilization, and the assigned request ids. Long id lists are truncated to three
   with a **View all** toggle, so a server holding 60 requests never floods the row.
5. **Request Results** — **15 rows per page** with `← Previous | 1 2 3 … | Next →`
   and an All / Accepted / Rejected filter, so 1,500 requests never land on screen
   at once.

### Live Flow — single algorithm

A **discrete-event** run, backed by `POST /api/simulate/timeline`. Requests
arrive on a clock, servers work through their queues, and a finished request
releases its workload.

* A **load balancer** node fans out to the whole pool
* **Line thickness** is that server's share of dispatched traffic, expressed as
  a multiple of an even split — so a fair split reads as mid-weight rather than
  pinning every wire at maximum. This is where the algorithms visibly differ:
  Round Robin holds every wire even, Weighted Round Robin keeps permanently
  fatter pipes to high-power servers, Least Load makes them breathe
* **Tank fill** is capacity in use at that instant; a full server turns red and
  is marked `FULL`
* **Per-server req/s** comes from `processing_power`, so a power-4.0 server
  visibly clears its queue four times faster than a power-1.0 one
* An **arrival rate** control, with the pool's sustainable rate shown beside it.
  Above that rate the UI warns that queues will build and requests be refused

Two honesty notes, both stated in the UI:

* The **counters are exact**; the moving dots are a capped sample of at most 90
  in flight, because animating 10,000 DOM nodes would drop frames on a projector
* Dot **travel time is a visual flourish** — the model dispatches a request the
  moment it arrives

### Comparison — `algorithm: "all"`

Sections 1–2 are common to all five algorithms; 3–7 compare them.

1. **Configuration** — the shared scenario (no algorithm row)
2. **Initial Server Configuration** — the starting pool, shown **once**, since every
   algorithm receives the same servers at zero load
3. **Algorithm Comparison** — sent / accepted / rejected / acceptance % / rejection %,
   plus an **Accepted vs Rejected** chart
4. **Load Balancing Metrics** — average / maximum / minimum utilization, load
   imbalance, servers used, plus a server utilization chart for **one algorithm at a
   time** (dropdown), rather than five × 20 charts at once
5. **Performance Metrics** — simulated average processing and response time, plus a
   chart with a metric selector
6. **Algorithm Information** — approach, time and space complexity, priority and
   processing-power support (see below)
7. **Detailed Algorithm Results** — one collapsible panel per algorithm, each with
   its final server state and its own paginated request table. Collapsed by default
   so the page does not become a wall of rows.

The final server state lives inside each algorithm's panel in section 7 rather than
being repeated at the top, so the same servers are never printed five times.

---

## 6. Note on the Live Flow Model

The batch algorithms in `backend/algorithms/` take every request at once. A
discrete-event run cannot, so `backend/services/timeline.py` implements the
**online** equivalent of each rule:

| Algorithm | Online behaviour |
| --- | --- |
| Round Robin | Next server in rotation, with the same capacity fallback scan |
| Least Load | Least loaded server that still has room |
| Weighted Round Robin | Rotation over weighted slots |
| Priority Based | Placement is least-load; each **server serves its queue highest priority first**, since online arrivals cannot be globally sorted |
| Genetic Algorithm | Has no online form — it optimises the whole request set at once, so its batch solution is computed up front and replayed as requests arrive |

The service model is the one `metrics.py` already assumes: a server handles one
request at a time, and workload `w` on a server of power `p` takes `w / p` time
units. It follows that the pool sustains
`total_processing_power / mean_workload` requests per second — the figure shown
next to the arrival rate control.

---

## 7. Algorithm Keys

The UI uses the keys the backend actually implements
(`backend/services/simulation.py`):

```text
round_robin
least_load
weighted_round_robin
priority_based
genetic_algorithm
all
```

---

## 8. Complexity (Comparison view, section 6)

These are derived from **this project's implementations** in
`backend/algorithms/`, not the textbook versions. They live in
`src/lib/constants.js`.

Symbols: `n` = requests, `m` = servers, `W` = total weighted slots
(`Σ max(1, round(processing_power))`, so `W ≥ m`), `p` = GA population (50),
`g` = GA generations (50).

| Algorithm | Time | Space | Why |
| --- | --- | --- | --- |
| Round Robin | `O(n · m)` | `O(1)` | Starts at `index % m`, then scans the remaining servers until one has room |
| Least Load | `O(n · m)` | `O(m)` | Builds the list of servers with room (`O(m)`), then takes the minimum utilization |
| Weighted Round Robin | `O(n · W)` | `O(W)` | Expands each server into `max(1, round(power))` slots, then scans them |
| Priority Based | `O(n log n + n · m)` | `O(n + m)` | Sorts by priority, then places least-load within each priority |
| Genetic Algorithm | `O(g · p · (n + m))` | `O(p · n)` | `g` generations × `p` chromosomes, each `O(n + m)` to score |

> **The point worth making in the viva:** Round Robin here is **not** `O(n)`.
> Because the implementation falls back to scanning the remaining servers
> whenever the first choice is full, its worst case is `O(n · m)` — the capacity
> constraint changes the complexity, not just the result.

---

## 9. Design Notes

* **Color by job.** The five algorithm colors are a fixed categorical order,
  assigned per algorithm and never recycled, so an algorithm keeps its color
  across every chart. Server utilization is a magnitude, so it uses a single
  blue ramp stepped light → dark instead.
* **Never color alone.** Every chart carries a legend or direct value labels,
  and every chart has a table showing the same numbers.
* **One scale per chart.** Measures with different units get their own chart
  rather than a second y-axis.
* **Dark mode** is a separate set of steps chosen for the dark surface, not an
  inversion of the light ones. The header toggle cycles Auto → Light → Dark.
