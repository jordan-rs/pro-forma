<script lang="ts">
  import type { FunnelStepContent } from '../schema'

  interface FunnelStage {
    count: string    // "2M", "190K" — pre-formatted
    label: string    // "acquired / yr"
  }
  interface Props {
    title: string
    meta: string
    stages: [FunnelStage, FunnelStage, FunnelStage, FunnelStage]
    steps:  [FunnelStepContent, FunnelStepContent, FunnelStepContent]
    rates:  [string, string, string]  // "9.5%", "60%", "47%" — live from compute
  }
  let { title, meta, stages, steps, rates }: Props = $props()
</script>

<div class="c-funnel">
  <div class="head">
    <div class="t">{@html title}</div>
    <div class="meta">{meta}</div>
  </div>
  <div class="flow">
    <div class="stage">
      <div class="cnt">{stages[0].count}</div>
      <div class="lab">{stages[0].label}</div>
    </div>
    <div class="step">
      <div class="rate">{rates[0]}</div>
      <div class="how">{steps[0].how}</div>
      <div class="rc">{steps[0].rcNote}</div>
    </div>
    <div class="stage">
      <div class="cnt">{stages[1].count}</div>
      <div class="lab">{stages[1].label}</div>
    </div>
    <div class="step">
      <div class="rate">{rates[1]}</div>
      <div class="how">{steps[1].how}</div>
      <div class="rc">{steps[1].rcNote}</div>
    </div>
    <div class="stage">
      <div class="cnt">{stages[2].count}</div>
      <div class="lab">{stages[2].label}</div>
    </div>
    <div class="step">
      <div class="rate">{rates[2]}</div>
      <div class="how">{steps[2].how}</div>
      <div class="rc">{steps[2].rcNote}</div>
    </div>
    <div class="stage">
      <div class="cnt">{stages[3].count}</div>
      <div class="lab">{stages[3].label}</div>
    </div>
  </div>
</div>
