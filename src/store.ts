import { writable, derived } from 'svelte/store'
import type { ProFormaProject, ComputedOutputs } from './schema'
import { defaultProject } from './template'
import { compute } from './compute'

const STORAGE_KEY = 'proforma-project'

function loadFromStorage(): ProFormaProject {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as ProFormaProject
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

// ─── PROJECT STORE ────────────────────────────────────────────────────────────
// All workshop edits write here. Derived stores react automatically.

export const project = writable<ProFormaProject>(loadFromStorage())

project.subscribe(persist)

// ─── COMPUTED OUTPUTS ─────────────────────────────────────────────────────────
// Reruns whenever project changes. Components subscribe to this for live numbers.

export const computed = derived<typeof project, ComputedOutputs>(
  project,
  ($project) => compute($project),
)

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function resetToTemplate() {
  project.set(defaultProject)
}

export function importProject(data: ProFormaProject) {
  project.set(data)
}

export function exportProjectJSON(): string {
  let snapshot: ProFormaProject = defaultProject
  project.subscribe(p => { snapshot = p })()
  return JSON.stringify(snapshot, null, 2)
}
