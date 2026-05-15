<script lang="ts">
  import { computed } from '../store'

  function fmtMoneyS(n: number): string {
    const sign = n >= 0 ? '+' : '−'
    const abs = Math.abs(n)
    if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`
    if (abs >= 1_000)     return `${sign}$${(abs / 1_000).toFixed(0)}K`
    return `${sign}$${abs.toFixed(0)}`
  }
</script>

<div class="cf-card">
  <div class="cf-col">
    <div class="cf-col-label">The Cost — regardless of outcome</div>
    <div class="cf-line">
      This adds <b>{fmtMoneyS($computed.costAdded24mo)}</b> to the budget over 2 years
    </div>
    <div class="cf-line small">
      Year 1: <span>{fmtMoneyS($computed.costAddedY1)}</span>
      · Year 2: <span>{fmtMoneyS($computed.costAddedY2)}</span>
    </div>
  </div>
  <div class="cf-col">
    <div class="cf-col-label">Engineering Time — what changes</div>
    <div class="cf-eng-flow">
      <span class="cf-hrs today">{$computed.laborByType.reduce((s,l) => s+l.todayHrs, 0)}</span>
      <span class="cf-hrs-label">hrs/mo now</span>
      <span class="cf-arrow">→</span>
      <span class="cf-hrs steady">{$computed.laborByType.reduce((s,l) => s+l.p3Hrs, 0)}</span>
      <span class="cf-hrs-label" style="color:var(--workshop-positive)">hrs/mo steady state</span>
    </div>
    <div class="cf-line small">
      {$computed.hoursFreedPerMonth} hrs/mo freed
      — roughly {($computed.hoursFreedPerMonth / 8).toFixed(1)} engineer-days/month
    </div>
  </div>
</div>

<style>
.cf-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px 28px;
  background: var(--workshop-bg-2);
  border: 1px solid var(--workshop-rule);
  border-left: 3px solid var(--workshop-accent);
  border-radius: 4px;
  padding: 16px 18px;
}
.cf-col-label {
  font-size: 9px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--workshop-fg-3);
  font-family: var(--workshop-sans);
  font-weight: 600;
  margin-bottom: 8px;
}
.cf-line {
  font-size: 13px;
  color: var(--workshop-fg-2);
  font-family: var(--workshop-sans);
  line-height: 1.6;
}
.cf-line b, .cf-line span {
  font-family: var(--workshop-mono);
  color: var(--workshop-fg);
  font-weight: 500;
}
.cf-line + .cf-line { margin-top: 3px; }
.cf-line.small { font-size: 11px; color: var(--workshop-fg-3); }
.cf-line.small span { color: var(--workshop-fg-2); font-weight: 500; }

.cf-eng-flow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 6px 0 8px;
  flex-wrap: wrap;
}
.cf-hrs {
  font-size: 18px;
  font-weight: 500;
  font-family: var(--workshop-mono);
  color: var(--workshop-fg);
}
.cf-hrs.today { color: var(--workshop-fg-3); }
.cf-hrs.steady { color: var(--workshop-positive); }
.cf-hrs-label { font-size: 11px; color: var(--workshop-fg-3); font-family: var(--workshop-sans); }
.cf-arrow { font-size: 16px; color: var(--workshop-fg-4); }
</style>
