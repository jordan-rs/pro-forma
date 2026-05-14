<script lang="ts">
  import { project } from '../store'
  import Panel from './Panel.svelte'

  function set<K extends keyof typeof $project.meta>(key: K, value: string) {
    project.update(p => ({ ...p, meta: { ...p.meta, [key]: value } }))
  }
</script>

<Panel title="Meta">
  <div class="pf-field">
    <label>Title</label>
    <input type="text" value={$project.meta.title} oninput={e => set('title', e.currentTarget.value)}/>
  </div>
  <div class="pf-field">
    <label>Product</label>
    <input type="text" value={$project.meta.product} oninput={e => set('product', e.currentTarget.value)}/>
  </div>
  <div class="pf-field">
    <label>Team</label>
    <input type="text" value={$project.meta.team} oninput={e => set('team', e.currentTarget.value)}/>
  </div>
  <div class="pf-field">
    <label>Context</label>
    <input type="text" value={$project.meta.context} oninput={e => set('context', e.currentTarget.value)}/>
  </div>
  <div class="pf-field">
    <label>Date</label>
    <input type="text" value={$project.meta.date} oninput={e => set('date', e.currentTarget.value)}/>
  </div>
</Panel>
