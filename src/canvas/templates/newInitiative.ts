import type { CanvasState } from '../canvasSchema'
import { createBlock } from '../canvasSchema'

export function newInitiative(): CanvasState {
  const locked = {
    ...createBlock('locked', 80, 100),
    label: 'Initiative inputs',
    acquisitions: 1_000_000,
    renewalPrice: 99,
    rcFeeY1: 0,
    rcFeeY2: 0,
    migrationCost: 250_000,
    h: 220,
  } as ReturnType<typeof createBlock>

  const assumption = {
    ...createBlock('assumption', 80, 360),
    label: 'Revenue assumptions',
    baselineTrialStart: 7, baselineTrialPaid: 50, baselineRenewal: 40,
    trialStart: 7, trialPaid: 50, renewal: 40,
    h: 180,
  } as ReturnType<typeof createBlock>

  const driverCapex = {
    ...createBlock('driver', 440, 80),
    label: 'Capex',
    name: 'Capital investment',
    category: 'capex' as const,
    baseValue: 250_000,
    growthRate: 0,
    timeHorizon: 24,
    h: 160,
  } as ReturnType<typeof createBlock>

  const driverOpex = {
    ...createBlock('driver', 440, 280),
    label: 'Ongoing cost',
    name: 'Operating cost',
    category: 'variable_cost' as const,
    baseValue: 80_000,
    growthRate: 5,
    timeHorizon: 24,
    h: 160,
  } as ReturnType<typeof createBlock>

  const scenario = {
    ...createBlock('scenario', 800, 100),
    label: 'Initiative scenarios',
    scenarios: [
      { id: 'cons', name: 'Conservative', cssModifier: 'sc-cons', trialStartDelta: 0.5, trialPaidDelta: 2, renewalDelta: 2 },
      { id: 'mid',  name: 'Mid',          cssModifier: 'sc-mid',  trialStartDelta: 1,   trialPaidDelta: 4, renewalDelta: 4 },
      { id: 'opt',  name: 'Optimistic',   cssModifier: 'sc-opt',  trialStartDelta: 2,   trialPaidDelta: 6, renewalDelta: 6 },
    ],
    h: 220,
  } as ReturnType<typeof createBlock>

  const cashflow = {
    ...createBlock('cashflow', 1160, 80),
    label: '36-month cash flow',
    projectionMonths: 36,
    h: 200,
  } as ReturnType<typeof createBlock>

  const metricNet = {
    ...createBlock('metric', 1160, 320),
    label: 'M24 net return',
    title: 'M24 net',
    unit: '$',
    staticValue: null,
    h: 100,
  } as ReturnType<typeof createBlock>

  const textHeadline = {
    ...createBlock('text', 80, 600),
    label: 'Headline',
    markdown: '# New Initiative\n\nReplace this with your initiative headline and key narrative.',
    w: 380, h: 120,
    exportIncluded: true,
  } as ReturnType<typeof createBlock>

  const blocks = [locked, assumption, driverCapex, driverOpex, scenario, cashflow, metricNet, textHeadline]

  function wire(fromBlockId: string, fromPort: string, toBlockId: string, toPort: string) {
    return { id: `wire-${fromBlockId.slice(-4)}-${fromPort}-${toBlockId.slice(-4)}-${toPort}`, fromBlockId, fromPort, toBlockId, toPort }
  }

  const wires = [
    wire(locked.id,     'migrationCost', driverCapex.id, 'baseValueOverride'),
    wire(locked.id,     'acquisitions',  scenario.id,    'lockedInputs'),
    wire(assumption.id, 'trialStart',    scenario.id,    'assumptions'),
    wire(driverCapex.id,'totalY1',       scenario.id,    'costY1'),
    wire(driverOpex.id, 'totalY1',       scenario.id,    'costY2'),
    wire(scenario.id,   'annualLift',    cashflow.id,    'annualLift'),
    wire(scenario.id,   'costAddedY1',   cashflow.id,    'costY1'),
    wire(scenario.id,   'costAddedY2',   cashflow.id,    'costY2'),
    wire(scenario.id,   'scenarios',     metricNet.id,   'value'),
  ]

  return { version: '1', blocks, wires, viewport: { x: 0, y: 0, zoom: 1 }, compose: { style: 'editorial', layout: 'brief' } }
}
