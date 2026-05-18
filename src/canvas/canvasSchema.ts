// ─── PORT TYPES ───────────────────────────────────────────────────────────────
// Port types constrain what can connect to what. Mismatched types warn but
// still allow connection so operators are never blocked by the validator.

export type PortType = 'dollar' | 'rate' | 'count' | 'scenarios' | 'assumptions' | 'timeseries' | 'impactstrip' | 'number'

export interface PortDef {
  key: string
  label: string
  type: PortType
}

// ─── WIRE EDGE ────────────────────────────────────────────────────────────────

export interface WireEdge {
  id: string
  fromBlockId: string
  fromPort: string
  toBlockId: string
  toPort: string
}

// ─── BLOCK TYPES ─────────────────────────────────────────────────────────────

export type CanvasBlockType =
  | 'text'
  | 'metric'
  | 'locked'
  | 'assumption'
  | 'driver'
  | 'scenario'
  | 'cashflow'
  | 'sensitivity'
  | 'comparison'

interface CanvasBlockBase {
  id: string
  type: CanvasBlockType
  x: number
  y: number
  w: number
  h: number
  zIndex: number
  exportIncluded: boolean
  label: string
}

export interface TextBlockData extends CanvasBlockBase {
  type: 'text'
  markdown: string
}

export interface MetricBlockData extends CanvasBlockBase {
  type: 'metric'
  title: string
  unit: string
  staticValue: number | null
}

export interface LockedInputBlockData extends CanvasBlockBase {
  type: 'locked'
  acquisitions: number
  renewalPrice: number
  rcFeeY1: number
  rcFeeY2: number
  migrationCost: number
}

export interface AssumptionBlockData extends CanvasBlockBase {
  type: 'assumption'
  // Baseline (no-lift) rates
  baselineTrialStart: number
  baselineTrialPaid: number
  baselineRenewal: number
  // Current assumption rates (slider state)
  trialStart: number
  trialPaid: number
  renewal: number
}

export interface DriverBlockData extends CanvasBlockBase {
  type: 'driver'
  name: string
  category: 'revenue' | 'variable_cost' | 'fixed_cost' | 'capex'
  baseValue: number
  growthRate: number
  timeHorizon: number
}

export interface ScenarioBlockData extends CanvasBlockBase {
  type: 'scenario'
  scenarios: {
    id: string
    name: string
    cssModifier: string
    trialStartDelta: number
    trialPaidDelta: number
    renewalDelta: number
  }[]
}

export interface CashFlowBlockData extends CanvasBlockBase {
  type: 'cashflow'
  projectionMonths: number
}

export interface SensitivityBlockData extends CanvasBlockBase {
  type: 'sensitivity'
  sweepPort: string
  outputPort: string
  sweepRange: number
}

export interface ComparisonBlockData extends CanvasBlockBase {
  type: 'comparison'
  metrics: string[]
}

export type CanvasBlock =
  | TextBlockData
  | MetricBlockData
  | LockedInputBlockData
  | AssumptionBlockData
  | DriverBlockData
  | ScenarioBlockData
  | CashFlowBlockData
  | SensitivityBlockData
  | ComparisonBlockData

// ─── PORT CATALOG ─────────────────────────────────────────────────────────────
// Single source of truth for which ports each block type exposes.

