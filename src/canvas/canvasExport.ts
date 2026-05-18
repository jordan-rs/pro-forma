import type { CanvasState, LockedInputBlockData, AssumptionBlockData, ScenarioBlockData } from './canvasSchema'
import type { ProFormaProject, ScenarioResult } from '../schema'
import { defaultProject } from '../template'
import { computeAll } from './canvasCompute'

// ─── CANVAS → PROJECT BRIDGE ──────────────────────────────────────────────────
// Converts a CanvasState into a ProFormaProject so the existing
// generateOnePager.ts can render it without modification.
//
// Strategy: start from the RC migration default project (which has all the
// content fields filled in), then overwrite the fields we can derive from
// the canvas blocks. Fields not represented in the canvas keep their
// defaults so the export always renders something coherent.

export function canvasStateToProject(state: CanvasState): ProFormaProject {
  // Run compute to get all block outputs
  const { cache } = computeAll(state)

  // Start from the default template as baseline content
  const project: ProFormaProject = JSON.parse(JSON.stringify(defaultProject))

  // Override compose from canvas state
  project.compose.style  = state.compose.style
  project.compose.layout = state.compose.layout

  // ── Find typed blocks ────────────────────────────────────────────────────────
  const lockedBlock     = state.blocks.find(b => b.type === 'locked')     as LockedInputBlockData | undefined
  const assumptionBlock = state.blocks.find(b => b.type === 'assumption') as AssumptionBlockData  | undefined
  const scenarioBlock   = state.blocks.find(b => b.type === 'scenario')   as ScenarioBlockData    | undefined
  const textBlock       = state.blocks.find(b => b.type === 'text' && b.exportIncluded)

  // ── Apply locked inputs ───────────────────────────────────────────────────────
  if (lockedBlock) {
    project.locked = [
      { id: 'acquisitions', label: 'Acquisitions / yr',      value: lockedBlock.acquisitions,  unit: '' },
      { id: 'renewalPrice', label: 'Renewal price',          value: lockedBlock.renewalPrice,  unit: '$' },
      { id: 'rcDiscountY1', label: 'RC fee · Y1 discounted', value: lockedBlock.rcFeeY1,       unit: '$' },
      { id: 'rcAnnualFee',  label: 'RC fee · Y2+ standard',  value: lockedBlock.rcFeeY2,       unit: '$' },
      { id: 'migrationY1',  label: 'Migration build · Y1',   value: lockedBlock.migrationCost, unit: '$' },
    ]
  }

  // ── Apply assumptions ─────────────────────────────────────────────────────────
  if (assumptionBlock) {
    project.baseline = {
      trialStart: assumptionBlock.baselineTrialStart,
      trialPaid:  assumptionBlock.baselineTrialPaid,
      renewal:    assumptionBlock.baselineRenewal,
    }
    project.assumptions = {
      trialStart: assumptionBlock.trialStart,
      trialPaid:  assumptionBlock.trialPaid,
      renewal:    assumptionBlock.renewal,
    }
  }

  // ── Apply scenario definitions ────────────────────────────────────────────────
  if (scenarioBlock) {
    project.scenarios = scenarioBlock.scenarios.map(sc => ({
      id:              sc.id,
      name:            sc.name,
      cssModifier:     sc.cssModifier,
      trialStartDelta: sc.trialStartDelta,
      trialPaidDelta:  sc.trialPaidDelta,
      renewalDelta:    sc.renewalDelta,
    }))
  }

  // ── Apply text block as headline ──────────────────────────────────────────────
  if (textBlock && textBlock.type === 'text' && textBlock.markdown.trim()) {
    const lines = textBlock.markdown.replace(/^#+\s*/gm, '').split('\n').filter(Boolean)
    if (lines[0]) project.content.headline = lines[0]
    if (lines[1]) project.content.deck     = lines.slice(1).join(' ')
  }

  // ── Summary cards from computed scenario outputs ──────────────────────────────
  if (scenarioBlock) {
    const scOut = cache.get(scenarioBlock.id)
    if (scOut) {
      const results = scOut['scenarios'] as unknown as ScenarioResult[] | undefined
      if (results && results.length >= 2) {
        const cons = results[0]
        const opt  = results[results.length - 1]
        const fmtNet = (n: number) => {
          const sign = n >= 0 ? '+' : '−'
          const abs = Math.abs(n)
          return abs >= 1_000_000 ? `${sign}$${(abs / 1_000_000).toFixed(2)}M`
               : abs >= 1_000     ? `${sign}$${(abs / 1_000).toFixed(0)}K`
               : `${sign}$${abs.toFixed(0)}`
        }
        project.content.summary.cards[2] = {
          label:    'Revenue upside',
          subtitle: `${fmtNet(cons.m24Net)} – ${fmtNet(opt.m24Net)} range across ${results.length} positions · M24 net P&L`,
          focal:    true,
        }
      }
    }
  }

  // ── Select which blocks appear in the export ──────────────────────────────────
  // Only blocks with exportIncluded: true and a type that maps to the existing
  // one-pager block registry are rendered.
  const CANVAS_TO_ONEPAGER: Partial<Record<string, string>> = {
    text:        'headline',
    locked:      'summary',
    assumption:  'funnel',
    scenario:    'scenarios',
    cashflow:    'chart',
    comparison:  'scenarios',
    metric:      'summary',
  }

  const includedTypes = new Set(
    state.blocks
      .filter(b => b.exportIncluded)
      .map(b => CANVAS_TO_ONEPAGER[b.type])
      .filter(Boolean) as string[]
  )

  // Always include header and footer
  const exportBlocks = ['header', ...Array.from(includedTypes), 'footer']
  project.compose.blocks = exportBlocks

  return project
}
