import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const BASE = '/Sama-/';

function listPublicFiles(dir: string, root = dir): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return listPublicFiles(full, root);
    return [relative(root, full).split('\\').join('/')];
  });
}

/**
 * Tiny dependency-free PWA plugin: emits sw.js with a precache list of every
 * built asset, so the whole app works offline after the first visit.
 */
function serviceWorkerPlugin(): Plugin {
  return {
    name: 'sama-service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      const files = new Set<string>(['', 'index.html']);
      for (const fileName of Object.keys(bundle)) files.add(fileName);
      for (const f of listPublicFiles('public')) {
        if (f !== 'sw-template.js') files.add(f);
      }
      const precache = [...files].map((f) => BASE + f);
      const version = Date.now().toString(36);
      const template = readFileSync('src/sw-template.js', 'utf8');
      const source = template
        .replace('__PRECACHE__', JSON.stringify(precache, null, 2))
        .replace('__VERSION__', version)
        .replaceAll('__BASE__', BASE);
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  base: BASE,
  define: {
    __APP_VERSION__: JSON.stringify(JSON.parse(readFileSync('package.json', 'utf8')).version),
  },
  plugins: [react(), tailwindcss(), serviceWorkerPlugin()],
  test: {
    environment: 'node',
  },
});
