import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { getState, mergeState } from './briefState'

const APP_DIR = process.env.PROFORMA_APP_DIR
  ?? path.join(__dirname, '..', '..', 'app')

const IDLE_MS = 30 * 60 * 1000

const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
}

let _server: http.Server | null = null
let _port: number | null = null
let _clients = new Map<number, http.ServerResponse>()
let _clientIdSeq = 0
let _lastActivity = Date.now()
let _idleTimer: ReturnType<typeof setTimeout> | null = null

export function getPort(): number | null { return _port }
export function getUrl(): string | null { return _port ? `http://localhost:${_port}` : null }
export function isRunning(): boolean { return _server !== null }
export function getIdleMinutes(): number { return (Date.now() - _lastActivity) / 60000 }
export function minutesUntilClose(): number {
  return Math.max(0, (IDLE_MS - (Date.now() - _lastActivity)) / 60000)
}

export function resetActivity(): void {
  _lastActivity = Date.now()
  if (_idleTimer) clearTimeout(_idleTimer)
  _idleTimer = setTimeout(stopServer, IDLE_MS)
}

export function extendLifetime(minutes: number): void {
  if (_idleTimer) clearTimeout(_idleTimer)
  _idleTimer = setTimeout(stopServer, minutes * 60 * 1000)
}

export function broadcastState(): void {
  const json = JSON.stringify(getState())
  for (const [id, res] of _clients) {
    try {
      res.write(`data: ${json}\n\n`)
    } catch {
      _clients.delete(id)
    }
  }
}

export function stopServer(): void {
  if (_server) {
    for (const [, res] of _clients) {
      try { res.end() } catch { /* ignore */ }
    }
    _clients.clear()
    _server.close()
    _server = null
    _port = null
  }
  if (_idleTimer) {
    clearTimeout(_idleTimer)
    _idleTimer = null
  }
}

function serveFile(filePath: string, res: http.ServerResponse): void {
  const resolved = path.resolve(filePath)
  const appResolved = path.resolve(APP_DIR)
  if (!resolved.startsWith(appResolved)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }
  fs.readFile(resolved, (err: NodeJS.ErrnoException | null, data: Buffer) => {
    if (err) {
      res.writeHead(404)
      res.end('Not Found')
      return
    }
    const ext = path.extname(resolved)
    res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' })
    res.end(data)
  })
}

function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
  resetActivity()

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url ?? '/', 'http://localhost')

  if (url.pathname === '/api/brief') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(getState()))
      return
    }
    if (req.method === 'POST') {
      let body = ''
      req.on('data', (chunk: Buffer) => { body += chunk.toString() })
      req.on('end', () => {
        try {
          const partial = JSON.parse(body)
          mergeState(partial)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end('{"ok":true}')
        } catch {
          res.writeHead(400)
          res.end('Bad JSON')
        }
      })
      return
    }
  }

  if (url.pathname === '/api/events' && req.method === 'GET') {
    const id = ++_clientIdSeq
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    })
    res.flushHeaders()
    res.write(`: connected\n\n`)
    res.write(`data: ${JSON.stringify(getState())}\n\n`)
    _clients.set(id, res)
    req.on('close', () => _clients.delete(id))
    return
  }

  if (url.pathname === '/api/heartbeat' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end('{"ok":true}')
    return
  }

  // Static files
  const rel = url.pathname === '/' ? 'index.html' : url.pathname.slice(1)
  serveFile(path.join(APP_DIR, rel), res)
}

export function startServer(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handleRequest)
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      if (!addr || typeof addr === 'string') {
        reject(new Error('Failed to bind port'))
        return
      }
      _server = server
      _port = addr.port
      resetActivity()
      resolve(addr.port)
    })
    server.on('error', reject)
  })
}

export async function ensureRunning(): Promise<{ url: string; port: number; started: boolean }> {
  if (_server && _port) {
    resetActivity()
    return { url: `http://localhost:${_port}`, port: _port, started: false }
  }
  const port = await startServer()
  return { url: `http://localhost:${port}`, port, started: true }
}
