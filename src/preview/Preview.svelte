<script lang="ts">
  import { project, computed } from '../store'
  import { BLOCKS } from '../blocks/registry'
  import { THEMES } from '../themes/registry'
  import { LAYOUTS } from '../layouts/registry'
  import { fmtMoneyS, fmtCount } from '../compute'

  import '../themes/index.css'
  import '../layouts/layouts.css'
  import '../blocks/blocks.css'

  // Resolve the active theme/layout CSS classes from the registry
  const themeClass  = $derived(THEMES.find(t => t.id === $project.compose.style)?.cssClass   ?? 'style-clean')
  const layoutClass = $derived(LAYOUTS.find(l => l.id === $project.compose.layout)?.cssClass ?? 'layout-mag')

  // Only render blocks that are in compose.blocks
  const activeBlocks = $derived(
    BLOCKS.filter(b => $project.compose.blocks.includes(b.id))
  )

  // ── Assemble props for each block ──────────────────────────────────────────
  // Keeps blocks dumb: they only receive display-ready props.

  function headerProps() {
    return {
      product: $project.meta.product,
      context: $project.meta.context,
      date:    $project.meta.date,
      title:   $project.meta.title,
    }
  }

  function headlineProps() {
    return {
      headline:       $project.content.headline,
      headlineAccent: $project.content.headlineAccent,
      deck:           $project.content.deck,
    }
  }

  function summaryCardsProps() {
    const c = $computed
    const cons = c.scenarioResults.find(s => s.cssModifier === 'sc-cons')
    const opt  = c.scenarioResults.find(s => s.cssModifier === 'sc-opt')
    const rangeStr = (cons && opt)
      ? `${fmtMoneyS(cons.m24Net)} – ${fmtMoneyS(opt.m24Net)}`
      : fmtMoneyS(c.netM24)

    return {
      cards: $project.content.summary.cards.map((card, i) => ({
        ...card,
        value: [
          fmtMoneyS(c.costAdded24mo),
          `~${c.capacityFreedFTE.toFixed(1)} FTE`,
          rangeStr,
        ][i],
      })),
    }
  }

  function funnelProps() {
    const c = $computed
    const b = $project.baseline
    const f = $project.content.funnel
    const acq = $project.locked.find(l => l.id === 'acquisitions')?.value ?? 0
    const ts  = $project.assumptions.trialStart
    const tp  = $project.assumptions.trialPaid
    const rn  = $project.assumptions.renewal

    return {
      title: f.title,
      meta:  f.meta,
      stages: [
        { count: fmtCount(acq),             label: f.stageLabels[0] },
        { count: fmtCount(c.newTrials),     label: f.stageLabels[1] },
        { count: fmtCount(c.newPaid),       label: f.stageLabels[2] },
        { count: fmtCount(c.newRenewals),   label: f.stageLabels[3] },
      ],
      steps: f.stepNotes,
      rates: [`${ts.toFixed(1)}%`, `${tp.toFixed(1)}%`, `${rn.toFixed(1)}%`],
    }
  }

  function chartProps() {
    return {
      title:           $project.content.chart.title,
      conclusion:      $project.content.chart.conclusion,
      chartPoints:     $computed.chartPoints,
      scenarioResults: $computed.scenarioResults,
    }
  }

  function scenariosProps() {
    return {
      title:           $project.content.scenarios.title,
      meta:            $project.content.scenarios.meta,
      scenarioResults: $computed.scenarioResults,
    }
  }

  function positionProps() {
    return {
      lineItemLabel: $project.content.position.lineItemLabel,
      bigNumber:     fmtMoneyS($computed.costAdded24mo),
      subText:       $project.content.position.subText,
      buysLabel:     $project.content.position.buysLabel,
      items:         $project.content.position.items,
    }
  }

  function executionProps() {
    return {
      title:  $project.content.execution.title,
      meta:   $project.content.execution.meta,
      phases: $project.content.execution.phases,
    }
  }

  function askProps() {
    const a = $project.content.ask
    return {
      recommendation: a.recommendation,
      ask:            a.ask,
      whatYesUnlocks: a.whatYesUnlocks,
      costOfDelay:    a.costOfDelay,
    }
  }

  function footerProps() {
    return { notes: $project.content.footer }
  }

  const BLOCK_PROPS: Record<string, () => Record<string, unknown>> = {
    header:    headerProps,
    headline:  headlineProps,
    summary:   summaryCardsProps,
    funnel:    funnelProps,
    chart:     chartProps,
    scenarios: scenariosProps,
    position:  positionProps,
    execution: executionProps,
    ask:       askProps,
    footer:    footerProps,
  }
</script>

<div class="pf-sheet {themeClass} {layoutClass}">
  <div class="pf-sheet-main">
    {#each activeBlocks as block (block.id)}
      {#if BLOCK_PROPS[block.id]}
        {@const BlockComponent = block.component}
        {@const props = BLOCK_PROPS[block.id]()}
        <BlockComponent {...props}/>
      {/if}
    {/each}
  </div>
</div>
