# Load Balancer Simulation — Backend

This folder contains the **backend/API** of the Load Balancer Simulation project.

The backend is responsible for generating the simulation environment, creating servers and requests, executing load-balancing algorithms, assigning requests while respecting server capacity, calculating metrics, and returning simulation results as JSON.

---

## 1. Technology Stack

* **Python**
* **Flask** — REST API
* **Flask-CORS** — Cross-Origin Resource Sharing
* **Python Standard Library** — simulation and algorithm logic

---

## 2. Project Structure

```text
backend/
│
├── app.py
│
├── algorithms/
│   ├── round_robin.py
│   ├── least_load.py
│   ├── weighted_round_robin.py
│   ├── priority_based.py
│   └── genetic_algorithm.py
│
├── models/
│   ├── __init__.py
│   ├── request.py
│   └── server.py
│
├── routes/
│   └── simulation_routes.py
│
├── services/
│   ├── __init__.py
│   ├── generator.py
│   ├── metrics.py
│   ├── simulation.py
│   └── timeline.py
│
├── tests/
│   ├── __init__.py
│   ├── test_simulation.py
│   └── test_timeline.py
│
├── requirements.txt
│
└── README.md
```

---

## 3. Backend Components

### `app.py`

Main Flask application.

Responsible for:

* Creating the Flask app
* Enabling CORS
* Registering routes
* Starting the backend server

---

### `algorithms/`

Contains the load-balancing algorithm implementations.

#### `round_robin.py`

Distributes requests sequentially across servers.

#### `least_load.py`

Uses a **Greedy approach** and assigns each request to the currently least-loaded suitable server.

#### `weighted_round_robin.py`

Distributes requests sequentially, but gives stronger servers more turns. Each server is repeated in the rotation `max(1, round(processing_power))` times, so a server with power `4.0` appears four times for every one appearance of a server with power `1.0`. Like Round Robin, it falls back to the next server in the rotation when the chosen one has no capacity left. This is useful for heterogeneous servers.

#### `priority_based.py`

Sorts requests by priority, highest first, then assigns each one to the least-utilized server that still has room for it.

#### `genetic_algorithm.py`

Uses a Genetic Algorithm approach to determine request-to-server assignments while considering the simulation constraints.

---

## 4. Models

### `models/server.py`

Defines the server model.

A server contains information such as:

* `server_id`
* `capacity`
* `processing_power`
* `assigned_requests`
* `current_load`

The `Server` class itself defaults to `capacity = 100` and `processing_power = 1.0`, but the simulation never relies on those defaults. `services/generator.py` always sets both values explicitly according to the server type below.

### Server Types

#### Homogeneous

All servers have the same configuration.

Capacity:

```text
1000
```

Processing power:

```text
2.0
```

#### Heterogeneous

Each server independently receives a random capacity and a random processing power. The two are chosen separately, so any capacity can be paired with any processing power.

Possible capacities:

```text
800, 1000, 1200, 1500, 2000
```

Possible processing powers:

```text
1.0, 1.5, 2.0, 3.0, 4.0
```

---

### `models/request.py`

Defines the request model.

A request contains information such as:

* `request_id`
* `workload`
* `priority`
* `assigned_server`

Priority ranges from:

```text
1 – 5
```

Higher values represent higher priority.

---

## 5. Services

### `services/generator.py`

Responsible for generating the simulation data.

It handles:

* Server generation
* Request generation
* Workload generation
* Homogeneous server configuration
* Heterogeneous server configuration

### Workload Types

The simulation supports:

```text
light
medium
heavy
random
```

---

### `services/simulation.py`

Contains the main simulation logic.

It coordinates:

1. Server and request generation
2. Algorithm execution
3. Request assignment
4. Capacity checking
5. Accepted/rejected requests
6. Final simulation results

---

### `services/timeline.py`

Discrete-event version of the simulation, used by the **Live Flow** view in the
frontend. Requests arrive on a clock, servers work through their queues, and a
finished request releases its workload. See section 10a.

---

### `services/metrics.py`

Calculates simulation metrics such as:

* Accepted requests
* Rejected requests
* Acceptance percentage
* Rejection percentage
* Server load
* Request distribution
* Other performance information

---

## 6. Capacity Constraint

A request can only be assigned if the server has enough remaining capacity.

For a server:

```text
current_load + request_workload <= capacity
```

If this condition is not satisfied, the request cannot be assigned to that server.

Therefore, the backend does **not allow a server to exceed its capacity**.

Example:

```text
Server Capacity  = 1000
Current Load     = 980
Request Workload = 30
```

Since:

```text
980 + 30 = 1010
```

the request is rejected for that server.

---

## 7. Algorithms

The backend currently supports:

| Algorithm            | Key                    | Main Approach                                        |
| -------------------- | ---------------------- | ---------------------------------------------------- |
| Round Robin          | `round_robin`          | Sequential distribution                              |
| Least Load           | `least_load`           | Greedy load-based selection                          |
| Weighted Round Robin | `weighted_round_robin` | Sequential distribution weighted by processing power |
| Priority Based       | `priority_based`       | Highest-priority requests first, then least-utilized |
| Genetic Algorithm    | `genetic_algorithm`    | Optimization-based assignment                        |

All algorithms must respect the server capacity constraint.

---

## 8. Simulation Modes

