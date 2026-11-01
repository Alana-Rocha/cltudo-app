import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    // Lógica pura roda em node; componentes e hooks (.tsx) precisam de DOM.
    projects: [
      { extends: true, test: { name: 'node', include: ['src/**/*.test.ts'], environment: 'node' } },
      { extends: true, test: { name: 'dom', include: ['src/**/*.test.tsx'], environment: 'jsdom' } },
    ],
  },
});
