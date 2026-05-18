import type { CanvasState } from '../canvasSchema'
import { createBlock } from '../canvasSchema'

export function buildVsBuy(): CanvasState {
  const locked = {
    ...createBlock('locked', 80, 100),
    label: 'Inputs',
    acquisitions: 500_000,
    renewalPrice: 120,
    rcFeeY1: 0,
    rcFeeY2: 0,
    migrationCost: 0,
    h: 220,
  } as ReturnType<typeof createBlock>

  const driverBuild = {
    ...createBlock('driver', 440, 80),
    label: 'Build cost',
    name: 'Internal build',
    category: 'capex' as const,
    baseValue: 400_000,
    growthRate: 0,
    timeHorizon: 24,
    h: 160,
  } as ReturnType<typeof createBlock>

  const driverBuy = {
    ...createBlock('driver', 440, 280),
    label: 'Buy cost (vendor)',
    name: 'Vendor fee',
    category: 'fixed_cost' as const,
    baseValue: 150_000,
    growthRate: 10,
    timeHorizon: 24,
    h: 160,
  } as ReturnType<typeof createBlock>

  const assumption = {
    ...createBlock('assumption', 80, 380),
    label: 'Assumptions',
    baselineTrialStart: 8, baselineTrialPaid: 55, baselineRenewal: 45,
    trialStart: 8, trialPaid: 55, renewal: 45,
    h: 180,
  } as ReturnType<typeof createBlock>

  const scenario = {
    ...createBlock('scenario', 800, 120),
    label: 'Build vs. Buy scenarios',
    scenarios: [
      { id: 'status', name: 'Status quo',  cssModifier: 'sc-cons', trialStartDelta: 0,   trialPaidDelta: 0,  renewalDelta: 0 },
      { id: 'build',  name: 'Build',       cssModifier: 'sc-mid',  trialStartDelta: 1,   trialPaidDelta: 2,  renewalDelta: 3 },
      { id: 'buy',    name: 'Buy',         cssModifier: 'sc-opt',  trialStartDelta: 1.5, trialPaidDelta: 3,  renewalDelta: 5 },
    ],
    h: 220,
  } as ReturnType<typeof createBlock>

  const comparison = {
    ...createBlock('comparison', 1160, 120),
    label: 'Build vs. Buy comparison',
    metrics: ['paybackMonth', 'm24Net'],
    h: 180,
  } as ReturnType<typeof createBlock>

  const metricBreakEven = {
    ...createBlock('metric', 1160, 340),
    label: 'Break-even month',
    title: 'Break-even month',
    unit: 'mo',
    staticValue: null,
    h: 100,
  } as ReturnType<typeof createBlock>

  const blocks = [locked, driverBuild, driverBuy, assumption, scenario, comparison, metricBreakEven]

  function wire(fromBlockId: string, fromPort: string, toBlockId: string, toPort: string) {
    return { id: `wire-${fromBlockId.slice(-4)}-${fromPort}-${toBlockId.slice(-4)}-${toPort}`, fromBlockId, fromPort, toBlockId, toPort }
  }

  const wires = [
    wire(locked.id,     'migrationCost', driverBuild.id, 'baseValueOverride'),
    wire(locked.id,     'rcFeeY1',       driverBuy.id,   'baseValueOverride'),
    wire(locked.id,     'acquisitions',  scenario.id,    'lockedInputs'),
    wire(assumption.id, 'trialStart',    scenario.id,    'assumptions'),
    wire(driverBuild.id,'totalY1',       scenario.id,    'costY1'),
    wire(driverBuy.id,  'totalY1',       scenario.id,    'costY2'),
    wire(scenario.id,   'scenarios',     comparison.id,  'scenarios'),
    wire(scenario.id,   'scenarios',     metricBreakEven.id, 'value'),
  ]

  return { version: '1', blocks, wires, viewport: { x: 0, y: 0, zoom: 1 }, compose: { style: 'clean', layout: 'grid' } }
}
