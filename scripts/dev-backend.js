#!/usr/bin/env node
/*
  Starts the Flask backend for `npm run dev`.

  On a first run (no backend/.venv yet) it creates the virtual environment and
  installs backend/requirements.txt automatically, so a fresh clone needs
  nothing beyond Node and Python already being on PATH. Every run after that
  just launches the server — `pip install` is quick when everything is
  already satisfied, so it is safe to run every time rather than trying to
  detect "is this already installed?" and risk running stale.
*/

const { spawn, spawnSync } = require('node:child_process')
const path = require('node:path')
const fs = require('node:fs')

const backendDir = path.join(__dirname, '..', 'backend')
const isWindows = process.platform === 'win32'

const venvDir = path.join(backendDir, '.venv')
const venvPython = isWindows
  ? path.join(venvDir, 'Scripts', 'python.exe')
  : path.join(venvDir, 'bin', 'python')

function log(message) {
  console.log(`[backend] ${message}`)
}

// `py` and `python` are real .exe files, so they can be spawned directly. Adding
// `shell: true` together with an args array is what makes Node print a DEP0190
// deprecation warning, so it is deliberately not used here.
function findSystemPython() {
  const candidates = isWindows ? ['py', 'python'] : ['python3', 'python']

  for (const candidate of candidates) {
    const check = spawnSync(candidate, ['--version'], { stdio: 'ignore' })

    if (check.status === 0) return candidate
  }

  return null
}

if (!fs.existsSync(venvPython)) {
  log('No virtual environment found — creating backend/.venv (first run only)...')

  const systemPython = findSystemPython()

  if (!systemPython) {
    console.error(
      '[backend] Could not find Python on PATH. Install Python 3.10+ and re-run `npm run dev`.',
    )
    process.exit(1)
  }

  const create = spawnSync(systemPython, ['-m', 'venv', '.venv'], {
    cwd: backendDir,
    stdio: 'inherit',
  })

  if (create.status !== 0) {
    console.error('[backend] Failed to create the virtual environment.')
    process.exit(create.status ?? 1)
  }
}

log('Checking dependencies (Flask, Flask-Cors)...')

const install = spawnSync(
  venvPython,
  ['-m', 'pip', 'install', '-q', '-r', 'requirements.txt'],
  { cwd: backendDir, stdio: 'inherit' },
)

if (install.status !== 0) {
  console.error('[backend] pip install failed — see output above.')
  process.exit(install.status ?? 1)
}

log('Starting Flask on http://127.0.0.1:5000 ...')

const server = spawn(venvPython, ['app.py'], {
  cwd: backendDir,
  stdio: 'inherit',
})

server.on('exit', (code) => process.exit(code ?? 0))
