import { writable, derived } from 'svelte/store'
import type { CanvasState, CanvasBlock, WireEdge, CanvasBlockType } from './canvasSchema'
import { emptyCanvasState, createBlock } from './canvasSchema'
import { computeAll } from './canvasCompute'
import { loadAutosave, autosave } from './persistence'
import type { OutputCache } from './canvasCompute'
import { vendorDecision } from './templates/vendorDecision'

// ─── CANVAS STATE STORE ───────────────────────────────────────────────────────

// First-run: load the Vendor Decision template so new users see a live model.
const initial = loadAutosave() ?? vendorDecision()

export const canvasState = writable<CanvasState>(initial)

// Autosave on every change
canvasState.subscribe(state => autosave(state))

// ─── COMPUTED OUTPUTS ─────────────────────────────────────────────────────────

export const canvasComputed = derived<typeof canvasState, { cache: OutputCache; cycleIds: Set<string> }>(
  canvasState,
  ($state) => computeAll($state),
)

// ─── SELECTED BLOCK IDs ───────────────────────────────────────────────────────

export const selectedIds = writable<Set<string>>(new Set())

// ─── BLOCK MUTATIONS ─────────────────────────────────────────────────────────

export function addBlock(type: CanvasBlockType, x: number, y: number): CanvasBlock {
  const block = createBlock(type, x, y)
  canvasState.update(s => ({ ...s, blocks: [...s.blocks, block] }))
  return block
}

export function updateBlock(id: string, patch: Partial<CanvasBlock>): void {
  canvasState.update(s => ({
    ...s,
    blocks: s.blocks.map(b => b.id === id ? { ...b, ...patch } as CanvasBlock : b),
  }))
}

export function removeBlock(id: string): void {
  canvasState.update(s => ({
    ...s,
    blocks: s.blocks.filter(b => b.id !== id),
    // Remove all wires connected to this block
    wires: s.wires.filter(w => w.fromBlockId !== id && w.toBlockId !== id),
  }))
  selectedIds.update(ids => { ids.delete(id); return new Set(ids) })
}

export function duplicateBlock(id: string): void {
  canvasState.update(s => {
    const original = s.blocks.find(b => b.id === id)
    if (!original) return s
    const copy: CanvasBlock = {
      ...original,
      id: `${original.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      x: original.x + 24,
      y: original.y + 24,
      label: original.label + ' (copy)',
    }
    return { ...s, blocks: [...s.blocks, copy] }
  })
}

export function bringToFront(id: string): void {
  canvasState.update(s => {
    const maxZ = Math.max(0, ...s.blocks.map(b => b.zIndex))
    return {
      ...s,
      blocks: s.blocks.map(b => b.id === id ? { ...b, zIndex: maxZ + 1 } : b),
    }
  })
}

// ─── WIRE MUTATIONS ───────────────────────────────────────────────────────────

export function addWire(fromBlockId: string, fromPort: string, toBlockId: string, toPort: string): WireEdge | null {
  // Prevent duplicate wires
  let duplicate = false
  let result: WireEdge | null = null
  canvasState.update(s => {
    if (s.wires.some(w => w.toBlockId === toBlockId && w.toPort === toPort)) {
      duplicate = true
      return s
    }
    const wire: WireEdge = {
      id: `wire-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      fromBlockId, fromPort, toBlockId, toPort,
    }
    result = wire
    return { ...s, wires: [...s.wires, wire] }
  })
  if (duplicate) return null
  return result
}

export function removeWire(id: string): void {
  canvasState.update(s => ({ ...s, wires: s.wires.filter(w => w.id !== id) }))
}

// ─── VIEWPORT MUTATIONS ───────────────────────────────────────────────────────

export function setViewport(x: number, y: number, zoom: number): void {
  canvasState.update(s => ({ ...s, viewport: { x, y, zoom } }))
}

export function setCompose(style: string, layout: string): void {
  canvasState.update(s => ({ ...s, compose: { style, layout } }))
}

// ─── CANVAS RESET ─────────────────────────────────────────────────────────────

export function resetCanvas(): void {
  canvasState.set(emptyCanvasState())
  selectedIds.set(new Set())
}

export function loadCanvasState(state: CanvasState): void {
  canvasState.set(state)
  selectedIds.set(new Set())
}
