<script lang="ts">
  import { briefStore } from './briefStore'
  import { briefComputed } from './briefDerived'
  import Chart     from '../blocks/Chart.svelte'
  import Scenarios from '../blocks/Scenarios.svelte'
  import Ask       from '../blocks/Ask.svelte'
  import Header    from '../blocks/Header.svelte'
  import { THEMES }  from '../themes/registry'
  import { LAYOUTS } from '../layouts/registry'
  import '../themes/index.css'
  import '../layouts/layouts.css'
  import '../blocks/blocks.css'
  import './brief.css'

  const themeClass  = $derived(THEMES.find(t  => t.id === $briefStore.compose.style)?.cssClass  ?? 'style-clean')
  const layoutClass = $derived(LAYOUTS.find(l => l.id === $briefStore.compose.layout)?.cssClass ?? 'layout-narrative')

  const midScenario = $derived($briefComputed.scenarios.find(s => s.cssModifier === 'sc-mid'))
  const paybackLabel = $derived(
    midScenario?.paybackMonth ? `Base case payback: M${midScenario.paybackMonth.toFixed(1)}` : 'Base case: no payback within 24 months'
  )
</script>

<div class="pf-sheet {themeClass} {layoutClass}">
  <div class="pf-sheet-main">

    <!-- Metadata header -->
    <Header
      product={$briefStore.meta.product || 'Product'}
      context={$briefStore.meta.context || 'Decision Brief'}
      date={$briefStore.meta.date}
      title={$briefStore.meta.title || 'Decision Brief'}
    />

    <!-- Act I: The Bet — c-headline gets the "THE BET" label via CSS ::before -->
    <div class="c-headline">
      <h1>{$briefStore.content.decision || 'Define the decision question above.'}</h1>
      {#if $briefStore.content.mechanism}
        <p class="deck">{$briefStore.content.mechanism}</p>
      {/if}
    </div>

    <!-- Act II: Why It Works — c-funnel gets the "WHY IT WORKS" label via CSS ::before -->
    <div class="c-funnel">
      {#if $briefStore.variables.length > 0}
        <div class="bf-variables">
          {#each $briefStore.variables as v (v.id)}
            <div class="bf-var-display">
              <span class="bf-var-display-name">{v.name}</span>
              <span class="bf-var-display-label">{v.label || v.name}</span>
              <span class="bf-var-display-range">
                <span class="bf-sc-low">{v.low}</span>
                <span class="bf-sc-sep">·</span>
                <span class="bf-sc-base">{v.base}</span>
                <span class="bf-sc-sep">·</span>
                <span class="bf-sc-high">{v.high}</span>
                {#if v.unit}<span class="bf-var-unit">{v.unit}</span>{/if}
              </span>
            </div>
          {/each}

          {#if $briefStore.revenueFormula}
            <div class="bf-formula-display">
              <span class="bf-formula-display-label">payoff formula</span>
              <code>{$briefStore.revenueFormula}</code>
              {#if $briefComputed.formulaError}
                <span class="bf-formula-error">{$briefComputed.formulaError}</span>
              {/if}
            </div>
          {/if}
        </div>
      {:else}
        <p class="bf-preview-empty">Add variables and a formula to build the mechanism.</p>
      {/if}
    </div>

    <!-- Act III: When We Know — chart + scenarios -->
    <Chart
      title="24-month financial outlook"
      conclusion={paybackLabel}
      chartPoints={midScenario?.chartPoints ?? []}
      scenarioResults={$briefComputed.scenarios}
    />

    <Scenarios
      title="Scenario outcomes"
      meta="Conservative · Base · Optimistic"
      scenarioResults={$briefComputed.scenarios}
    />

    <!-- Act IV: The Decision -->
    {#if $briefStore.content.recommendation}
      <Ask
        recommendation={$briefStore.content.recommendation}
        ask={$briefStore.content.ask}
        whatYesUnlocks={$briefStore.content.whatYesUnlocks}
        costOfDelay={$briefStore.content.costOfDelay}
      />
    {:else}
      <div class="c-ask">
        <div class="ca-rec bf-preview-empty">Enter a recommendation to complete Act IV.</div>
      </div>
    {/if}

    {#if $briefStore.content.footer}
      <div class="c-footer">
        <span class="tag">notes</span>{$briefStore.content.footer}
      </div>
    {/if}

  </div>
</div>
