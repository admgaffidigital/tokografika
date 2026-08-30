import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const { build: buildHtml, generateHtml } = require('./scripts/build.js');

function webAppPlugin() {
  return {
    name: 'vite-plugin-pwa-app',
    
    // Initial build when Vite starts or builds
    buildStart() {
      try {
        buildHtml();
      } catch (err) {
        this.error(err);
      }
    },

    // Configure Dev Server
    configureServer(server) {
      // Watch changes in src/
      server.watcher.add(path.resolve(__dirname, 'src'));

      server.watcher.on('change', (changedPath) => {
        if (changedPath.includes(path.sep + 'src' + path.sep)) {
          console.log(`\n🔄 [File Modified] ${path.relative(__dirname, changedPath)} -> Rebuilding Web App...`);
          try {
            buildHtml();
            server.ws.send({ type: 'full-reload', path: '*' });
          } catch (err) {
            console.error('❌ Build failed:', err.message);
          }
        }
      });
    },

    // Transform index.html on the fly during dev and build
    transformIndexHtml(html) {
      try {
        return generateHtml();
      } catch (err) {
        console.error('Error generating HTML:', err);
        return html;
      }
    }
  };
}

export default defineConfig({
  plugins: [webAppPlugin()],
  root: '.',
  server: {
    port: 3000,
    open: false,
    host: true
  },
  preview: {
    port: 4173,
    open: false
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false
  }
});