export const PORT_CATALOG: Record<CanvasBlockType, { outputs: PortDef[]; inputs: PortDef[] }> = {
  text: { outputs: [], inputs: [] },
  metric: {
    outputs: [],
    inputs: [{ key: 'value', label: 'Value', type: 'number' }],
  },
  locked: {
    outputs: [
      { key: 'acquisitions',  label: 'Acquisitions/yr',  type: 'count'  },
      { key: 'renewalPrice',  label: 'Renewal price',    type: 'dollar' },
      { key: 'rcFeeY1',       label: 'RC fee Y1',        type: 'dollar' },
      { key: 'rcFeeY2',       label: 'RC fee Y2+',       type: 'dollar' },
      { key: 'migrationCost', label: 'Migration cost',   type: 'dollar' },
    ],
    inputs: [],
  },
  assumption: {
    outputs: [
      { key: 'trialStart', label: 'Trial-start %',  type: 'rate' },
      { key: 'trialPaid',  label: 'Trial→paid %',   type: 'rate' },
      { key: 'renewal',    label: 'Renewal %',      type: 'rate' },
      { key: 'baseline',   label: 'Baseline rates', type: 'assumptions' },
    ],
    inputs: [],
  },
  driver: {
    outputs: [
      { key: 'totalY1',   label: 'Total Y1',   type: 'dollar' },
      { key: 'totalY2',   label: 'Total Y2',   type: 'dollar' },
      { key: 'annualCost',label: 'Annual cost', type: 'dollar' },
    ],
    inputs: [
      { key: 'baseValueOverride', label: 'Base value override', type: 'dollar' },
    ],
  },
  scenario: {
    outputs: [
      { key: 'scenarios', label: 'Scenarios', type: 'scenarios' },
    ],
    inputs: [
      { key: 'lockedInputs',  label: 'Locked inputs',  type: 'dollar'      },
      { key: 'assumptions',   label: 'Assumptions',    type: 'assumptions' },
      { key: 'costY1',        label: 'Cost Y1',        type: 'dollar'      },
      { key: 'costY2',        label: 'Cost Y2',        type: 'dollar'      },
    ],
  },
  cashflow: {
    outputs: [
      { key: 'monthly',     label: 'Monthly net',     type: 'timeseries' },
      { key: 'cumulative',  label: 'Cumulative net',  type: 'timeseries' },
    ],
    inputs: [
      { key: 'costY1',     label: 'Cost Y1',      type: 'dollar' },
      { key: 'costY2',     label: 'Cost Y2',      type: 'dollar' },
      { key: 'annualLift', label: 'Annual lift',  type: 'dollar' },
    ],
  },
  sensitivity: {
    outputs: [
      { key: 'impactStrip', label: 'Impact strip', type: 'impactstrip' },
    ],
    inputs: [
      { key: 'sweepInput',    label: 'Sweep input',     type: 'rate'   },
      { key: 'outputToWatch', label: 'Output to watch', type: 'number' },
    ],
  },
  comparison: {
    outputs: [],
    inputs: [
      { key: 'scenarios', label: 'Scenarios', type: 'scenarios' },
    ],
  },
}

// ─── CANVAS STATE ─────────────────────────────────────────────────────────────

export interface CanvasState {
  version: '1'
  blocks: CanvasBlock[]
  wires: WireEdge[]
  viewport: { x: number; y: number; zoom: number }
  compose: { style: string; layout: string }
}

// ─── BLOCK TYPE METADATA ──────────────────────────────────────────────────────
// Human-readable info for the block palette.

export interface BlockTypeMeta {
  type: CanvasBlockType
  label: string
  description: string
  formula: string
  defaultSize: { w: number; h: number }
}

