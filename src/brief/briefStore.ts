import { writable } from 'svelte/store'
import type { BriefState } from './briefSchema'
import { defaultBriefState } from './briefSchema'
import { loadBrief, saveBrief } from './persistence'

// Detect if this page is being served by the MCP HTTP server.
// The MCP server always includes /api/brief at the same origin.
const MCP_MODE = typeof window !== 'undefined' && (
  window.location.port !== '5173' &&
  window.location.port !== '5174' &&
  window.location.port !== '4173'
)

// When an SSE update arrives, we set this flag so the subscribe callback
// skips the POST-back for that one update (avoids server→browser→server loop).
let _skipNextPost = false

export function skipNextPost(): void {
  _skipNextPost = true
}

export const briefStore = writable<BriefState>(loadBrief() ?? defaultBriefState())

// Hydrate from MCP server state on load, then keep local edits synced back.
if (MCP_MODE && typeof window !== 'undefined') {
  fetch('/api/brief')
    .then(r => r.ok ? r.json() : null)
    .then((state: BriefState | null) => {
      if (state) {
        _skipNextPost = true
        briefStore.set(state)
      }
    })
    .catch(() => { /* standalone mode fallback — store already has localStorage value */ })
}

briefStore.subscribe(state => {
  saveBrief(state)

  if (MCP_MODE && !_skipNextPost) {
    fetch('/api/brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    }).catch(() => { /* best-effort sync */ })
  }

  _skipNextPost = false
})
