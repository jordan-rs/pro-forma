<script lang="ts">
  import type { Snippet } from 'svelte'
  interface Props {
    title: string
    open?: boolean
    children: Snippet
  }
  let { title, open = $bindable(true), children }: Props = $props()
</script>

<div class="pf-panel">
  <button class="pf-panel-header" class:open onclick={() => open = !open} aria-expanded={open}>
    <span class="title">{title}</span>
    <span class="chevron">›</span>
  </button>
  {#if open}
    <div class="pf-panel-body">
      {@render children()}
    </div>
  {/if}
</div>
