// ─── ADAPTER: Brief → CanvasState ────────────────────────────────────────────
// Materialises a minimal CanvasState in memory so canvasCompute.ts can evaluate
// the cashflow math without any canvas-specific assumptions or shared state.
//
// Graph shape:
//   [driver: rev]  ─annualCost→  [cashflow]
//   [driver: costY1] ─annualCost→ [cashflow]
//   [driver: costY2] ─annualCost→ [cashflow]
//
// The driver block is the simplest way to feed a constant into the kernel —
// it just passes baseValue through to annualCost with zero growth.

import type { CanvasState, DriverBlockData, CashFlowBlockData } from '../canvas/canvasSchema'
import type { BriefState } from './briefSchema'
import { evalFormula } from './formulaParser'

export type BriefScenario = 'low' | 'base' | 'high'

function variableValues(brief: BriefState, scenario: BriefScenario): Record<string, number> {
  const vars: Record<string, number> = {}
  for (const v of brief.variables) {
    vars[v.name] = scenario === 'low' ? v.low
                 : scenario === 'high' ? v.high
                 : v.base
  }
  return vars
}

function driverBlock(id: string, baseValue: number): DriverBlockData {
  return {
    id, type: 'driver',
    x: 0, y: 0, w: 0, h: 0,
    zIndex: 1, exportIncluded: false,
    label: id, name: id,
    category: 'fixed_cost',
    baseValue, growthRate: 0, timeHorizon: 24,
  }
}

export interface BriefGraphResult {
  state: CanvasState
  annualLift: number
  formulaError: string | null
}

export function briefToComputeGraph(brief: BriefState, scenario: BriefScenario): BriefGraphResult {
  const vars = variableValues(brief, scenario)

  let annualLift = 0
  let formulaError: string | null = null

  if (brief.revenueFormula.trim()) {
    const result = evalFormula(brief.revenueFormula, vars)
    if (typeof result === 'string') {
      formulaError = result
    } else {
      annualLift = result
    }
  }

  const costY1 = brief.costY1 ?? 0
  const costY2 = brief.costY2 ?? costY1

  const cfBlock: CashFlowBlockData = {
    id: 'brief-cf', type: 'cashflow',
    x: 0, y: 0, w: 0, h: 0,
    zIndex: 1, exportIncluded: false,
    label: 'Cash Flow', projectionMonths: 24,
  }

  const state: CanvasState = {
    version: '1',
    blocks: [
      driverBlock('brief-rev',      annualLift),
      driverBlock('brief-cost-y1',  costY1),
      driverBlock('brief-cost-y2',  costY2),
      cfBlock,
    ],
    wires: [
      { id: 'w1', fromBlockId: 'brief-rev',      fromPort: 'annualCost', toBlockId: 'brief-cf', toPort: 'annualLift' },
      { id: 'w2', fromBlockId: 'brief-cost-y1',  fromPort: 'annualCost', toBlockId: 'brief-cf', toPort: 'costY1'     },
      { id: 'w3', fromBlockId: 'brief-cost-y2',  fromPort: 'annualCost', toBlockId: 'brief-cf', toPort: 'costY2'     },
    ],
    viewport: { x: 0, y: 0, zoom: 1 },
    compose: brief.compose,
  }

  return { state, annualLift, formulaError }
}
