// Single entry point to the Flask simulation engine.
// POST /api/simulate — see backend/routes/simulation_routes.py
export async function runSimulation(config) {
  let response

  try {
    response = await fetch('/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        algorithm: config.algorithm,
        number_of_requests: Number(config.numberOfRequests),
        number_of_servers: Number(config.numberOfServers),
        server_type: config.serverType,
        workload_type: config.workloadType,
      }),
    })
  } catch {
    throw new Error(
      'Could not reach the backend. Start it with: cd backend && python app.py',
    )
  }

  // The API reports its own validation errors as JSON with an "error" key.
  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    throw new Error(payload?.error || `Simulation failed (HTTP ${response.status}).`)
  }

  return payload
}

// A single-algorithm response has no "mode" key; comparison mode sets
// mode: "comparison" and nests every algorithm under results.
export function isComparison(result) {
  return result?.mode === 'comparison'
}

/*
  POST /api/simulate/timeline — the discrete-event run.

  This is a different question from /api/simulate: requests arrive over time
  and finished requests release their workload, so capacity acts as a
  concurrency limit rather than a lifetime total. Acceptance rates from the
  two endpoints are therefore not directly comparable.

  arrival_rate is in requests per second; 0 means a burst (all at once).
*/
export async function runTimeline(config, arrivalRate) {
  let response

  try {
    response = await fetch('/api/simulate/timeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        algorithm: config.algorithm,
        number_of_requests: Number(config.numberOfRequests),
        number_of_servers: Number(config.numberOfServers),
        server_type: config.serverType,
        workload_type: config.workloadType,
        arrival_rate: Number(arrivalRate),
      }),
    })
  } catch {
    throw new Error(
      'Could not reach the backend. Start it with: cd backend && python app.py',
    )
  }

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    throw new Error(payload?.error || `Timeline run failed (HTTP ${response.status}).`)
  }

  return payload
}
