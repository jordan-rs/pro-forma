<script lang="ts">
  const { recommendation, ask, whatYesUnlocks, costOfDelay } = $props<{
    recommendation: string
    ask: string
    whatYesUnlocks: string
    costOfDelay: string
  }>()
</script>

<div class="c-ask">
  <div class="ca-rec">{recommendation}</div>
  <div class="ca-grid">
    <div class="ca-item">
      <div class="ca-label">What we're asking for</div>
      <div class="ca-body">{ask}</div>
    </div>
    <div class="ca-item">
      <div class="ca-label">What yes unlocks</div>
      <div class="ca-body">{whatYesUnlocks}</div>
    </div>
    <div class="ca-item">
      <div class="ca-label">Cost of delay</div>
      <div class="ca-body">{costOfDelay}</div>
    </div>
  </div>
</div>
