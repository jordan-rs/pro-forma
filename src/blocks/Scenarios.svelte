<script lang="ts">
  import type { ScenarioResult } from '../schema'
  import { fmtMoneyS } from '../compute'

  interface Props {
    title: string
    meta: string
    scenarioResults: ScenarioResult[]
  }
  let { title, meta, scenarioResults }: Props = $props()
</script>

<div class="c-scenarios">
  <div class="head">
    <div class="t">{@html title}</div>
    <div class="meta">{meta}</div>
  </div>
  <div class="grid-3">
    {#each scenarioResults as sc}
      <div class="sc {sc.cssModifier}">
        <div class="name">{sc.name}</div>
        <div class="pb-l">payback</div>
        <div class="pb">{sc.paybackMonth ? `M${sc.paybackMonth.toFixed(1)}` : '> M24'}</div>
        <div class="m24-l">M24 net</div>
        <div class="m24">{fmtMoneyS(sc.m24Net)}</div>
        <div class="lev">{sc.leverage}</div>
      </div>
    {/each}
  </div>
</div>
