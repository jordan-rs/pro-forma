import type { CanvasBlock, CanvasState, WireEdge } from './canvasSchema'
import type { ScenarioResult, ChartPoint } from '../schema'

// ─── OUTPUT TYPES ─────────────────────────────────────────────────────────────

export interface LockedOutputs {
  acquisitions: number
  renewalPrice: number
  rcFeeY1: number
  rcFeeY2: number
  migrationCost: number
}

export interface AssumptionOutputs {
  trialStart: number
  trialPaid: number
  renewal: number
  baselineTrialStart: number
  baselineTrialPaid: number
  baselineRenewal: number
}

export interface DriverOutputs {
  totalY1: number
  totalY2: number
  annualCost: number
}

export interface ScenarioOutputs {
  scenarios: ScenarioResult[]
  annualLift: number
  costAddedY1: number
  costAddedY2: number
}

export interface CashFlowOutputs {
  monthly: number[]
  cumulative: number[]
  chartPoints: ChartPoint[]
}

export type BlockOutputs = LockedOutputs | AssumptionOutputs | DriverOutputs | ScenarioOutputs | CashFlowOutputs | number | null

export type OutputCache = Map<string, Record<string, BlockOutputs>>

// ─── TOPOLOGICAL SORT (Kahn's algorithm) ──────────────────────────────────────

export function topoSort(blocks: CanvasBlock[], wires: WireEdge[]): { sorted: string[]; cycleIds: Set<string> } {
  const ids = blocks.map(b => b.id)
  const inDegree = new Map<string, number>(ids.map(id => [id, 0]))
  const adj = new Map<string, string[]>(ids.map(id => [id, []]))

  for (const wire of wires) {
    if (!inDegree.has(wire.fromBlockId) || !inDegree.has(wire.toBlockId)) continue
    adj.get(wire.fromBlockId)!.push(wire.toBlockId)
    inDegree.set(wire.toBlockId, (inDegree.get(wire.toBlockId) ?? 0) + 1)
  }

  const queue = ids.filter(id => inDegree.get(id) === 0)
  const sorted: string[] = []

  while (queue.length > 0) {
    const node = queue.shift()!
    sorted.push(node)
    for (const neighbor of (adj.get(node) ?? [])) {
      const deg = (inDegree.get(neighbor) ?? 0) - 1
      inDegree.set(neighbor, deg)
      if (deg === 0) queue.push(neighbor)
    }
  }

  const cycleIds = new Set(ids.filter(id => !sorted.includes(id)))
  return { sorted, cycleIds }
}

// ─── RESOLVE INPUTS ───────────────────────────────────────────────────────────
// For a given block, collect the values wired into its input ports.

export function resolveInputs(
  blockId: string,
  wires: WireEdge[],
  cache: OutputCache,
): Record<string, BlockOutputs> {
  const result: Record<string, BlockOutputs> = {}
  for (const wire of wires) {
    if (wire.toBlockId !== blockId) continue
    const fromOutputs = cache.get(wire.fromBlockId)
    if (!fromOutputs) continue
    result[wire.toPort] = fromOutputs[wire.fromPort] ?? null
  }
  return result
}

// ─── REVENUE MATH (mirrors compute/index.ts) ─────────────────────────────────

function annualLiftFromRates(
  acquisitions: number,
  renewalPrice: number,
  baselineTrialStart: number,
  baselineTrialPaid: number,
  baselineRenewal: number,
  trialStart: number,
  trialPaid: number,
  renewal: number,
): number {
  const baselineT = acquisitions * baselineTrialStart / 100
  const baselineP = baselineT * baselineTrialPaid / 100
  const baselineR = baselineP * baselineRenewal / 100

  const newT = acquisitions * trialStart / 100
  const newP = newT * trialPaid / 100
  const newR = newP * renewal / 100

  return (newP - baselineP) * renewalPrice + (newR - baselineR) * renewalPrice
}

function cumulativeLiftAt(t: number, annualLift: number): number {
  if (t < 3) return 0
  const monthly = annualLift / 12
  if (t < 9) return monthly * Math.pow(t - 3, 2) / 12
  return monthly * 36 / 12 + monthly * (t - 9)
}

function cumulativeCostAt(t: number, y1: number, y2: number): number {
  if (t <= 12) return y1 * (t / 12)
  return y1 + y2 * ((t - 12) / 12)
}

function findPayback(y1: number, y2: number, annualLift: number): number | null {
  for (let t = 3; t <= 24; t += 0.1) {
    if (cumulativeLiftAt(t, annualLift) >= cumulativeCostAt(t, y1, y2)) {
      return Math.round(t * 10) / 10
    }
  }
  return null
}

// ─── COMPUTE PER BLOCK TYPE ───────────────────────────────────────────────────

