<script lang="ts">
  import { project, computed } from '../store'

  function fmtCount(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
    if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
    return n.toFixed(0)
  }

  function fmtDelta(delta: number): { text: string; cls: string } {
    if (Math.abs(delta) < 100) return { text: '±0', cls: 'zero' }
    const sign = delta > 0 ? '+' : '−'
    return { text: `${sign}${fmtCount(Math.abs(delta))}`, cls: delta > 0 ? 'pos' : 'neg' }
  }

  const trialsDelta   = $derived(fmtDelta($computed.newTrials   - $computed.baselineTrials))
  const paidDelta     = $derived(fmtDelta($computed.newPaid     - $computed.baselinePaid))
  const renewalsDelta = $derived(fmtDelta($computed.newRenewals - $computed.baselineRenewals))
</script>

<div class="wf-card">
  <div class="wf-label">Conversion Funnel — annual</div>
  <div class="wf-funnel">
    <!-- Stage: Acquired -->
    <div class="wf-stage">
      <div class="wf-count">{fmtCount($project.locked.find(l => l.id === 'acquisitions')?.value ?? 0)}</div>
      <div class="wf-delta zero">locked</div>
      <div class="wf-stage-label">Acquired / yr</div>
    </div>

    <!-- Arrow 1: trial-start rate -->
    <div class="wf-arrow">
      <div class="wf-rate">{$project.assumptions.trialStart.toFixed(1)}%</div>
      <div class="wf-rate-bl">bl {$project.baseline.trialStart}%</div>
      <div class="wf-glyph">→</div>
    </div>

    <!-- Stage: Trial starts -->
    <div class="wf-stage">
      <div class="wf-count">{fmtCount($computed.newTrials)}</div>
      <div class="wf-delta {trialsDelta.cls}">{trialsDelta.text}</div>
      <div class="wf-stage-label">Trial starts / yr</div>
    </div>

    <!-- Arrow 2: trial-paid rate -->
    <div class="wf-arrow">
      <div class="wf-rate">{$project.assumptions.trialPaid.toFixed(1)}%</div>
      <div class="wf-rate-bl">bl {$project.baseline.trialPaid}%</div>
      <div class="wf-glyph">→</div>
    </div>

    <!-- Stage: Paid conversions -->
    <div class="wf-stage">
      <div class="wf-count">{fmtCount($computed.newPaid)}</div>
      <div class="wf-delta {paidDelta.cls}">{paidDelta.text}</div>
      <div class="wf-stage-label">Paid conv / yr</div>
    </div>

    <!-- Arrow 3: renewal rate -->
    <div class="wf-arrow">
      <div class="wf-rate">{$project.assumptions.renewal.toFixed(1)}%</div>
      <div class="wf-rate-bl">bl {$project.baseline.renewal}%</div>
      <div class="wf-glyph">→</div>
    </div>

    <!-- Stage: Renewals -->
    <div class="wf-stage">
      <div class="wf-count">{fmtCount($computed.newRenewals)}</div>
      <div class="wf-delta {renewalsDelta.cls}">{renewalsDelta.text}</div>
      <div class="wf-stage-label">Renewals / yr</div>
    </div>
  </div>
</div>

<style>
.wf-card {
  background: var(--workshop-bg-2);
  border: 1px solid var(--workshop-rule);
  border-radius: 4px;
  padding: 16px 18px;
}
.wf-label {
  font-size: 9px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--workshop-fg-3);
  font-family: var(--workshop-sans);
  font-weight: 600;
  margin-bottom: 14px;
}
.wf-funnel {
  display: flex;
  align-items: stretch;
  gap: 0;
}
.wf-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 6px;
  background: var(--workshop-bg);
  border: 1px solid var(--workshop-rule-2);
  border-radius: 4px;
  text-align: center;
}
.wf-count {
  font-size: 20px;
  font-weight: 700;
  color: var(--workshop-fg);
  font-family: var(--workshop-mono);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.wf-delta {
  font-size: 11px;
  font-weight: 600;
  font-family: var(--workshop-mono);
  margin-top: 3px;
  font-variant-numeric: tabular-nums;
}
.wf-delta.zero { color: var(--workshop-fg-4); }
.wf-delta.pos  { color: var(--workshop-positive); }
.wf-delta.neg  { color: var(--workshop-negative); }
.wf-stage-label {
  font-size: 9px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--workshop-fg-3);
  font-family: var(--workshop-sans);
  margin-top: 6px;
}
.wf-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  flex-shrink: 0;
  gap: 2px;
}
.wf-rate {
  font-size: 13px;
  font-weight: 600;
  color: var(--workshop-accent);
  font-family: var(--workshop-mono);
  font-variant-numeric: tabular-nums;
}
.wf-rate-bl {
  font-size: 10px;
  color: var(--workshop-fg-4);
  font-family: var(--workshop-mono);
  font-variant-numeric: tabular-nums;
}
.wf-glyph {
  font-size: 14px;
  color: var(--workshop-rule-2);
  margin-top: 2px;
}
</style>
