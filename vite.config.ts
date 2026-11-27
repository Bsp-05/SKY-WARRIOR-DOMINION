import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const isMakefun = process.env.MAKEFUN_GAME === '1';
  return {
    base: isMakefun ? './' : '/',
    plugins: [
      react(),
      tailwindcss(),
      ...(isMakefun
        ? [
            {
              name: 'makefun-offline-html',
              transformIndexHtml(html: string): string {
                return html
                  .replace(/<link[^>]*fonts\.googleapis\.com[^>]*>\s*/gi, '')
                  .replace(/<link[^>]*fonts\.gstatic\.com[^>]*>\s*/gi, '');
              },
            },
          ]
        : []),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(import.meta.dirname, isMakefun ? 'game' : 'dist');
          const srcAssets = path.resolve(import.meta.dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
    ],
    build: isMakefun
      ? {
          outDir: 'game',
          emptyOutDir: true,
          minify: false,
          cssMinify: false,
          rolldownOptions: {
            output: {
              entryFileNames: 'src/[name].js',
              chunkFileNames: (chunkInfo) => {
                if (chunkInfo.name.startsWith('vendor/')) {
                  return '[name].min.js';
                }
                return 'src/[name].js';
              },
              assetFileNames: (assetInfo) => {
                if (assetInfo.names?.[0]?.endsWith('.css')) {
                  return 'src/styles.css';
                }
                return 'assets/[name][extname]';
              },
              codeSplitting: {
                groups: [
                  {
                    name: 'vendor/libs',
                    test: /node_modules/,
                    priority: 30,
                  },
                  {
                    name: 'flight-rules',
                    test: /src\/game\/rules\.ts/,
                    priority: 20,
                  },
                  {
                    name: 'world-terrain',
                    test: /src\/game\/world\.ts/,
                    priority: 20,
                  },
                  {
                    name: 'jet-models',
                    test: /src\/game\/models\.ts/,
                    priority: 20,
                  },
                  {
                    name: 'procedural-textures',
                    test: /src\/game\/textures\.ts/,
                    priority: 20,
                  },
                  {
                    name: 'combat-audio',
                    test: /src\/game\/audio\.ts/,
                    priority: 20,
                  },
                  {
                    name: 'flight-engine',
                    test: /src\/game\/engine\.ts/,
                    priority: 20,
                  },
                ],
              },
            },
          },
        }
      : undefined,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
