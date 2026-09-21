// Algorithm keys must match services/simulation.py exactly.
//
// Complexities below are derived from THIS project's implementations in
// backend/algorithms/, not from the textbook versions. Symbols:
//
//   n = number of requests
//   m = number of servers
//   W = total weighted slots, sum of max(1, round(processing_power)) over servers
//   p = GA population size (50)
//   g = GA generations (50)
//
// The round-robin family is O(n·m) rather than O(n) here because each request
// falls back to scanning every other server when the first choice is full.
export const ALGORITHMS = [
  {
    key: 'round_robin',
    label: 'Round Robin',
    short: 'RR',
    color: 'var(--series-1)',
    blurb: 'Walks the server list in order, handing each request to the next server.',
    approach: 'Sequential distribution',
    time: 'O(n · m)',
    space: 'O(1)',
    priority: false,
    processingPower: false,
    note: 'Starts at index % m, then scans the remaining servers until one has room.',
  },
  {
    key: 'least_load',
    label: 'Least Load',
    short: 'LL',
    color: 'var(--series-2)',
    blurb: 'Greedy: each request goes to the least-loaded server that still fits it.',
    approach: 'Greedy load-based distribution',
    time: 'O(n · m)',
    space: 'O(m)',
    priority: false,
    processingPower: false,
    note: 'Builds the list of servers with room (O(m)), then takes the minimum utilization.',
  },
  {
    key: 'weighted_round_robin',
    label: 'Weighted Round Robin',
    short: 'WRR',
    color: 'var(--series-3)',
    blurb: 'Round robin over a slot list where stronger servers appear more often.',
    approach: 'Weighted sequential distribution',
    time: 'O(n · W)',
    space: 'O(W)',
    priority: false,
    processingPower: true,
    note: 'Expands each server into max(1, round(power)) slots, so W ≥ m.',
  },
  {
    key: 'priority_based',
    label: 'Priority Based',
    short: 'PB',
    color: 'var(--series-4)',
    blurb: 'Sorts requests by priority (5 → 1) first, then places them greedily.',
    approach: 'Priority-based greedy distribution',
    time: 'O(n log n + n · m)',
    space: 'O(n + m)',
    priority: true,
    processingPower: false,
    note: 'Sort dominates only when m < log n; placement is least-load within each priority.',
  },
  {
    key: 'genetic_algorithm',
    label: 'Genetic Algorithm',
    short: 'GA',
    color: 'var(--series-5)',
    blurb: 'Evolves whole assignment chromosomes, selecting against load imbalance.',
    approach: 'Genetic optimization',
    time: 'O(g · p · (n + m))',
    space: 'O(p · n)',
    priority: false,
    processingPower: false,
    note: 'p = 50, g = 50. Each chromosome is one server index per request; fitness penalises rejections then imbalance.',
  },
]

export const ALGORITHM_BY_KEY = Object.fromEntries(
  ALGORITHMS.map((algorithm) => [algorithm.key, algorithm]),
)

export const SERVER_TYPES = [
  { value: 'homogeneous', label: 'Homogeneous', hint: 'All servers: capacity 1000, power 2.0' },
  { value: 'heterogeneous', label: 'Heterogeneous', hint: 'Capacity 800–2000, power 1.0–4.0' },
]

export const WORKLOAD_TYPES = [
  { value: 'light', label: 'Light', hint: 'workload 5–20' },
  { value: 'medium', label: 'Medium', hint: 'workload 20–50' },
  { value: 'heavy', label: 'Heavy', hint: 'workload 50–100' },
  { value: 'random', label: 'Random', hint: 'workload 5–100' },
]

// Sequential blue: utilization is a magnitude, so one hue light → dark.
export function utilizationColor(utilization) {
  if (utilization >= 90) return 'var(--seq-600)'
  if (utilization >= 60) return 'var(--seq-450)'
  if (utilization >= 30) return 'var(--seq-350)'
  return 'var(--seq-200)'
}

export const LABELS = {
  server: (id) => `S${id}`,
  request: (id) => `R${id}`,
}
