import type { BriefState } from '../brief/briefSchema'
import { defaultBriefState } from '../brief/briefSchema'

let _state: BriefState = defaultBriefState()

export function getState(): BriefState {
  return _state
}

export function setState(state: BriefState): void {
  _state = state
}

type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T

export function mergeState(partial: DeepPartial<BriefState>): BriefState {
  _state = deepMerge(_state, partial) as BriefState
  return _state
}

function deepMerge(target: unknown, source: unknown): unknown {
  if (source === null || source === undefined) return target
  if (typeof source !== 'object' || Array.isArray(source)) return source
  if (typeof target !== 'object' || target === null || Array.isArray(target)) return source

  const result = { ...(target as Record<string, unknown>) }
  for (const key of Object.keys(source as Record<string, unknown>)) {
    const srcVal = (source as Record<string, unknown>)[key]
    const tgtVal = result[key]
    result[key] = deepMerge(tgtVal, srcVal)
  }
  return result
}
