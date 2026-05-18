<script lang="ts">
  import { canvasState, canvasComputed, selectedIds, updateBlock, removeBlock, duplicateBlock, bringToFront, addWire, removeWire, setViewport } from './canvasStore'
  import { PORT_CATALOG } from './canvasSchema'
  import type { CanvasBlock, WireEdge } from './canvasSchema'
  import TextBlock from './blocks/TextBlock.svelte'
  import LockedInputBlock from './blocks/LockedInputBlock.svelte'
  import AssumptionBlock from './blocks/AssumptionBlock.svelte'
  import DriverBlock from './blocks/DriverBlock.svelte'
  import ScenarioBlock from './blocks/ScenarioBlock.svelte'
  import CashFlowBlock from './blocks/CashFlowBlock.svelte'
  import MetricBlock from './blocks/MetricBlock.svelte'
  import ComparisonBlock from './blocks/ComparisonBlock.svelte'
  import SensitivityBlock from './blocks/SensitivityBlock.svelte'

  // ── Viewport state ──────────────────────────────────────────────────────────
  let panX = $state($canvasState.viewport.x)
  let panY = $state($canvasState.viewport.y)
  let zoom = $state($canvasState.viewport.zoom)

  // ── Interaction state ───────────────────────────────────────────────────────
  let spaceHeld    = $state(false)
  let isPanning    = $state(false)
  let panStart     = $state({ x: 0, y: 0, px: 0, py: 0 })

  let dragBlock    = $state<{ id: string; ox: number; oy: number } | null>(null)
  let dragStart    = $state({ mx: 0, my: 0, bx: 0, by: 0 })

  let resizing     = $state<{ id: string; corner: string; ox: number; oy: number; ow: number; oh: number; bx: number; by: number } | null>(null)

  // Marquee selection
  let marquee      = $state<{ x: number; y: number; w: number; h: number } | null>(null)
  let marqueeStart = $state({ x: 0, y: 0 })

  // Wire dragging
  let wireDrag = $state<{ fromBlockId: string; fromPort: string; fromX: number; fromY: number; mouseX: number; mouseY: number } | null>(null)
  let hoveredPort = $state<{ blockId: string; port: string } | null>(null)

  // Context menu
  let contextMenu = $state<{ x: number; y: number; blockId: string } | null>(null)

  // Selected wire
  let selectedWireId = $state<string | null>(null)

  // ── Snap to grid ────────────────────────────────────────────────────────────
  function snap(v: number): number { return Math.round(v / 8) * 8 }

  // ── Viewport utils ──────────────────────────────────────────────────────────
  // Convert viewport mouse coords → canvas world coords
  function toWorld(vx: number, vy: number): { x: number; y: number } {
    return { x: (vx - panX) / zoom, y: (vy - panY) / zoom }
  }

  // ── Port position calculation ────────────────────────────────────────────────
  // Returns canvas-world coordinates for a port dot
  function outputPortPos(block: CanvasBlock, portIndex: number, totalPorts: number): { x: number; y: number } {
    const headerH = 32
    const bodyH = block.h - headerH
    const spacing = bodyH / (totalPorts + 1)
    return {
      x: block.x + block.w,
      y: block.y + headerH + spacing * (portIndex + 1),
    }
  }

  function inputPortPos(block: CanvasBlock, portIndex: number, totalPorts: number): { x: number; y: number } {
    const headerH = 32
    const bodyH = block.h - headerH
    const spacing = bodyH / (totalPorts + 1)
    return {
      x: block.x,
      y: block.y + headerH + spacing * (portIndex + 1),
    }
  }

  // Get position for a named port on a block
  function portPos(blockId: string, portKey: string, side: 'output' | 'input'): { x: number; y: number } | null {
    const block = $canvasState.blocks.find(b => b.id === blockId)
    if (!block) return null
    const catalog = PORT_CATALOG[block.type]
    const ports = side === 'output' ? catalog.outputs : catalog.inputs
    const idx = ports.findIndex(p => p.key === portKey)
    if (idx === -1) return null
    return side === 'output'
      ? outputPortPos(block, idx, ports.length)
      : inputPortPos(block, idx, ports.length)
  }

  // ── Bezier path ─────────────────────────────────────────────────────────────
  function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
    const dx = Math.abs(x2 - x1) * 0.5
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
  }

  // ── Keyboard events ──────────────────────────────────────────────────────────
  function onWindowKeydown(e: KeyboardEvent) {
    if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
      e.preventDefault()
      spaceHeld = true
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return
      if (selectedWireId) { removeWire(selectedWireId); selectedWireId = null; return }
      for (const id of $selectedIds) removeBlock(id)
      selectedIds.set(new Set())
    }
    if (e.key === 'Escape') {
      contextMenu = null
      wireDrag = null
      selectedIds.set(new Set())
      selectedWireId = null
    }
  }

  function onWindowKeyup(e: KeyboardEvent) {
    if (e.code === 'Space') spaceHeld = false
  }

  // ── Viewport: wheel zoom ─────────────────────────────────────────────────────
  function onWheel(e: WheelEvent) {
    if (!e.ctrlKey && !e.metaKey) return
    e.preventDefault()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const factor = e.deltaY < 0 ? 1.1 : 0.9
    const newZoom = Math.min(2, Math.max(0.25, zoom * factor))
    // Adjust pan so point under cursor stays fixed
    panX = cx - (cx - panX) * (newZoom / zoom)
    panY = cy - (cy - panY) * (newZoom / zoom)
    zoom = newZoom
    setViewport(panX, panY, zoom)
  }

  // ── Viewport: pan on space+drag ──────────────────────────────────────────────
  function onViewportMousedown(e: MouseEvent) {
    contextMenu = null
    if (spaceHeld) {
      isPanning = true
      panStart = { x: e.clientX, y: e.clientY, px: panX, py: panY }
      return
    }
    // Marquee on empty canvas
    if ((e.target as HTMLElement).closest('.canvas-block, .port-dot')) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const wx = e.clientX - rect.left
    const wy = e.clientY - rect.top
    const world = toWorld(wx, wy)
    marqueeStart = { x: world.x, y: world.y }
    marquee = { x: world.x, y: world.y, w: 0, h: 0 }
    selectedIds.set(new Set())
    selectedWireId = null
  }

  function onViewportMousemove(e: MouseEvent) {
    if (isPanning) {
      panX = panStart.px + (e.clientX - panStart.x)
      panY = panStart.py + (e.clientY - panStart.y)
      setViewport(panX, panY, zoom)
      return
    }
    if (dragBlock) {
      const dx = (e.clientX - dragStart.mx) / zoom
      const dy = (e.clientY - dragStart.my) / zoom
      updateBlock(dragBlock.id, { x: snap(dragStart.bx + dx), y: snap(dragStart.by + dy) })
      return
    }
    if (resizing) {
      const dx = (e.clientX - resizing.ox) / zoom
      const dy = (e.clientY - resizing.oy) / zoom
      const corner = resizing.corner
      let nx = resizing.bx, ny = resizing.by
      let nw = resizing.ow, nh = resizing.oh
      if (corner.includes('e')) nw = Math.max(120, snap(resizing.ow + dx))
      if (corner.includes('s')) nh = Math.max(60,  snap(resizing.oh + dy))
      if (corner.includes('w')) { nw = Math.max(120, snap(resizing.ow - dx)); nx = snap(resizing.bx + dx) }
      if (corner.includes('n')) { nh = Math.max(60,  snap(resizing.oh - dy)); ny = snap(resizing.by + dy) }
      updateBlock(resizing.id, { x: nx, y: ny, w: nw, h: nh })
      return
    }
    if (marquee) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const world = toWorld(e.clientX - rect.left, e.clientY - rect.top)
      const x = Math.min(marqueeStart.x, world.x)
      const y = Math.min(marqueeStart.y, world.y)
      const w = Math.abs(world.x - marqueeStart.x)
      const h = Math.abs(world.y - marqueeStart.y)
      marquee = { x, y, w, h }
      // Select intersecting blocks
      const hit = new Set<string>()
      for (const b of $canvasState.blocks) {
        if (b.x < x + w && b.x + b.w > x && b.y < y + h && b.y + b.h > y) hit.add(b.id)
      }
      selectedIds.set(hit)
      return
    }
    if (wireDrag) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const world = toWorld(e.clientX - rect.left, e.clientY - rect.top)
      wireDrag = { ...wireDrag, mouseX: world.x, mouseY: world.y }
    }
  }

  function onViewportMouseup() {
    isPanning = false
    dragBlock  = null
    resizing   = null
    if (marquee && (marquee.w < 4 && marquee.h < 4)) {
      selectedIds.set(new Set())
    }
    marquee = null
    wireDrag = null
    hoveredPort = null
  }

  // ── Block drag ────────────────────────────────────────────────────────────────
  function onBlockHeaderMousedown(e: MouseEvent, block: CanvasBlock) {
    if (spaceHeld) return
    e.stopPropagation()
    bringToFront(block.id)
    if (!$selectedIds.has(block.id)) {
      if (!e.shiftKey) selectedIds.set(new Set([block.id]))
      else selectedIds.update(ids => { ids.add(block.id); return new Set(ids) })
    }
    dragBlock = { id: block.id, ox: e.clientX, oy: e.clientY }
    dragStart = { mx: e.clientX, my: e.clientY, bx: block.x, by: block.y }
  }

  function onBlockClick(e: MouseEvent | KeyboardEvent, id: string) {
    e.stopPropagation()
    selectedWireId = null
    if ((e as MouseEvent).shiftKey) {
      selectedIds.update(ids => {
        if (ids.has(id)) ids.delete(id)
        else ids.add(id)
        return new Set(ids)
      })
    } else {
      selectedIds.set(new Set([id]))
    }
  }

  // ── Resize handle ─────────────────────────────────────────────────────────────
  function onResizeMousedown(e: MouseEvent, block: CanvasBlock, corner: string) {
    e.stopPropagation()
    resizing = { id: block.id, corner, ox: e.clientX, oy: e.clientY, ow: block.w, oh: block.h, bx: block.x, by: block.y }
  }

  // ── Context menu ──────────────────────────────────────────────────────────────
  function onBlockContextMenu(e: MouseEvent, id: string) {
    e.preventDefault()
    e.stopPropagation()
    contextMenu = { x: e.clientX, y: e.clientY, blockId: id }
  }

  // ── Port: start wire drag ─────────────────────────────────────────────────────
  function onOutputPortMousedown(e: MouseEvent, block: CanvasBlock, portKey: string, portIdx: number, totalPorts: number) {
    e.stopPropagation()
    const pos = outputPortPos(block, portIdx, totalPorts)
    wireDrag = { fromBlockId: block.id, fromPort: portKey, fromX: pos.x, fromY: pos.y, mouseX: pos.x, mouseY: pos.y }
  }

  function onInputPortMouseup(e: MouseEvent, block: CanvasBlock, portKey: string) {
    e.stopPropagation()
    if (!wireDrag) return
    if (wireDrag.fromBlockId === block.id) { wireDrag = null; return }
    addWire(wireDrag.fromBlockId, wireDrag.fromPort, block.id, portKey)
    wireDrag = null
    hoveredPort = null
  }

  function onInputPortMouseenter(_e: MouseEvent, blockId: string, port: string) {
    if (wireDrag) hoveredPort = { blockId, port }
  }

  function onInputPortMouseleave() {
    hoveredPort = null
  }

  // ── Wire click ────────────────────────────────────────────────────────────────
  function onWireClick(e: MouseEvent, wire: WireEdge) {
    e.stopPropagation()
    selectedWireId = wire.id
    selectedIds.set(new Set())
  }

  // ── Export toggle ─────────────────────────────────────────────────────────────
  function toggleExport(e: MouseEvent, block: CanvasBlock) {
    e.stopPropagation()
    updateBlock(block.id, { exportIncluded: !block.exportIncluded })
  }

  // ── Fit to view ───────────────────────────────────────────────────────────────
  function fitToView() {
    if ($canvasState.blocks.length === 0) { panX = 0; panY = 0; zoom = 1; return }
    const minX = Math.min(...$canvasState.blocks.map(b => b.x))
    const minY = Math.min(...$canvasState.blocks.map(b => b.y))
    const maxX = Math.max(...$canvasState.blocks.map(b => b.x + b.w))
    const maxY = Math.max(...$canvasState.blocks.map(b => b.y + b.h))
    const pad = 80
    const vpEl = document.querySelector('.canvas-viewport') as HTMLElement | null
    if (!vpEl) return
    const vpW = vpEl.clientWidth
    const vpH = vpEl.clientHeight
    const contentW = maxX - minX + pad * 2
    const contentH = maxY - minY + pad * 2
    zoom = Math.min(1, Math.min(vpW / contentW, vpH / contentH))
    panX = (vpW - contentW * zoom) / 2 - (minX - pad) * zoom
    panY = (vpH - contentH * zoom) / 2 - (minY - pad) * zoom
    setViewport(panX, panY, zoom)
  }

  // Sort blocks by zIndex for rendering order
  const sortedBlocks = $derived([...$canvasState.blocks].sort((a, b) => a.zIndex - b.zIndex))

  // Human-readable label for a wire midpoint
  function wireLabel(wire: WireEdge): string {
    const fromBlock = $canvasState.blocks.find(b => b.id === wire.fromBlockId)
    if (!fromBlock) return wire.fromPort
    const portDef = PORT_CATALOG[fromBlock.type].outputs.find(p => p.key === wire.fromPort)
    return portDef?.label ?? wire.fromPort
  }
