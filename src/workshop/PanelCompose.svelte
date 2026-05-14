<script lang="ts">
  // Driven entirely by registries — add a style, layout, or block to the
  // registry and it appears here with zero UI changes.
  import { project } from '../store'
  import { THEMES } from '../themes/registry'
  import { LAYOUTS } from '../layouts/registry'
  import { BLOCKS } from '../blocks/registry'
  import Panel from './Panel.svelte'

  function setStyle(id: string) {
    project.update(p => ({ ...p, compose: { ...p.compose, style: id } }))
  }
  function setLayout(id: string) {
    project.update(p => ({ ...p, compose: { ...p.compose, layout: id } }))
  }
  function toggleBlock(id: string, required: boolean) {
    if (required) return
    project.update(p => {
      const blocks = p.compose.blocks.includes(id)
        ? p.compose.blocks.filter(b => b !== id)
        : [...p.compose.blocks, id]
      return { ...p, compose: { ...p.compose, blocks } }
    })
  }
</script>

<Panel title="Compose">
  <div class="pf-picker-group">
    <div class="label">Style</div>
    <div class="options">
      {#each THEMES as theme}
        <button
          class:active={$project.compose.style === theme.id}
          title={theme.description}
          onclick={() => setStyle(theme.id)}
        >{theme.label}</button>
      {/each}
    </div>
  </div>

  <div class="pf-picker-group">
    <div class="label">Layout</div>
    <div class="options">
      {#each LAYOUTS as layout}
        <button
          class:active={$project.compose.layout === layout.id}
          title={layout.description}
          onclick={() => setLayout(layout.id)}
        >{layout.label}</button>
      {/each}
    </div>
  </div>

  <div class="pf-picker-group">
    <div class="label">Blocks</div>
    {#each BLOCKS as block}
      <div class="pf-block-toggle">
        <span class="name" class:required={block.required}>
          {block.label}{#if block.required}&nbsp;<span class="locked-tag">locked</span>{/if}
        </span>
        <label class="pf-toggle">
          <input
            type="checkbox"
            checked={$project.compose.blocks.includes(block.id)}
            disabled={block.required}
            onchange={() => toggleBlock(block.id, block.required)}
          />
          <span class="slider"></span>
        </label>
      </div>
    {/each}
  </div>
</Panel>
