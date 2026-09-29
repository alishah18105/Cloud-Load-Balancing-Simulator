# Cloud Load Balancing Simulator

A web-based **Cloud Load Balancing Simulator** that demonstrates how different load-balancing algorithms distribute requests across multiple servers.

The project provides an interactive interface to configure simulations, visualize server loads, compare algorithms, and observe request flow through a simulated cloud environment.

## 🌐 Live Demo

**Frontend:**
https://cloud-load-balancing-simulator.vercel.app/

**Backend API:**
https://cloud-load-balancing-simulator.onrender.com

## 🚀 Features

* Simulate multiple load-balancing algorithms
* Compare algorithm performance
* Visualize server utilization and request distribution
* Interactive live request-flow simulation
* Support for different server capacities and workloads
* Metrics for accepted/rejected requests, utilization, load imbalance, and performance
* Responsive React-based interface

## 🧠 Algorithms

The simulator currently supports:

* Round Robin
* Least Load
* Weighted Round Robin
* Priority Based
* Genetic Algorithm

## 🛠️ Technology Stack

**Frontend**

* React
* Vite
* Tailwind CSS
* Recharts

**Backend**

* Python
* Flask
* Flask-CORS

**Tools**

* Git & GitHub
* Node.js
* REST API

## 🏗️ Project Structure

```text
Cloud-Load-Balancing-Simulator/
│
├── backend/        # Flask API, simulations & algorithms
│   └── README.md
│
├── frontend/       # React interface & visualizations
│   └── README.md
│
├── scripts/        # Development scripts
│
├── package.json
└── README.md
```

Detailed documentation for each part of the project is available here:

* [Frontend Documentation](./frontend/README.md)
* [Backend Documentation](./backend/README.md)

## ⚙️ Run Locally

Clone the repository:

```bash
git clone https://github.com/alishah18105/Cloud-Load-Balancing-Simulator.git
cd Cloud-Load-Balancing-Simulator
```

Install dependencies:

```bash
npm install
```

Start the frontend and backend:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://127.0.0.1:5000
```

## 📌 Project

**Cloud Load Balancing Simulator**
Design & Analysis of Algorithms Project

[GitHub Repository](https://github.com/alishah18105/Cloud-Load-Balancing-Simulator)