</script>

<svelte:window
  onkeydown={onWindowKeydown}
  onkeyup={onWindowKeyup}
  onmouseup={onViewportMouseup}
/>

<div
  class="canvas-viewport"
  class:panning={spaceHeld || isPanning}
  class:wiring={!!wireDrag}
  role="application"
  aria-label="Canvas"
  onwheel={onWheel}
  onmousedown={onViewportMousedown}
  onmousemove={onViewportMousemove}
>
  <!-- Canvas world: all blocks and wires are in here, transformed together -->
  <div
    class="canvas-world"
    style="transform: translate({panX}px, {panY}px) scale({zoom})"
  >
    <!-- Wire SVG layer (below blocks) -->
    <svg class="wires-svg" width="4000" height="4000">
      <!-- Committed wires -->
      {#each $canvasState.wires as wire (wire.id)}
        {@const fromPos = portPos(wire.fromBlockId, wire.fromPort, 'output')}
        {@const toPos   = portPos(wire.toBlockId,   wire.toPort,   'input')}
        {#if fromPos && toPos}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <path
            class="wire-path"
            class:selected={selectedWireId === wire.id}
            d={bezierPath(fromPos.x, fromPos.y, toPos.x, toPos.y)}
            onclick={(e) => onWireClick(e, wire)}
          />
          <!-- Wire midpoint label -->
          <text
            x={(fromPos.x + toPos.x) / 2}
            y={(fromPos.y + toPos.y) / 2 - 6}
            fill="var(--workshop-fg-4)"
            font-size="9"
            font-family="var(--workshop-mono)"
            text-anchor="middle"
            pointer-events="none"
          >{wireLabel(wire)}</text>
        {/if}
      {/each}

      <!-- Preview wire while dragging -->
      {#if wireDrag}
        <path
          class="wire-preview"
          d={bezierPath(wireDrag.fromX, wireDrag.fromY, wireDrag.mouseX, wireDrag.mouseY)}
        />
      {/if}
    </svg>

    <!-- Blocks layer -->
    {#each sortedBlocks as block (block.id)}
      {@const isSelected   = $selectedIds.has(block.id)}
      {@const hasCycle     = $canvasComputed.cycleIds.has(block.id)}
      {@const catalog      = PORT_CATALOG[block.type]}
      {@const blockOutputs = $canvasComputed.cache.get(block.id) ?? {}}

      <div
        class="canvas-block"
        class:selected={isSelected}
        class:has-cycle={hasCycle}
        class:dragging={dragBlock?.id === block.id}
        style="left: {block.x}px; top: {block.y}px; width: {block.w}px; height: {block.h}px; z-index: {block.zIndex}"
        role="button"
        tabindex="0"
        onclick={(e) => onBlockClick(e, block.id)}
        oncontextmenu={(e) => onBlockContextMenu(e, block.id)}
        onkeydown={(e) => e.key === 'Enter' && onBlockClick(e, block.id)}
      >
        <!-- Header / drag handle -->
        <div
          class="cb-header"
          role="button"
          tabindex="-1"
          onmousedown={(e) => onBlockHeaderMousedown(e, block)}
          onkeydown={() => {}}
        >
          <span class="cb-type-badge">{block.type}</span>
          <span class="cb-label">{block.label}</span>
          {#if hasCycle}
            <span title="Cycle detected — computation halted" style="color:var(--workshop-negative);font-size:11px">⚠</span>
          {/if}
          <!-- Export toggle -->
          <button
            class="cb-export-toggle"
            class:on={block.exportIncluded}
            title="{block.exportIncluded ? 'Remove from' : 'Add to'} export"
            onclick={(e) => toggleExport(e, block)}
          ></button>
        </div>

        <!-- Block body -->
        <div class="cb-body">
          {#if block.type === 'text'}
            <TextBlock {block} />
          {:else if block.type === 'locked'}
            <LockedInputBlock {block} />
          {:else if block.type === 'assumption'}
            <AssumptionBlock {block} />
          {:else if block.type === 'driver'}
            <DriverBlock {block} computed={blockOutputs} />
          {:else if block.type === 'scenario'}
            <ScenarioBlock {block} computed={blockOutputs} />
          {:else if block.type === 'cashflow'}
            <CashFlowBlock {block} computed={blockOutputs} />
          {:else if block.type === 'metric'}
            <MetricBlock {block} computed={blockOutputs} />
          {:else if block.type === 'comparison'}
            <ComparisonBlock {block} computed={blockOutputs} />
          {:else if block.type === 'sensitivity'}
            <SensitivityBlock {block} computed={blockOutputs} />
          {/if}
        </div>

        <!-- Output port dots -->
        {#each catalog.outputs as port, i}
          {@const pos = outputPortPos(block, i, catalog.outputs.length)}
          <div
            class="port-dot output-port"
            class:drag-source={wireDrag?.fromBlockId === block.id && wireDrag.fromPort === port.key}
            style="top: {pos.y - block.y - 5}px"
            title="{port.label} ({port.type})"
            role="button"
            tabindex="-1"
            onmousedown={(e) => onOutputPortMousedown(e, block, port.key, i, catalog.outputs.length)}
            onkeydown={() => {}}
          ></div>
        {/each}

        <!-- Input port dots -->
        {#each catalog.inputs as port, i}
          {@const pos = inputPortPos(block, i, catalog.inputs.length)}
          <div
            class="port-dot input-port"
            class:can-connect={hoveredPort?.blockId === block.id && hoveredPort.port === port.key}
            style="top: {pos.y - block.y - 5}px"
            title="{port.label} ({port.type})"
            role="button"
            tabindex="-1"
            onmouseup={(e) => onInputPortMouseup(e, block, port.key)}
            onmouseenter={(e) => onInputPortMouseenter(e, block.id, port.key)}
            onmouseleave={onInputPortMouseleave}
            onkeydown={() => {}}
          ></div>
        {/each}

        <!-- Resize handles (only when selected) -->
        {#if isSelected}
          {#each ['se', 'sw', 'ne', 'nw'] as corner}
            <div
              class="resize-handle {corner}"
              role="button"
              tabindex="-1"
              onmousedown={(e) => onResizeMousedown(e, block, corner)}
              onkeydown={() => {}}
            ></div>
          {/each}
        {/if}
      </div>
    {/each}

    <!-- Marquee selection rect -->
    {#if marquee && (marquee.w > 4 || marquee.h > 4)}
      <div
        class="marquee-rect"
        style="left:{marquee.x}px; top:{marquee.y}px; width:{marquee.w}px; height:{marquee.h}px"
      ></div>
    {/if}
  </div>

  <!-- Zoom level indicator -->
  <div class="ctb-zoom" style="position:absolute;bottom:12px;right:16px;background:var(--workshop-bg);padding:4px 8px;border-radius:4px;border:1px solid var(--workshop-rule)">
    {Math.round(zoom * 100)}%
  </div>

  <!-- Empty canvas guide — shown after "New blank canvas" or when all blocks are deleted -->
  {#if $canvasState.blocks.length === 0}
    <div class="canvas-empty-overlay">
      <div class="ceo-card">
        <div class="ceo-title">Canvas is empty</div>
        <div class="ceo-sub">Load a template from the sidebar to see a live model, or build from scratch.</div>
        <div class="ceo-steps">
          <div class="ceo-step">
            <span class="ceo-num">1</span>
            <span>Click a block in the sidebar to add it to the canvas</span>
          </div>
          <div class="ceo-step">
            <span class="ceo-num">2</span>
            <span>Drag from an output port <span class="ceo-dot out"></span> to an input port <span class="ceo-dot in"></span> to wire values between blocks</span>
          </div>
          <div class="ceo-step">
            <span class="ceo-num">3</span>
            <span>Click <strong>Export One-Pager</strong> to generate a shareable decision document</span>
          </div>
        </div>
        <div class="ceo-tip">Tip: start with a template — it shows a fully wired model you can explore and modify.</div>
      </div>
    </div>
  {/if}
</div>

<!-- Context menu -->
{#if contextMenu}
  <div
    class="canvas-context-menu"
    style="left:{contextMenu.x}px; top:{contextMenu.y}px"
    role="menu"
  >
    <button class="ccm-item" role="menuitem" onclick={() => { duplicateBlock(contextMenu!.blockId); contextMenu = null }}>Duplicate</button>
    <button class="ccm-item" role="menuitem" onclick={() => { bringToFront(contextMenu!.blockId); contextMenu = null }}>Bring to front</button>
    <button class="ccm-item danger" role="menuitem" onclick={() => { removeBlock(contextMenu!.blockId); contextMenu = null }}>Delete</button>
  </div>
{/if}

<!-- Fit-to-view button exposed via slot/event -->
<div style="display:none">
  <button id="canvas-fit-btn" onclick={fitToView}></button>
</div>
