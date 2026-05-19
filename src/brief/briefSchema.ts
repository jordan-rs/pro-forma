// ─── BRIEF VARIABLE ───────────────────────────────────────────────────────────
// Each variable has a name used in formula references and a range of values
// for three evaluation scenarios (low / base / high).

export interface BriefVariable {
  id: string
  name: string      // formula identifier — no spaces, e.g. "users", "conv_rate"
  label: string     // human-readable, e.g. "Monthly Active Users"
  unit: string      // display suffix: "$", "users", "%", etc.
  base: number      // expected / most-likely value
  low: number       // conservative / pessimistic value
  high: number      // optimistic value
}

// ─── BRIEF STATE ──────────────────────────────────────────────────────────────

export interface BriefState {
  version: '1'

  meta: {
    title: string
    product: string
    context: string
    date: string
  }

  variables: BriefVariable[]

  // Revenue formula: arithmetic expression over variable names.
  // Evaluates to annual payoff (positive = benefit to the initiative).
  revenueFormula: string

  // Cost inputs — direct numbers for v1 (formula support is Phase 3).
  costY1: number    // total incremental cost, Year 1
  costY2: number    // total incremental cost, Year 2+ (defaults to costY1)

  content: {
    decision: string          // Act I  — the bet / decision question
    mechanism: string         // Act II — how it produces value (deck subtitle)
    recommendation: string    // Act IV — the recommendation statement
    ask: string               // what approval/action is being sought
    whatYesUnlocks: string    // concrete outcomes of a yes decision
    costOfDelay: string       // what waiting costs
    footer: string
  }

  compose: {
    style: string     // → themes registry
    layout: string    // → layouts registry (Brief defaults to 'narrative')
  }
}

// ─── DEFAULT STATE ────────────────────────────────────────────────────────────

export function defaultBriefState(): BriefState {
  return {
    version: '1',
    meta: {
      title: 'Decision Brief',
      product: '',
      context: '',
      date: new Date().toISOString().slice(0, 10),
    },
    variables: [],
    revenueFormula: '',
    costY1: 0,
    costY2: 0,
    content: {
      decision: '',
      mechanism: '',
      recommendation: '',
      ask: '',
      whatYesUnlocks: '',
      costOfDelay: '',
      footer: '',
    },
    compose: {
      style: 'clean',
      layout: 'narrative',
    },
  }
}
