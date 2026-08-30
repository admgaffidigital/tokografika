const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, 'dist');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Function to resolve @include directives recursively
function resolveIncludes(filePath, baseDir = srcDir, visited = new Set()) {
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(baseDir, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`[BUILD ERROR] File not found: ${fullPath}`);
    return `<!-- FILE NOT FOUND: ${filePath} -->`;
  }

  if (visited.has(fullPath)) {
    console.warn(`[BUILD WARNING] Circular include detected: ${fullPath}`);
    return '';
  }
  visited.add(fullPath);

  let content = fs.readFileSync(fullPath, 'utf8');
  const currentDir = path.dirname(fullPath);

  // Regex patterns for various include comment styles:
  // 1. <!-- @include path/to/file -->
  // 2. /* @include path/to/file */
  // 3. // @include path/to/file
  const includeRegex = /(?:<!--|\/\*|\/\/)\s*@include\s+['"]?([^'"\s*>-]+)['"]?\s*(?:-->|\*\/)?/g;

  content = content.replace(includeRegex, (match, includeTarget) => {
    return resolveIncludes(includeTarget.trim(), currentDir, new Set(visited));
  });

  return content;
}

function generateThemeXml() {
  const entryTemplate = path.join(srcDir, 'template.xml');
  if (!fs.existsSync(entryTemplate)) {
    throw new Error('src/template.xml not found!');
  }

  let finalXml = resolveIncludes('template.xml', srcDir);
  
  // XML 1.0 Compliance: Double hyphen (--) is strictly forbidden inside comments
  finalXml = finalXml.replace(/<!--([\s\S]*?)-->/g, (match, commentBody) => {
    let clean = commentBody;
    while (clean.includes('--')) {
      clean = clean.replace(/--/g, '==');
    }
    return `<!--${clean}-->`;
  });

  return finalXml;
}

function generatePreviewHtml(xmlContent) {
  const finalXml = xmlContent || generateThemeXml();
  let previewHtml = finalXml;
  // Remove Blogger XML declaration & namespace for browser preview compatibility
  previewHtml = previewHtml.replace(/<\?xml[^>]*\?>/i, '');
  // Replace <data:blog.pageTitle/> with sample title
  previewHtml = previewHtml.replace(/<data:blog\.pageTitle\s*\/>/gi, 'Freshmart PWA - Local Preview');
  return previewHtml;
}

function build() {
  console.log('🚀 Starting Blogger Theme Build...');
  const startTime = Date.now();

  const finalXml = generateThemeXml();
  const themeXmlPath = path.join(distDir, 'theme.xml');
  fs.writeFileSync(themeXmlPath, finalXml, 'utf8');

  const lines = finalXml.split('\n').length;
  const sizeKB = (Buffer.byteLength(finalXml, 'utf8') / 1024).toFixed(2);
  console.log(`✅ [dist/theme.xml] built successfully! (${lines} lines, ${sizeKB} KB)`);

  const previewHtml = generatePreviewHtml(finalXml);
  const previewHtmlPath = path.join(distDir, 'preview.html');
  fs.writeFileSync(previewHtmlPath, previewHtml, 'utf8');
  console.log(`✅ [dist/preview.html] generated for local testing!`);

  const elapsed = Date.now() - startTime;
  console.log(`✨ Build finished in ${elapsed}ms\n`);

  return { finalXml, previewHtml };
}

module.exports = { 
  build, 
  generateThemeXml, 
  generatePreviewHtml, 
  resolveIncludes,
  srcDir,
  distDir,
  rootDir
};

if (require.main === module) {
  build();
}
