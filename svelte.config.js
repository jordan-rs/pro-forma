import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default {
  preprocess: vitePreprocess(),
  onwarn(warning, handler) {
    // Internal tool — a11y label pairing warnings suppressed
    if (warning.code.startsWith('a11y')) return
    handler(warning)
  },
}
