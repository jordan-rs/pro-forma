import type { CanvasState } from './canvasSchema'
import { emptyCanvasState } from './canvasSchema'

const STORAGE_KEY = 'pf-canvas-autosave'

// ─── AUTOSAVE ─────────────────────────────────────────────────────────────────

let autosaveTimer: ReturnType<typeof setTimeout> | null = null

export function autosave(state: CanvasState): void {
  if (autosaveTimer) clearTimeout(autosaveTimer)
  autosaveTimer = setTimeout(() => {
    try {
      // Persist everything except viewport (session state)
      const { viewport: _vp, ...rest } = state
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rest))
    } catch {
      // Storage quota exceeded — ignore
    }
  }, 2000)
}

export function loadAutosave(): CanvasState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Omit<CanvasState, 'viewport'>
    // Re-add viewport with default values
    return { ...parsed, viewport: { x: 0, y: 0, zoom: 1 } }
  } catch {
    return null
  }
}

export function clearAutosave(): void {
  localStorage.removeItem(STORAGE_KEY)
}

// ─── SERIALIZE / DESERIALIZE ──────────────────────────────────────────────────

function serialize(state: CanvasState): string {
  const { viewport: _vp, ...rest } = state
  return JSON.stringify(rest, null, 2)
}

function deserialize(json: string): CanvasState {
  const parsed = JSON.parse(json)
  if (parsed.version !== '1') throw new Error('Unsupported .proforma.json version')
  return { ...parsed, viewport: { x: 0, y: 0, zoom: 1 } }
}

// ─── SAVE TO FILE ─────────────────────────────────────────────────────────────

export async function saveToFile(state: CanvasState): Promise<void> {
  const json = serialize(state)
  const blob = new Blob([json], { type: 'application/json' })

  // Try File System Access API first
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as typeof window & { showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
        suggestedName: 'canvas.proforma.json',
        types: [{ description: 'ProForma Canvas', accept: { 'application/json': ['.json'] } }],
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return
    } catch (e: unknown) {
      if ((e as { name?: string }).name === 'AbortError') return
      // Fall through to download fallback
    }
  }

  // Fallback: trigger download
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'canvas.proforma.json'
  a.click()
  URL.revokeObjectURL(url)
}

// ─── LOAD FROM FILE ───────────────────────────────────────────────────────────

export async function loadFromFile(): Promise<CanvasState | null> {
  // Try File System Access API first
  if ('showOpenFilePicker' in window) {
    try {
      const [handle] = await (window as typeof window & { showOpenFilePicker: (opts: unknown) => Promise<FileSystemFileHandle[]> }).showOpenFilePicker({
        types: [{ description: 'ProForma Canvas', accept: { 'application/json': ['.json'] } }],
      })
      const file = await handle.getFile()
      const text = await file.text()
      return deserialize(text)
    } catch (e: unknown) {
      if ((e as { name?: string }).name === 'AbortError') return null
      // Fall through to input fallback
    }
  }

  // Fallback: file input
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) { resolve(null); return }
      try {
        const text = await file.text()
        resolve(deserialize(text))
      } catch {
        alert('Invalid .proforma.json file')
        resolve(null)
      }
    }
    input.oncancel = () => resolve(null)
    input.click()
  })
}

// ─── EXPORT EMPTY STATE ───────────────────────────────────────────────────────

export { emptyCanvasState }
