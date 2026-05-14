import { writable, derived } from 'svelte/store'
import type { ProFormaProject, ComputedOutputs } from './schema'
import { defaultProject } from './template'
import { compute } from './compute'
import { THEMES, defaultThemeId } from './themes/registry'
import { LAYOUTS, defaultLayoutId } from './layouts/registry'

const STORAGE_KEY = 'proforma-project'


// ─── THEME / LAYOUT ID MIGRATION ─────────────────────────────────────────────
// Saved projects may reference theme or layout IDs that no longer exist
// (renamed, removed, replaced). Rather than crash or silently render
// nothing, we map known-old IDs to the closest surviving theme/layout, and
// fall through to the registered defaults if no mapping applies.
//
// FOR LLMs EDITING THIS PROJECT
// -----------------------------------------------------------------------------
// When you REMOVE or RENAME a theme/layout, add an entry to the maps below
// so existing saved projects still load gracefully. Map to the closest
// surviving theme — not to the default — to preserve user intent where
// possible.

const THEME_ID_MIGRATIONS: Record<string, string> = {
  // Stage 1+2 refactor: 'modernist' was replaced by 'paper'. Paper is the
  // closest surviving B&W theme.
  modernist: 'paper',
  // Add future renames here:
  //   oldId: 'newId',
}

const LAYOUT_ID_MIGRATIONS: Record<string, string> = {
  // None yet. Add entries here as layouts are renamed/removed.
}

function migrateThemeId(id: string | undefined): string {
  if (!id) return defaultThemeId
  // Direct match → keep
  if (THEMES.some(t => t.id === id)) return id
  // Known migration → map
  if (THEME_ID_MIGRATIONS[id]) return THEME_ID_MIGRATIONS[id]
  // Unknown → default
  return defaultThemeId
}

function migrateLayoutId(id: string | undefined): string {
  if (!id) return defaultLayoutId
  if (LAYOUTS.some(l => l.id === id)) return id
  if (LAYOUT_ID_MIGRATIONS[id]) return LAYOUT_ID_MIGRATIONS[id]
  return defaultLayoutId
}

function migrateProject(p: ProFormaProject): ProFormaProject {
  if (!p?.compose) return p
  return {
    ...p,
    compose: {
      ...p.compose,
      style:  migrateThemeId(p.compose.style),
      layout: migrateLayoutId(p.compose.layout),
    },
  }
}


// ─── PERSISTENCE ─────────────────────────────────────────────────────────────

function loadFromStorage(): ProFormaProject {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return migrateProject(JSON.parse(raw) as ProFormaProject)
  } catch {
    // corrupted storage — fall back to template
  }
  return defaultProject
}

function persist(project: ProFormaProject) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
  } catch {
    // storage quota exceeded — ignore
  }
}


// ─── PROJECT STORE ───────────────────────────────────────────────────────────
// All workshop edits write here. Derived stores react automatically.

export const project = writable<ProFormaProject>(loadFromStorage())

project.subscribe(persist)


// ─── COMPUTED OUTPUTS ────────────────────────────────────────────────────────

export const computed = derived<typeof project, ComputedOutputs>(
  project,
  ($project) => compute($project),
)


// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function resetToTemplate() {
  project.set(defaultProject)
}

export function importProject(data: ProFormaProject) {
  project.set(migrateProject(data))
}

export function exportProjectJSON(): string {
  let snapshot: ProFormaProject = defaultProject
  project.subscribe(p => { snapshot = p })()
  return JSON.stringify(snapshot, null, 2)
}
