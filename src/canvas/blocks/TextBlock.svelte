<script lang="ts">
  import type { TextBlockData } from '../canvasSchema'
  import { updateBlock } from '../canvasStore'

  let { block }: { block: TextBlockData } = $props()

  let editing = $state(false)
  let textareaEl = $state<HTMLTextAreaElement | null>(null)

  function startEdit() {
    editing = true
    // Focus after DOM update
    setTimeout(() => textareaEl?.focus(), 0)
  }

  function commitEdit(value: string) {
    updateBlock(block.id, { markdown: value })
    editing = false
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      editing = false
    }
  }

  // Minimal markdown → HTML (bold, italic, headings, linebreaks)
  function renderMarkdown(md: string): string {
    return md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
  }
</script>

<div class="text-block-body" ondblclick={startEdit} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && startEdit()}>
  {#if editing}
    <textarea
      bind:this={textareaEl}
      class="text-edit"
      value={block.markdown}
      onblur={(e) => commitEdit((e.target as HTMLTextAreaElement).value)}
      onkeydown={onKeydown}
      placeholder="Type markdown here…"
    ></textarea>
  {:else if block.markdown}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    <div class="text-rendered">{@html renderMarkdown(block.markdown)}</div>
  {:else}
    <div class="text-placeholder">Double-click to edit…</div>
  {/if}
</div>

<style>
  .text-block-body {
    padding: 10px;
    height: 100%;
    overflow: hidden;
    cursor: text;
  }

  .text-edit {
    width: 100%;
    height: 100%;
    border: none;
    background: transparent;
    font: 12px/1.5 var(--workshop-sans);
    color: var(--workshop-fg);
    resize: none;
    outline: none;
    padding: 0;
  }

  .text-rendered {
    font: 12px/1.5 var(--workshop-sans);
    color: var(--workshop-fg);
  }

  .text-rendered :global(h1) { font-size: 16px; font-weight: 600; margin: 0 0 4px; }
  .text-rendered :global(h2) { font-size: 14px; font-weight: 600; margin: 0 0 3px; }
  .text-rendered :global(h3) { font-size: 12px; font-weight: 600; margin: 0 0 2px; }
  .text-rendered :global(strong) { font-weight: 600; }
  .text-rendered :global(em) { font-style: italic; }

  .text-placeholder {
    font: 12px/1.5 var(--workshop-sans);
    color: var(--workshop-fg-4);
    font-style: italic;
  }
</style>
