<script lang="ts">
  import type { ExecutionPhase } from '../schema'

  interface Props {
    title: string
    meta: string
    phases: [ExecutionPhase, ExecutionPhase, ExecutionPhase]
  }
  let { title, meta, phases }: Props = $props()
</script>

<div class="c-execution">
  <div class="head">
    <div class="t">{@html title}</div>
    <div class="meta">{meta}</div>
  </div>
  <div class="phases">
    {#each phases as phase}
      <div class="ph">
        <div class="lab">{phase.label}<span class="w"> · {phase.window}</span></div>
        <div class="nm">{phase.name}</div>
        <div class="bd">{@html phase.body}</div>
      </div>
    {/each}
  </div>
</div>