The backend supports two execution modes.

### Single Algorithm

One selected algorithm is executed.

Example:

```text
algorithm = "least_load"
```

Only the Least Load simulation is performed.

### Compare All

All supported algorithms are executed for comparison.

Example:

```text
algorithm = "all"
```

The comparison uses the **same generated simulation scenario** so that the algorithm results can be compared under the same conditions.

---

## 9. API

### Run Simulation

```http
POST /api/simulate
```

### Request Body

```json
{
    "algorithm": "least_load",
    "number_of_requests": 100,
    "number_of_servers": 5,
    "server_type": "heterogeneous",
    "workload_type": "medium"
}
```

### Configuration Fields

| Field                | Type    | Description                             |
| -------------------- | ------- | --------------------------------------- |
| `algorithm`          | string  | Algorithm to execute                    |
| `number_of_requests` | integer | Number of requests                      |
| `number_of_servers`  | integer | Number of servers                       |
| `server_type`        | string  | `homogeneous` or `heterogeneous`        |
| `workload_type`      | string  | `light`, `medium`, `heavy`, or `random` |

Supported algorithm values:

```text
round_robin
least_load
weighted_round_robin
priority_based
genetic_algorithm
all
```

---

## 10. API Response

The API returns the simulation results in **JSON format**.

Results include information about:

* Algorithm used
* Simulation configuration
* Servers
* Request assignments
* Server loads
* Accepted requests
* Rejected requests
* Acceptance rate
* Rejection rate
* Algorithm-specific information

For comparison mode, results for all algorithms are returned together.

---

## 10a. Timeline API (Discrete-Event Simulation)

### Run Timeline Simulation

```http
POST /api/simulate/timeline
```

This endpoint answers a **different question** from `/api/simulate`.

| | `/api/simulate` | `/api/simulate/timeline` |
| --- | --- | --- |
| Question | If everything arrives at once, where does it land? | As requests arrive over time and servers work through them, what happens? |
| Time | none | discrete-event clock |
| Completion | never | a request finishes and **releases** its workload |
| Capacity means | total workload ever accepted | **concurrent** workload (queued + in service) |
| Utilization means | share of capacity used | share of **time busy** |
| Modes | single or `all` | single algorithm only |

Because a finished request frees capacity here, the two endpoints report
different acceptance rates for the same configuration. That is intended —
neither is wrong, they model different things.

### Request Body

```json
{
    "algorithm": "least_load",
    "number_of_requests": 1500,
    "number_of_servers": 20,
    "server_type": "heterogeneous",
    "workload_type": "medium",
    "arrival_rate": 2
}
```

`arrival_rate` is in requests per second. **`0` means a burst** — every request
arrives at once.

### Service Model

The service model is the same one `services/metrics.py` already assumes: a
server works through its queue **one request at a time**, and a request of
workload `w` occupies a server of power `p` for `w / p` time units.

It follows that the pool can sustain:

```text
capacity_rate = total_processing_power / mean_workload   requests per second
```

Arrival rates below that are absorbed; above it, queues build and then
requests are refused. This value is returned in the `system` block.

### Per-Algorithm Behaviour

| Algorithm | Online behaviour |
| --- | --- |
| Round Robin | Next server in rotation, with the same capacity fallback scan |
| Least Load | Least loaded server that still has room |
| Weighted Round Robin | Rotation over weighted slots |
| Priority Based | Placement is least-load; each **server serves its queue highest priority first** |
| Genetic Algorithm | Has no online form — its batch solution is computed up front and replayed as requests arrive |

### Response

```text
mode          "timeline"
servers       id, capacity, processing_power
system        total_processing_power, mean_workload, capacity_rate, per_server_rate
requests      per request: arrival, server, start, end, status
samples       point-in-time snapshots on a fixed grid: load, in_service, completed, rejected
summary       accepted / rejected / rates
metrics       utilization, imbalance, waiting, response, throughput, makespan
duration      makespan of the run
```

`samples` are **point-in-time** snapshots, not window aggregates — a request
counts only if it is in the server at that exact instant. Aggregating over a
window would double count one request finishing and another starting inside
the same window, and could report a load above the server's capacity.

### Tests

```bash
python -m unittest tests.test_timeline
```

These assert the invariants: a server never serves two requests at once,
capacity is never exceeded, service time equals `workload / processing_power`,
and no sample ever exceeds capacity.

## 11. Running the Backend

From the `backend` directory:

```bash
python app.py
```

The Flask development server runs locally, typically at:

```text
http://127.0.0.1:5000
```

The simulation endpoint is:

```text
http://127.0.0.1:5000/api/simulate
```

---

## 12. Testing

Backend tests are located in:

```text
tests/test_simulation.py
```

Run the tests from the `backend` directory:

```bash
python -m tests.test_simulation
```

API behavior can also be tested using tools such as **Thunder Client** or **Postman**.

---

## 13. Backend Design Summary

```text
Input Configuration
        ↓
Data Generation
        ↓
Servers + Requests
        ↓
Selected Algorithm
        ↓
Capacity Validation
        ↓
Request Assignment
        ↓
Metrics Calculation
        ↓
JSON Simulation Result
```

The backend serves as the **simulation engine** of the Load Balancer project. It keeps the simulation models, algorithms, execution logic, capacity constraints, and performance metrics separate from the API layer.
