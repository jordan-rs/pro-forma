import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { viteSingleFile } from 'vite-plugin-singlefile'

const MCP_PORT = process.env.MCP_PORT

export default defineConfig({
  plugins: [
    svelte(),
    viteSingleFile(),
  ],
  build: {
    target: 'esnext',
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    outDir: 'dist',
  },
  server: {
    proxy: MCP_PORT ? {
      '/api': `http://localhost:${MCP_PORT}`,
    } : {},
  },
})
