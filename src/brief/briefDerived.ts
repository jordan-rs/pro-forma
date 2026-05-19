// ─── BRIEF COMPUTED OUTPUTS ───────────────────────────────────────────────────
// Runs the brief through the shared compute kernel three times (low / base /
// high) and shapes the results into the same ScenarioResult type that the
// existing Chart and Scenarios blocks consume — so those blocks require no
// changes.

import { derived } from 'svelte/store'
import { briefStore } from './briefStore'
import { briefToComputeGraph, type BriefScenario } from './briefToComputeGraph'
import { computeAll } from '../canvas/canvasCompute'
import { fmtMoneyS } from '../compute'
import type { ChartPoint, ScenarioResult } from '../schema'

export interface BriefComputed {
  scenarios: ScenarioResult[]
  formulaError: string | null
  annualLift: Record<BriefScenario, number>
}

const RUNS: { scenario: BriefScenario; name: string; cssModifier: string }[] = [
  { scenario: 'low',  name: 'Conservative', cssModifier: 'sc-cons' },
  { scenario: 'base', name: 'Base Case',    cssModifier: 'sc-mid'  },
  { scenario: 'high', name: 'Optimistic',   cssModifier: 'sc-opt'  },
]

export const briefComputed = derived(briefStore, ($brief): BriefComputed => {
  let formulaError: string | null = null
  const scenarios: ScenarioResult[] = []
  const annualLift: Record<BriefScenario, number> = { low: 0, base: 0, high: 0 }

  for (const { scenario, name, cssModifier } of RUNS) {
    const { state, annualLift: lift, formulaError: fe } = briefToComputeGraph($brief, scenario)
    if (fe) formulaError = fe
    annualLift[scenario] = lift

    const { cache } = computeAll(state)
    const cfRaw = cache.get('brief-cf')

    const chartPoints: ChartPoint[] = (cfRaw?.['chartPoints'] as unknown as ChartPoint[]) ?? []
    const cumulative: number[]      = (cfRaw?.['cumulative']  as unknown as number[])     ?? []

    const m24Net = cumulative[24] ?? 0

    // First integer month where cumulative crosses zero from below
    let paybackMonth: number | null = null
    for (let t = 1; t < cumulative.length; t++) {
      if (cumulative[t] >= 0 && cumulative[t - 1] < 0) {
        paybackMonth = t
        break
      }
    }

    // Use "lift: $X" as leverage label so the scenario card shows the annual payoff
    const leverage = lift !== 0 ? `lift: ${fmtMoneyS(lift)}/yr` : scenario

    scenarios.push({
      id: scenario,
      name,
      cssModifier,
      paybackMonth,
      m24Net,
      leverage,
      chartPoints,
    })
  }

  return { scenarios, formulaError, annualLift }
})
