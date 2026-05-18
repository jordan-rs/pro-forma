import type { CanvasState } from '../canvasSchema'
import { createBlock } from '../canvasSchema'

// Pre-wired topology matching compute/index.ts:
//
//  LockedInputBlock ─┬─(migrationCost)──── DriverBlock (migration)
//                    ├─(rcFeeY1/rcFeeY2)── DriverBlock (RC cost)
//                    └─(all)────────────── AssumptionBlock (passes locked context)
//
//  AssumptionBlock ──(trialStart/trialPaid/renewal)── ScenarioBlock
//  DriverBlocks ─────(totalY1/totalY2)──────────────── ScenarioBlock
//  ScenarioBlock ────(scenarios/annualLift)─────────── CashFlowBlock
//                                                       MetricBlock (M24 net)
//                                                       MetricBlock (payback)
//                                                       ComparisonBlock

export function vendorDecision(): CanvasState {
  // ── Positions ──────────────────────────────────────────────────────────────
  const LOCKED_X      = 80,   LOCKED_Y      = 100
  const ASSUMPTION_X  = 80,   ASSUMPTION_Y  = 380
  const DRIVER_MIG_X  = 440,  DRIVER_MIG_Y  = 80
  const DRIVER_RC_X   = 440,  DRIVER_RC_Y   = 280
  const SCENARIO_X    = 800,  SCENARIO_Y    = 120
  const CASHFLOW_X    = 1160, CASHFLOW_Y    = 80
  const METRIC_NET_X  = 1160, METRIC_NET_Y  = 320
  const METRIC_PBK_X  = 1160, METRIC_PBK_Y  = 440
  const COMPARE_X     = 1160, COMPARE_Y     = 560

  // ── Blocks ─────────────────────────────────────────────────────────────────
  const locked = {
    ...createBlock('locked', LOCKED_X, LOCKED_Y),
    label: 'Locked inputs',
    acquisitions: 2_000_000,
    renewalPrice: 79,
    rcFeeY1: 163_000,
    rcFeeY2: 232_000,
    migrationCost: 11_000,
    h: 220,
  } as ReturnType<typeof createBlock>

  const assumption = {
    ...createBlock('assumption', ASSUMPTION_X, ASSUMPTION_Y),
    label: 'Revenue assumptions',
    baselineTrialStart: 9.5, baselineTrialPaid: 60, baselineRenewal: 47,
    trialStart: 9.5,         trialPaid: 60,          renewal: 47,
    h: 180,
  } as ReturnType<typeof createBlock>

  const driverMig = {
    ...createBlock('driver', DRIVER_MIG_X, DRIVER_MIG_Y),
    label: 'Migration cost',
    name: 'Migration Y1',
    category: 'fixed_cost' as const,
    baseValue: 11_000,
    growthRate: 0,
    timeHorizon: 24,
    h: 160,
  } as ReturnType<typeof createBlock>

  const driverRC = {
    ...createBlock('driver', DRIVER_RC_X, DRIVER_RC_Y),
    label: 'RC platform fee',
    name: 'RC fee',
    category: 'fixed_cost' as const,
    baseValue: 163_000,
    growthRate: 42,   // Y2 = $232K / $163K ≈ 42% growth
    timeHorizon: 24,
    h: 160,
  } as ReturnType<typeof createBlock>

  const scenario = {
    ...createBlock('scenario', SCENARIO_X, SCENARIO_Y),
    label: 'Scenarios',
    scenarios: [
      { id: 'cons', name: 'Conservative', cssModifier: 'sc-cons', trialStartDelta: 0.5, trialPaidDelta: 1,  renewalDelta: 2 },
      { id: 'mid',  name: 'Mid',          cssModifier: 'sc-mid',  trialStartDelta: 1,   trialPaidDelta: 3,  renewalDelta: 4 },
      { id: 'opt',  name: 'Optimistic',   cssModifier: 'sc-opt',  trialStartDelta: 2,   trialPaidDelta: 5,  renewalDelta: 6 },
    ],
    h: 220,
  } as ReturnType<typeof createBlock>

  const cashflow = {
    ...createBlock('cashflow', CASHFLOW_X, CASHFLOW_Y),
    label: '24-month P&L',
    projectionMonths: 24,
    h: 200,
  } as ReturnType<typeof createBlock>

  const metricNet = {
    ...createBlock('metric', METRIC_NET_X, METRIC_NET_Y),
    label: 'M24 net return',
    title: 'M24 net return',
    unit: '$',
    staticValue: null,
    h: 100,
  } as ReturnType<typeof createBlock>

  const metricPayback = {
    ...createBlock('metric', METRIC_PBK_X, METRIC_PBK_Y),
    label: 'Payback month',
    title: 'Payback month',
    unit: 'mo',
    staticValue: null,
    h: 100,
  } as ReturnType<typeof createBlock>

  const comparison = {
    ...createBlock('comparison', COMPARE_X, COMPARE_Y),
    label: 'Scenario comparison',
    metrics: ['paybackMonth', 'm24Net'],
    h: 180,
  } as ReturnType<typeof createBlock>

  const blocks = [locked, assumption, driverMig, driverRC, scenario, cashflow, metricNet, metricPayback, comparison]

  // ── Wires ──────────────────────────────────────────────────────────────────
  function wire(fromBlockId: string, fromPort: string, toBlockId: string, toPort: string) {
    return {
      id: `wire-${fromBlockId.slice(-4)}-${fromPort}-${toBlockId.slice(-4)}-${toPort}`,
      fromBlockId, fromPort, toBlockId, toPort,
    }
  }

  const wires = [
    wire(locked.id, 'migrationCost', driverMig.id, 'baseValueOverride'),
    wire(locked.id, 'rcFeeY1',       driverRC.id,  'baseValueOverride'),
    wire(locked.id, 'acquisitions',  scenario.id,  'lockedInputs'),

    wire(assumption.id, 'trialStart', scenario.id, 'assumptions'),

    wire(driverMig.id, 'totalY1', scenario.id, 'costY1'),
    wire(driverRC.id,  'totalY1', scenario.id, 'costY2'),

    wire(scenario.id, 'scenarios',   comparison.id,  'scenarios'),
    wire(scenario.id, 'annualLift',  cashflow.id,    'annualLift'),
    wire(scenario.id, 'costAddedY1', cashflow.id,    'costY1'),
    wire(scenario.id, 'costAddedY2', cashflow.id,    'costY2'),
    wire(scenario.id, 'scenarios',   metricNet.id,   'value'),
    wire(scenario.id, 'scenarios',   metricPayback.id, 'value'),
  ]

  return {
    version: '1',
    blocks,
    wires,
    viewport: { x: 0, y: 0, zoom: 1 },
    compose: { style: 'terminal', layout: 'mag' },
  }
}
