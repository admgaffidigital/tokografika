const http = require('http');
const fs = require('fs');
const path = require('path');
const { build } = require('./build');

const PORT = process.env.PORT || 3000;
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, 'dist');

// SSE clients for live reload
let clients = [];

function notifyReload() {
  clients.forEach(client => {
    client.write(`data: reload\n\n`);
  });
}

// Build first
build();

// Injected live-reload client script
const liveReloadScript = `
<script id="__live_reload_script">
(() => {
  console.log('[DevServer] Live reload active');
  const evtSource = new EventSource('/events');
  evtSource.onmessage = (e) => {
    if (e.data === 'reload') {
      console.log('[DevServer] Changes detected! Reloading page...');
      location.reload();
    }
  };
  evtSource.onerror = () => {
    console.warn('[DevServer] SSE connection lost. Retrying...');
  };
})();
</script>
`;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = parsedUrl.pathname;

  // Live Reload SSE endpoint
  if (pathname === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    clients.push(res);
    req.on('close', () => {
      clients = clients.filter(c => c !== res);
    });
    return;
  }

  // Serve root -> dist/preview.html
  if (pathname === '/' || pathname === '/index.html' || pathname === '/preview.html') {
    const previewPath = path.join(distDir, 'preview.html');
    if (fs.existsSync(previewPath)) {
      let content = fs.readFileSync(previewPath, 'utf8');
      // Inject live reload script before </body>
      if (content.includes('</body>')) {
        content = content.replace('</body>', `${liveReloadScript}</body>`);
      } else {
        content += liveReloadScript;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
      return;
    }
  }

  // Serve static files from dist or root
  let targetFile = path.join(distDir, pathname);
  if (!fs.existsSync(targetFile)) {
    targetFile = path.join(rootDir, pathname);
  }

  if (fs.existsSync(targetFile) && fs.statSync(targetFile).isFile()) {
    const ext = path.extname(targetFile);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(targetFile).pipe(res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
});

server.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🌐 Local Dev Server running at: http://localhost:${PORT}`);
  console.log(`⚡ Live Reload enabled! Watching for changes in src/...`);
  console.log(`📄 Production template output: dist/theme.xml`);
  console.log('====================================================\n');
});

// Watch src/ directory for changes (debounced)
let debounceTimer = null;
fs.watch(srcDir, { recursive: true }, (eventType, filename) => {
  if (!filename) return;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    console.log(`🔄 [File Changed] src/${filename} -> Rebuilding...`);
    try {
      build();
      notifyReload();
    } catch (err) {
      console.error('❌ Build failed:', err.message);
    }
  }, 100);
});
