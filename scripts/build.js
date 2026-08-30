const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Function to resolve @include directives recursively
function resolveIncludes(filePath, baseDir = srcDir, visited = new Set()) {
  let fullPath = path.isAbsolute(filePath) ? filePath : path.join(baseDir, filePath);
  
  // Fallback: check relative to srcDir if not found in current baseDir
  if (!fs.existsSync(fullPath)) {
    const fallbackPath = path.join(srcDir, filePath);
    if (fs.existsSync(fallbackPath)) {
      fullPath = fallbackPath;
    } else {
      console.error(`[BUILD ERROR] File not found: ${fullPath} (nor at ${fallbackPath})`);
      return `<!-- FILE NOT FOUND: ${filePath} -->`;
    }
  }

  if (visited.has(fullPath)) {
    console.warn(`[BUILD WARNING] Circular include detected: ${fullPath}`);
    return '';
  }
  visited.add(fullPath);

  let content = fs.readFileSync(fullPath, 'utf8');
  const currentDir = path.dirname(fullPath);

  // Match:
  // 1. <!-- @include path/to/file.ext -->
  // 2. /* @include path/to/file.ext */
  // 3. // @include path/to/file.ext
  const includeRegex = /<!--\s*@include\s+['"]?([^'"\r\n]+?)['"]?\s*-->|\/\*\s*@include\s+['"]?([^'"\r\n]+?)['"]?\s*\*\/|\/\/\s*@include\s+['"]?([^\r\n]+)/g;

  content = content.replace(includeRegex, (match, p1, p2, p3) => {
    const target = (p1 || p2 || p3 || '').trim();
    if (!target) return match;
    return resolveIncludes(target, currentDir, new Set(visited));
  });

  return content;
}

function generateHtml() {
  const entryTemplate = path.join(srcDir, 'index.html');
  if (!fs.existsSync(entryTemplate)) {
    throw new Error('src/index.html not found!');
  }
  return resolveIncludes('index.html', srcDir);
}

function copyPublicAssets() {
  if (fs.existsSync(publicDir)) {
    const files = fs.readdirSync(publicDir);
    files.forEach(file => {
      const srcFile = path.join(publicDir, file);
      const destFile = path.join(distDir, file);
      if (fs.statSync(srcFile).isFile()) {
        fs.copyFileSync(srcFile, destFile);
      }
    });
  }
}

function build() {
  console.log('🚀 Starting Web App Build...');
  const startTime = Date.now();

  const finalHtml = generateHtml();
  const indexPath = path.join(distDir, 'index.html');
  fs.writeFileSync(indexPath, finalHtml, 'utf8');
  fs.writeFileSync(path.join(rootDir, 'index.html'), finalHtml, 'utf8');

  copyPublicAssets();

  const lines = finalHtml.split('\n').length;
  const sizeKB = (Buffer.byteLength(finalHtml, 'utf8') / 1024).toFixed(2);
  console.log(`✅ [dist/index.html] generated successfully! (${lines} lines, ${sizeKB} KB)`);
  if (fs.existsSync(path.join(distDir, 'sw.js'))) {
    console.log(`✅ [dist/sw.js] Service Worker cached & deployed!`);
  }

  const elapsed = Date.now() - startTime;
  console.log(`✨ Build finished in ${elapsed}ms\n`);

  return finalHtml;
}

if (require.main === module) {
  build();
}

module.exports = {
  build,
  generateHtml,
  resolveIncludes,
  srcDir,
  distDir
};
