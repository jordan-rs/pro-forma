import type { BriefState } from '../brief/briefSchema'
import { briefToComputeGraph, type BriefScenario } from '../brief/briefToComputeGraph'
import { computeAll } from '../canvas/canvasCompute'

export interface ScenarioSummary {
  name: string
  paybackMonth: number | null
  m24Net: number
  annualLift: number
}

export interface BriefComputeResult {
  scenarios: ScenarioSummary[]
  formulaError: string | null
}

const RUNS: { scenario: BriefScenario; name: string }[] = [
  { scenario: 'low',  name: 'Conservative' },
  { scenario: 'base', name: 'Base Case'    },
  { scenario: 'high', name: 'Optimistic'   },
]

export function computeBriefScenarios(state: BriefState): BriefComputeResult {
  let formulaError: string | null = null
  const scenarios: ScenarioSummary[] = []

  for (const { scenario, name } of RUNS) {
    const { state: canvasState, annualLift, formulaError: fe } = briefToComputeGraph(state, scenario)
    if (fe) formulaError = fe

    const { cache } = computeAll(canvasState)
    const cfRaw = cache.get('brief-cf')
    const cumulative: number[] = (cfRaw?.['cumulative'] as unknown as number[]) ?? []
    const m24Net = cumulative[24] ?? 0

    let paybackMonth: number | null = null
    for (let t = 1; t < cumulative.length; t++) {
      if (cumulative[t] >= 0 && cumulative[t - 1] < 0) {
        paybackMonth = t
        break
      }
    }

    scenarios.push({ name, paybackMonth, m24Net, annualLift })
  }

  return { scenarios, formulaError }
}
