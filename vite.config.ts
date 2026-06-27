import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

function apiDocsPlugin(): Plugin {
  const docsDir = resolve(rootDir, 'docs');
  const docsIndexPath = resolve(docsDir, 'index.html');
  const openApiPath = resolve(docsDir, 'openapi.yaml');

  return {
    name: 'learn-app-api-docs',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url?.split('?')[0];
        const method = req.method ?? 'GET';
        if (method !== 'GET' && method !== 'HEAD') return next();
        if (path === '/docs' || path === '/docs/') {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          if (method === 'HEAD') return res.end();
          return res.end(readFileSync(docsIndexPath));
        }
        if (path === '/docs/openapi.yaml') {
          res.setHeader('Content-Type', 'application/yaml; charset=utf-8');
          if (method === 'HEAD') return res.end();
          return res.end(readFileSync(openApiPath));
        }
        return next();
      });
    },
    closeBundle() {
      const distDocsDir = resolve(rootDir, 'dist/docs');
      mkdirSync(distDocsDir, { recursive: true });
      copyFileSync(docsIndexPath, resolve(distDocsDir, 'index.html'));
      copyFileSync(openApiPath, resolve(distDocsDir, 'openapi.yaml'));
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), apiDocsPlugin()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: { reporter: ['text', 'html'] },
  },
});
