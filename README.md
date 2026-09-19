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
│   ├── __init__.py
│   ├── round_robin.py
│   ├── least_load.py
│   ├── priority.py
│   ├── weighted_greedy.py
│   └── genetic_algorithm.py
│
├── models/
│   ├── __init__.py
│   ├── request.py
│   └── server.py
│
├── routes/
│   ├── __init__.py
│   └── simulation_routes.py
│
├── services/
│   ├── __init__.py
│   ├── generator.py
│   ├── metrics.py
│   └── simulation.py
│
├── tests/
│   └── test_simulation.py
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

#### `priority.py`

Processes requests according to their priority, assigning higher-priority requests first while respecting server capacity.

#### `weighted_greedy.py`

Uses server processing capability/weight when selecting a suitable server. This is useful for heterogeneous servers.

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

### Server Types

#### Homogeneous

All servers have the same configuration.

Default capacity:

```text
100
```

Default processing power:

```text
1.0
```

#### Heterogeneous

Servers can have different capacities and processing powers.

Possible capacities include:

```text
80, 100, 120, 150, 200
```

Possible processing powers include:

```text
0.8, 1.0, 1.2, 1.5, 2.0
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
Server Capacity = 100
Current Load    = 80
Request Workload = 30
```

Since:

```text
80 + 30 = 110
```

the request is rejected for that server.

---

## 7. Algorithms

The backend currently supports:

| Algorithm         | Main Approach                       |
| ----------------- | ----------------------------------- |
| Round Robin       | Sequential distribution             |
| Least Load        | Greedy load-based selection         |
| Priority          | Priority-based request ordering     |
| Weighted Greedy   | Load + server processing capability |
| Genetic Algorithm | Optimization-based assignment       |

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
priority
weighted_greedy
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