export const BLOCK_TYPE_META: BlockTypeMeta[] = [
  {
    type: 'text',
    label: 'Text',
    description: 'Markdown text block for headlines and narrative',
    formula: '—',
    defaultSize: { w: 300, h: 120 },
  },
  {
    type: 'locked',
    label: 'Locked Inputs',
    description: 'Fixed inputs: acquisitions, pricing, fees, migration cost',
    formula: 'constants → output ports',
    defaultSize: { w: 260, h: 200 },
  },
  {
    type: 'assumption',
    label: 'Assumptions',
    description: 'Revenue assumption sliders: trial-start, trial-paid, renewal',
    formula: 'slider → rate %',
    defaultSize: { w: 260, h: 180 },
  },
  {
    type: 'driver',
    label: 'Driver',
    description: 'Revenue or cost driver with growth over time',
    formula: 'base × (1 + growth)^t',
    defaultSize: { w: 260, h: 160 },
  },
  {
    type: 'scenario',
    label: 'Scenario',
    description: 'Conservative / Mid / Optimistic scenario set',
    formula: 'baseline + Δ → payback, M24 net',
    defaultSize: { w: 320, h: 220 },
  },
  {
    type: 'cashflow',
    label: 'Cash Flow',
    description: '24-month P&L curve from cost and lift inputs',
    formula: 'cumLift(t) − cumCost(t)',
    defaultSize: { w: 360, h: 200 },
  },
  {
    type: 'metric',
    label: 'Metric',
    description: 'Single-number hero from a named output',
    formula: 'reference → display',
    defaultSize: { w: 180, h: 100 },
  },
  {
    type: 'comparison',
    label: 'Comparison',
    description: 'Side-by-side scenario comparison table',
    formula: 'scenarios → table',
    defaultSize: { w: 360, h: 180 },
  },
  {
    type: 'sensitivity',
    label: 'Sensitivity',
    description: 'Sweep one input across ±% range, show output impact',
    formula: 'sweep ±% → impact strip',
    defaultSize: { w: 300, h: 160 },
  },
]

// ─── DEFAULT BLOCK FACTORIES ──────────────────────────────────────────────────

function baseBlock(type: CanvasBlockType, x: number, y: number, label: string, defaultSize: { w: number; h: number }): CanvasBlockBase {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    x, y,
    w: defaultSize.w,
    h: defaultSize.h,
    zIndex: 1,
    exportIncluded: type !== 'text',
    label,
  }
}

export function createBlock(type: CanvasBlockType, x: number, y: number): CanvasBlock {
  const meta = BLOCK_TYPE_META.find(m => m.type === type)!
  const base = baseBlock(type, x, y, meta.label, meta.defaultSize)

  switch (type) {
    case 'text':
      return { ...base, type: 'text', markdown: '' }
    case 'metric':
      return { ...base, type: 'metric', title: 'Metric', unit: '', staticValue: null }
    case 'locked':
      return {
        ...base, type: 'locked',
        acquisitions: 2_000_000, renewalPrice: 79,
        rcFeeY1: 163_000, rcFeeY2: 232_000, migrationCost: 11_000,
      }
    case 'assumption':
      return {
        ...base, type: 'assumption',
        baselineTrialStart: 9.5, baselineTrialPaid: 60, baselineRenewal: 47,
        trialStart: 9.5, trialPaid: 60, renewal: 47,
      }
    case 'driver':
      return {
        ...base, type: 'driver',
        name: 'Driver', category: 'variable_cost',
        baseValue: 100_000, growthRate: 0, timeHorizon: 24,
      }
    case 'scenario':
      return {
        ...base, type: 'scenario',
        scenarios: [
          { id: 'cons', name: 'Conservative', cssModifier: 'sc-cons', trialStartDelta: 0.5, trialPaidDelta: 1,  renewalDelta: 2 },
          { id: 'mid',  name: 'Mid',          cssModifier: 'sc-mid',  trialStartDelta: 1,   trialPaidDelta: 3,  renewalDelta: 4 },
          { id: 'opt',  name: 'Optimistic',   cssModifier: 'sc-opt',  trialStartDelta: 2,   trialPaidDelta: 5,  renewalDelta: 6 },
        ],
      }
    case 'cashflow':
      return { ...base, type: 'cashflow', projectionMonths: 24 }
    case 'sensitivity':
      return { ...base, type: 'sensitivity', sweepPort: '', outputPort: '', sweepRange: 20 }
    case 'comparison':
      return { ...base, type: 'comparison', metrics: ['paybackMonth', 'm24Net'] }
  }
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

export function emptyCanvasState(): CanvasState {
  return {
    version: '1',
    blocks: [],
    wires: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    compose: { style: 'terminal', layout: 'mag' },
  }
}
