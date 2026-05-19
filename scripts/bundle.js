#!/usr/bin/env node
// Assembles the mcpb bundle directory from the Vite build + compiled MCP server.
// Run after: npm run build && npm run build:mcp

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const BUNDLE_DIR = path.join(ROOT, 'bundle')

function cp(src, dest) {
  const stat = fs.statSync(src, { throwIfNoEntry: false })
  if (!stat) throw new Error(`Source not found: ${src}`)
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true })
    for (const entry of fs.readdirSync(src)) {
      cp(path.join(src, entry), path.join(dest, entry))
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(src, dest)
  }
}

// Clean bundle dir
fs.rmSync(BUNDLE_DIR, { recursive: true, force: true })
fs.mkdirSync(BUNDLE_DIR)

// Copy Vite build → bundle/app/
console.log('Copying Vite build → bundle/app/')
cp(path.join(ROOT, 'dist'), path.join(BUNDLE_DIR, 'app'))

// Copy compiled MCP server → bundle/server/
console.log('Copying MCP server → bundle/server/')
cp(path.join(ROOT, 'server'), path.join(BUNDLE_DIR, 'server'))

// Install production deps inside bundle/server/
console.log('Installing production dependencies in bundle/server/')
// Write a minimal package.json for the server bundle
const serverPkg = {
  name: 'proforma-mcp-server',
  version: '1.0.0',
  type: 'commonjs',
  dependencies: {
    '@modelcontextprotocol/sdk': fs.readFileSync(path.join(ROOT, 'node_modules/@modelcontextprotocol/sdk/package.json'), 'utf8')
      .match(/"version":\s*"([^"]+)"/)?.[1] ?? '*',
    zod: fs.readFileSync(path.join(ROOT, 'node_modules/zod/package.json'), 'utf8')
      .match(/"version":\s*"([^"]+)"/)?.[1] ?? '*',
  },
}
fs.writeFileSync(
  path.join(BUNDLE_DIR, 'server', 'package.json'),
  JSON.stringify(serverPkg, null, 2),
)
execSync('npm install --production', {
  cwd: path.join(BUNDLE_DIR, 'server'),
  stdio: 'inherit',
})

// Copy manifest.json → bundle/
console.log('Copying manifest.json → bundle/')
fs.copyFileSync(path.join(ROOT, 'manifest.json'), path.join(BUNDLE_DIR, 'manifest.json'))

console.log('\nBundle ready at: bundle/')
console.log('Run: mcpb pack bundle/ to produce proforma-brief.mcpb')
