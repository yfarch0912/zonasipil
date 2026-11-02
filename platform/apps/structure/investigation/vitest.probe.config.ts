import { defineConfig } from 'vitest/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root = path.dirname(fileURLToPath(import.meta.url)) + '/..'
export default defineConfig({
  root,
  resolve: { alias: { '@': path.resolve(root, 'src') } },
  test: { include: ['investigation/**/*.probe.ts'], environment: 'node' },
})
