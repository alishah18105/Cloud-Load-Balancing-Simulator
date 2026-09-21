#!/usr/bin/env node
/*
  Starts the Vite dev server for `npm run dev`.

  Installs frontend dependencies first if frontend/node_modules is missing,
  so a fresh clone works without a separate `cd frontend && npm install`.

  Vite is launched through `node` directly rather than via `npm run dev`.
  That avoids the Windows `npm.cmd` shim entirely: Node refuses to spawn .cmd
  files without a shell (EINVAL), and spawning with a shell plus an args array
  triggers a DEP0190 deprecation warning. Running node on Vite's own entry
  script needs neither.
*/

const { spawn, spawnSync } = require('node:child_process')
const path = require('node:path')
const fs = require('node:fs')

const frontendDir = path.join(__dirname, '..', 'frontend')
const viteEntry = path.join(frontendDir, 'node_modules', 'vite', 'bin', 'vite.js')

function log(message) {
  console.log(`[frontend] ${message}`)
}

if (!fs.existsSync(viteEntry)) {
  log('Installing dependencies (first run only)...')

  // A single command string (no args array) is the supported way to use a
  // shell, and lets Windows resolve npm.cmd for us.
  const install = spawnSync('npm install', {
    cwd: frontendDir,
    stdio: 'inherit',
    shell: true,
  })

  if (install.status !== 0 || !fs.existsSync(viteEntry)) {
    console.error('[frontend] npm install failed — see output above.')
    process.exit(install.status || 1)
  }
}

log('Starting Vite on http://localhost:5173 ...')

const server = spawn(process.execPath, [viteEntry], {
  cwd: frontendDir,
  stdio: 'inherit',
})

server.on('exit', (code) => process.exit(code ?? 0))
