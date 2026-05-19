import type { BriefState } from './briefSchema'

const KEY = 'pf-brief-v1'

export function loadBrief(): BriefState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.version !== '1') return null
    return parsed as BriefState
  } catch {
    return null
  }
}

export function saveBrief(state: BriefState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // storage full — silently skip
  }
}
