# Cloud Load Balancing Simulator

A Design & Analysis of Algorithms project. It simulates five load-balancing
strategies — Round Robin, Least Load, Weighted Round Robin, Priority Based and a
Genetic Algorithm — under a hard server capacity constraint, and presents the
results visually.

| Folder | What it is |
| --- | --- |
| [`backend/`](backend/README.md) | Flask simulation engine and REST API |
| [`frontend/`](frontend/README.md) | React interface: dashboard, live request flow, algorithm comparison |

---

## Running it

You need **Node.js** and **Python 3.10+** installed. Then, from this folder:

```bash
npm install     # once — installs the tool that runs both servers together
npm run dev     # every time
```

That single `npm run dev` starts both servers:

| Server | URL |
| --- | --- |
| Frontend (open this one) | http://localhost:5173 |
| Backend API | http://127.0.0.1:5000 |

Press **Ctrl+C** once to stop both.

### First run

On a fresh clone, `npm run dev` sets everything else up for you:

* creates `backend/.venv` and installs `backend/requirements.txt`
* runs `npm install` inside `frontend/`

This happens only when something is missing, so later runs start straight away.

### Running one side on its own

```bash
npm run dev:backend
npm run dev:frontend
```

### Troubleshooting

* **"address already in use"** — an earlier run is still holding port 5000 or
  5173. Close that terminal, or end the leftover `python` / `node` process.
* **"Could not find Python on PATH"** — install Python 3.10 or newer and make
  sure it is on your PATH, then run `npm run dev` again.
* **The page loads but every simulation fails** — the backend did not start.
  Look at the `[BACKEND]` lines in the terminal for the reason.
