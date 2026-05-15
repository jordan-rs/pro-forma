<script lang="ts">
  import { project } from '../store'
  import BetCards      from './BetCards.svelte'
  import CostFloor     from './CostFloor.svelte'
  import WorkshopFunnel from './WorkshopFunnel.svelte'
  import PnlChart      from './PnlChart.svelte'
</script>

<!-- Project header -->
<div class="wr-header">
  <div class="wr-title">{$project.meta.title}</div>
  <div class="wr-meta">
    {$project.meta.product} · {$project.meta.team} · {$project.meta.date}
  </div>
  <div class="wr-context">{$project.meta.context}</div>
</div>

<!-- Scenario bet cards — sticky as you scroll -->
<BetCards />

<!-- Cost floor -->
<CostFloor />

<!-- Conversion funnel -->
<WorkshopFunnel />

<!-- Net P&L range chart -->
<PnlChart />

<style>
.wr-header {
  padding-bottom: 4px;
}
.wr-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--workshop-fg);
  font-family: var(--workshop-sans);
  line-height: 1.2;
}
.wr-meta {
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--workshop-fg-3);
  font-family: var(--workshop-sans);
  margin-top: 5px;
}
.wr-context {
  font-size: 12px;
  color: var(--workshop-fg-3);
  font-family: var(--workshop-sans);
  margin-top: 3px;
}
</style>
