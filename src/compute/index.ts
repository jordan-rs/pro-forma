import type { ProFormaProject, ComputedOutputs, LaborTotals, ScenarioResult, ChartPoint } from '../schema'

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function fmtMoney(n: number): string {
  const a = Math.abs(n)
  if (a >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (a >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return n.toFixed(0)
}

export function fmtMoneyS(n: number): string {
  const sign = n >= 0 ? '+' : '−'
  return `${sign}$${fmtMoney(Math.abs(n))}`
}

export function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return n.toFixed(0)
}

export function fmtPP(delta: number): string {
  if (Math.abs(delta) < 0.05) return '±0pp'
  const sign = delta > 0 ? '+' : '−'
  return `${sign}${Math.abs(delta).toFixed(1)}pp`
}

// ─── COST MODEL ──────────────────────────────────────────────────────────────
// Costs are modeled in two phases:
//   Y1: labor stays at today's level (transition year) + RC discounted fee + migration
//   Y2: labor bends 50% toward Phase-3 steady state + RC at full annual fee
// Adding new labor types: compute iterates over project.laborTypes —
// no code changes needed when a new type is added to the schema.

function computeLaborTotals(project: ProFormaProject): LaborTotals[] {
  return project.laborTypes.map(lt => {
    const components = project.laborComponents.filter(c => c.laborTypeId === lt.id)
    const todayHrs = components.reduce((s, c) => s + c.today, 0)
    const p3Hrs    = components.reduce((s, c) => s + c.p3, 0)
    return {
      laborTypeId:     lt.id,
      label:           lt.label,
      todayHrs,
      p3Hrs,
      todayFTE:        todayHrs / lt.hoursPerMonth,
      p3FTE:           p3Hrs / lt.hoursPerMonth,
      todayAnnualCost: todayHrs * 12 * lt.hourlyRate,
      p3AnnualCost:    p3Hrs   * 12 * lt.hourlyRate,
    }
  })
}

// ─── REVENUE MODEL ───────────────────────────────────────────────────────────
// Revenue lift ramps:
//   M0–M3:  no lift (integration in progress)
//   M3–M9:  quadratic ramp from 0 → full rate
//   M9+:    full annual lift rate
// This is shared between the workshop (live sliders) and scenario computation.

function annualLiftFromRates(
  project: ProFormaProject,
  trialStart: number,
  trialPaid: number,
  renewal: number,
): number {
  const acq = project.locked.find(l => l.id === 'acquisitions')?.value ?? 0
  const price = project.locked.find(l => l.id === 'renewalPrice')?.value ?? 0
  const b = project.baseline

  const baselineTrials   = acq * b.trialStart / 100
  const baselinePaid     = baselineTrials * b.trialPaid / 100
  const baselineRenewals = baselinePaid   * b.renewal   / 100

  const newTrials   = acq * trialStart / 100
  const newPaid     = newTrials * trialPaid / 100
  const newRenewals = newPaid   * renewal   / 100

  const purchaseLift = (newPaid     - baselinePaid)     * price
  const renewalLift  = (newRenewals - baselineRenewals) * price
  return purchaseLift + renewalLift
}

function cumulativeLiftAt(t: number, annualLift: number): number {
  if (t < 3) return 0
  const monthlyFull = annualLift / 12
  if (t < 9) {
    return monthlyFull * Math.pow(t - 3, 2) / 12
  }
  const rampCum = monthlyFull * 36 / 12
  return rampCum + monthlyFull * (t - 9)
}

function cumulativeCostAt(t: number, costAddedY1: number, costAddedY2: number): number {
  if (t <= 12) return costAddedY1 * (t / 12)
  return costAddedY1 + costAddedY2 * ((t - 12) / 12)
}

function findPayback(costAddedY1: number, costAddedY2: number, annualLift: number): number | null {
  for (let t = 3; t <= 24; t += 0.1) {
    if (cumulativeLiftAt(t, annualLift) >= cumulativeCostAt(t, costAddedY1, costAddedY2)) {
      return Math.round(t * 10) / 10
    }
  }
  return null
}

// ─── SCENARIO RESULTS ────────────────────────────────────────────────────────

function computeScenarioResults(
  project: ProFormaProject,
  costAddedY1: number,
  costAddedY2: number,
): ScenarioResult[] {
  return project.scenarios.map(sc => {
    const ts = project.baseline.trialStart + sc.trialStartDelta
    const tp = project.baseline.trialPaid  + sc.trialPaidDelta
    const rn = project.baseline.renewal    + sc.renewalDelta
    const lift = annualLiftFromRates(project, ts, tp, rn)
    const lift24 = cumulativeLiftAt(24, lift)
    const cost24 = cumulativeCostAt(24, costAddedY1, costAddedY2)
    const m24Net = lift24 - cost24
    const paybackMonth = findPayback(costAddedY1, costAddedY2, lift)
    const leverage = [sc.trialStartDelta, sc.trialPaidDelta, sc.renewalDelta]
      .map(d => (d >= 0 ? `+${d}pp` : `${d}pp`))
      .join(' / ')
    return { id: sc.id, name: sc.name, cssModifier: sc.cssModifier, paybackMonth, m24Net, leverage }
  })
}

// ─── MAIN COMPUTE ────────────────────────────────────────────────────────────

export function compute(project: ProFormaProject): ComputedOutputs {
  // Labor
  const laborByType = computeLaborTotals(project)
  const totalTodayAnnual = laborByType.reduce((s, l) => s + l.todayAnnualCost, 0)
  const totalP3Annual    = laborByType.reduce((s, l) => s + l.p3AnnualCost, 0)
  const totalTodayFTE    = laborByType.reduce((s, l) => s + l.todayFTE, 0)
  const totalP3FTE       = laborByType.reduce((s, l) => s + l.p3FTE, 0)
  const totalTodayHrs    = laborByType.reduce((s, l) => s + l.todayHrs, 0)
  const totalP3Hrs       = laborByType.reduce((s, l) => s + l.p3Hrs, 0)

  const rcY1  = project.locked.find(l => l.id === 'rcDiscountY1')?.value  ?? 0
  const rcY2  = project.locked.find(l => l.id === 'rcAnnualFee')?.value   ?? 0
  const migY1 = project.locked.find(l => l.id === 'migrationY1')?.value   ?? 0

  // Y1: labor unchanged + discounted RC + migration
  const laborBendY1 = 0.0
  const laborBendY2 = 0.5
  const laborY1 = totalTodayAnnual - (totalTodayAnnual - totalP3Annual) * laborBendY1
  const laborY2 = totalTodayAnnual - (totalTodayAnnual - totalP3Annual) * laborBendY2

  const costAddedY1    = (laborY1 + rcY1 + migY1) - totalTodayAnnual
  const costAddedY2    = (laborY2 + rcY2)          - totalTodayAnnual
  const costAdded24mo  = costAddedY1 + costAddedY2

  // Revenue (workshop slider rates)
  const { trialStart, trialPaid, renewal } = project.assumptions
  const acq   = project.locked.find(l => l.id === 'acquisitions')?.value  ?? 0
  const price = project.locked.find(l => l.id === 'renewalPrice')?.value  ?? 0
  const b     = project.baseline

  const baselineTrials   = acq * b.trialStart / 100
  const baselinePaid     = baselineTrials * b.trialPaid / 100
  const baselineRenewals = baselinePaid   * b.renewal   / 100

  const newTrials   = acq * trialStart / 100
  const newPaid     = newTrials * trialPaid / 100
  const newRenewals = newPaid   * renewal   / 100

  const purchaseLift = (newPaid     - baselinePaid)     * price
  const renewalLift  = (newRenewals - baselineRenewals) * price
  const annualLift   = purchaseLift + renewalLift

  const lift24  = cumulativeLiftAt(24, annualLift)
  const cost24  = cumulativeCostAt(24, costAddedY1, costAddedY2)
  const netM24  = lift24 - cost24
  const paybackMonth = findPayback(costAddedY1, costAddedY2, annualLift)

  // Chart points (49 steps: M0 → M24 at 0.5mo intervals)
  const chartPoints: ChartPoint[] = []
  for (let t = 0; t <= 24; t += 0.5) {
    chartPoints.push({ month: t, net: cumulativeLiftAt(t, annualLift) - cumulativeCostAt(t, costAddedY1, costAddedY2) })
  }

  // Scenarios
  const scenarioResults = computeScenarioResults(project, costAddedY1, costAddedY2)

  return {
    costAddedY1, costAddedY2, costAdded24mo,
    laborByType,
    totalTodayFTE, totalP3FTE,
    capacityFreedFTE: totalTodayFTE - totalP3FTE,
    hoursFreedPerMonth: totalTodayHrs - totalP3Hrs,
    newTrials, newPaid, newRenewals,
    baselineTrials, baselinePaid, baselineRenewals,
    annualLift, lift24, netM24, paybackMonth,
    chartPoints,
    scenarioResults,
  }
}
