// ─── LABOR ───────────────────────────────────────────────────────────────────
// Extensible: add entries to laborTypes to unlock new cost categories.
// LaborComponents reference a laborTypeId — compute iterates over all types.

export interface LaborType {
  id: string
  label: string           // "Engineering", "Marketing", etc.
  hourlyRate: number
  hoursPerMonth: number   // default 160
}

export interface LaborComponent {
  id: string
  name: string
  note: string | null
  laborTypeId: string     // → LaborType.id
  today: number           // hrs/mo currently
  p3: number              // hrs/mo at phase-3 steady state
  max: number             // slider ceiling in the workshop
}

// ─── SCENARIOS ───────────────────────────────────────────────────────────────
// Each scenario defines pp-point deltas above baseline for each lever.
// Compute derives payback and M24 net from these.

export interface ScenarioDefinition {
  id: string
  name: string
  cssModifier: string   // e.g. "sc-cons", "sc-mid", "sc-opt"
  trialStartDelta: number   // pp above baseline
  trialPaidDelta: number
  renewalDelta: number
}

// ─── CONTENT (PROSE + LABELS) ────────────────────────────────────────────────

export interface SummaryCardContent {
  label: string
  subtitle: string
  focal: boolean
}

export interface BuyItem {
  text: string
  tag: string
  type: 'plus' | 'x'
}

export interface ExecutionPhase {
  label: string   // "P1"
  window: string  // "M0 → M3"
  name: string    // "Test"
  body: string    // prose, may include inline HTML spans
}

export interface FunnelStepContent {
  how: string     // "trial-start · 7d"
  rcNote: string  // "RC: paywall · offering · A/B"
}

export interface ProjectContent {
  headline: string
  headlineAccent: string
  deck: string
  summary: {
    cards: [SummaryCardContent, SummaryCardContent, SummaryCardContent]
  }
  funnel: {
    title: string
    meta: string
    stepNotes: [FunnelStepContent, FunnelStepContent, FunnelStepContent]
    stageLabels: [string, string, string, string]
  }
  chart: {
    title: string
    conclusion: string
  }
  scenarios: {
    title: string
    meta: string
  }
  position: {
    lineItemLabel: string
    subText: string       // prose describing the cost breakdown
    buysLabel: string
    items: BuyItem[]
  }
  execution: {
    title: string
    meta: string
    phases: [ExecutionPhase, ExecutionPhase, ExecutionPhase]
  }
  ask: {
    recommendation: string   // "We recommend proceeding."
    ask: string              // what approval/action is sought
    whatYesUnlocks: string   // concrete outcomes of a yes decision
    costOfDelay: string      // what waiting costs
  }
  footer: string
}

// ─── LOCKED INPUTS ───────────────────────────────────────────────────────────

export interface LockedInput {
  id: string
  label: string
  value: number
  unit: string
}

// ─── FULL PROJECT ────────────────────────────────────────────────────────────

export interface ProFormaProject {
  meta: {
    title: string
    subtitle: string
    product: string
    team: string
    date: string
    context: string
  }

  locked: LockedInput[]

  baseline: {
    trialStart: number    // % — the "no lift" baseline
    trialPaid: number
    renewal: number
  }

  // Workshop slider state (separate from baseline)
  assumptions: {
    trialStart: number
    trialPaid: number
    renewal: number
  }

  scenarios: ScenarioDefinition[]

  laborTypes: LaborType[]
  laborComponents: LaborComponent[]

  content: ProjectContent

  compose: {
    blocks: string[]    // ordered block ids — subset of registry
    layout: string      // → layouts registry
    style: string       // → themes registry
  }
}

// ─── COMPUTED OUTPUTS ────────────────────────────────────────────────────────
// Derived entirely from ProFormaProject by compute/index.ts.
// Blocks receive these alongside content props — never stored.

export interface LaborTotals {
  laborTypeId: string
  label: string
  todayHrs: number
  p3Hrs: number
  todayFTE: number
  p3FTE: number
  todayAnnualCost: number
  p3AnnualCost: number
}

export interface ScenarioResult {
  id: string
  name: string
  cssModifier: string
  paybackMonth: number | null
  m24Net: number
  leverage: string      // formatted "+0.5pp / +1pp / +2pp"
  chartPoints: ChartPoint[]
}

export interface ChartPoint {
  month: number
  net: number
}

export interface ComputedOutputs {
  // Cost
  costAddedY1: number
  costAddedY2: number
  costAdded24mo: number

  // Labor (per type)
  laborByType: LaborTotals[]
  totalTodayFTE: number
  totalP3FTE: number
  capacityFreedFTE: number
  hoursFreedPerMonth: number

  // Revenue (workshop sliders)
  newTrials: number
  newPaid: number
  newRenewals: number
  baselineTrials: number
  baselinePaid: number
  baselineRenewals: number
  annualLift: number
  lift24: number
  netM24: number
  paybackMonth: number | null

  // Chart
  chartPoints: ChartPoint[]

  // Scenarios (from scenario definitions)
  scenarioResults: ScenarioResult[]

  // Per-slider isolated 24mo lift contribution vs baseline
  sliderImpacts: { trialStart: number; trialPaid: number; renewal: number }
}