function computeBlock(block: CanvasBlock, inputs: Record<string, BlockOutputs>): Record<string, BlockOutputs> {
  switch (block.type) {
    case 'locked': {
      return {
        acquisitions:  block.acquisitions,
        renewalPrice:  block.renewalPrice,
        rcFeeY1:       block.rcFeeY1,
        rcFeeY2:       block.rcFeeY2,
        migrationCost: block.migrationCost,
      }
    }

    case 'assumption': {
      return {
        trialStart:         block.trialStart,
        trialPaid:          block.trialPaid,
        renewal:            block.renewal,
        baselineTrialStart: block.baselineTrialStart,
        baselineTrialPaid:  block.baselineTrialPaid,
        baselineRenewal:    block.baselineRenewal,
      }
    }

    case 'driver': {
      // baseValue may be overridden by a wired input
      const base = (inputs['baseValueOverride'] as number | null) ?? block.baseValue
      const y1 = base * (1 + block.growthRate / 100)
      const y2 = base * Math.pow(1 + block.growthRate / 100, 2)
      return { totalY1: y1, totalY2: y2, annualCost: base }
    }

    case 'scenario': {
      // Gather locked + assumption inputs
      const lockedIn = inputs['lockedInputs'] as LockedOutputs | null
      const assumIn  = inputs['assumptions']  as AssumptionOutputs | null
      const costY1   = (inputs['costY1']  as number | null) ?? 0
      const costY2   = (inputs['costY2']  as number | null) ?? 0

      const acq     = (lockedIn as LockedOutputs | null)?.acquisitions ?? 2_000_000
      const price   = (lockedIn as LockedOutputs | null)?.renewalPrice ?? 79
      const rcY1    = (lockedIn as LockedOutputs | null)?.rcFeeY1 ?? 0
      const rcY2    = (lockedIn as LockedOutputs | null)?.rcFeeY2 ?? 0
      const migY1   = (lockedIn as LockedOutputs | null)?.migrationCost ?? 0

      const bTS  = (assumIn as AssumptionOutputs | null)?.baselineTrialStart ?? 9.5
      const bTP  = (assumIn as AssumptionOutputs | null)?.baselineTrialPaid  ?? 60
      const bRn  = (assumIn as AssumptionOutputs | null)?.baselineRenewal    ?? 47

      // If no cost wired in, derive from locked + typical labor model
      // (simplified: use rcFee + migration as cost proxy)
      const derivedCostY1 = costY1 !== 0 ? costY1 : (rcY1 + migY1)
      const derivedCostY2 = costY2 !== 0 ? costY2 : rcY2

      const scenarios: ScenarioResult[] = block.scenarios.map(sc => {
        const ts   = bTS + sc.trialStartDelta
        const tp   = bTP + sc.trialPaidDelta
        const rn   = bRn + sc.renewalDelta
        const lift = annualLiftFromRates(acq, price, bTS, bTP, bRn, ts, tp, rn)
        const lift24 = cumulativeLiftAt(24, lift)
        const cost24 = cumulativeCostAt(24, derivedCostY1, derivedCostY2)
        const m24Net = lift24 - cost24
        const paybackMonth = findPayback(derivedCostY1, derivedCostY2, lift)
        const leverage = [sc.trialStartDelta, sc.trialPaidDelta, sc.renewalDelta]
          .map(d => (d >= 0 ? `+${d}pp` : `${d}pp`))
          .join(' / ')
        const chartPoints: ChartPoint[] = []
        for (let t = 0; t <= 24; t += 0.5) {
          chartPoints.push({ month: t, net: cumulativeLiftAt(t, lift) - cumulativeCostAt(t, derivedCostY1, derivedCostY2) })
        }
        return { id: sc.id, name: sc.name, cssModifier: sc.cssModifier, paybackMonth, m24Net, leverage, chartPoints }
      })

      // Mid-scenario lift for downstream cash-flow blocks
      const midIdx = Math.floor(block.scenarios.length / 2)
      const midSc = block.scenarios[midIdx]
      const midLift = annualLiftFromRates(
        acq, price, bTS, bTP, bRn,
        bTS + midSc.trialStartDelta,
        bTP + midSc.trialPaidDelta,
        bRn + midSc.renewalDelta,
      )

      return {
        scenarios: scenarios as unknown as BlockOutputs,
        annualLift: midLift,
        costAddedY1: derivedCostY1,
        costAddedY2: derivedCostY2,
      }
    }

    case 'cashflow': {
      const costY1     = (inputs['costY1']     as number | null) ?? 0
      const costY2     = (inputs['costY2']     as number | null) ?? 0
      const annualLift = (inputs['annualLift'] as number | null) ?? 0
      const months     = block.projectionMonths

      const monthly: number[] = []
      const cumulative: number[] = []
      const chartPoints: ChartPoint[] = []

      for (let t = 0; t <= months; t += 0.5) {
        const cum = cumulativeLiftAt(t, annualLift) - cumulativeCostAt(t, costY1, costY2)
        chartPoints.push({ month: t, net: cum })
      }
      for (let t = 0; t <= months; t++) {
        const net = cumulativeLiftAt(t, annualLift) - cumulativeCostAt(t, costY1, costY2)
        monthly.push(annualLift / 12 - (t === 0 ? costY1 / 12 : t <= 12 ? costY1 / 12 : costY2 / 12))
        cumulative.push(net)
      }

      return {
        monthly: monthly as unknown as BlockOutputs,
        cumulative: cumulative as unknown as BlockOutputs,
        chartPoints: chartPoints as unknown as BlockOutputs,
      }
    }

    default:
      return {}
  }
}

// ─── FULL COMPUTE PASS ────────────────────────────────────────────────────────

export function computeAll(state: CanvasState): { cache: OutputCache; cycleIds: Set<string> } {
  const { sorted, cycleIds } = topoSort(state.blocks, state.wires)
  const cache: OutputCache = new Map()

  for (const blockId of sorted) {
    const block = state.blocks.find(b => b.id === blockId)
    if (!block) continue
    const inputs = resolveInputs(blockId, state.wires, cache)
    const outputs = computeBlock(block, inputs)
    cache.set(blockId, outputs)
  }

  return { cache, cycleIds }
}
