const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('dist/index.html', 'utf8');

// 1. Extract and test <script> tags
const scripts = html.match(/<script[\s\S]*?<\/script>/gi) || [];
console.log('Found ' + scripts.length + ' script tags');
for (const s of scripts) {
  const code = s.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
  if (code.trim()) {
    try {
      new vm.Script(code);
    } catch(e) {
      console.error('Script block error:', e.message);
      process.exit(1);
    }
  }
}
console.log('✓ All script blocks passed syntax check!');

// 2. Remove script tags before checking static HTML handlers
const htmlWithoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, '');

const regex = /\s(on[a-z]+)=("[^"]*"|'[^']*')/gi;
let match;
let handlerCount = 0;
while ((match = regex.exec(htmlWithoutScripts)) !== null) {
  const attr = match[1];
  let val = match[2].slice(1, -1);
  val = val.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  handlerCount++;
  try {
    new vm.Script('(function(event){ ' + val + '\n})');
  } catch(e) {
    console.error('Handler error in ' + attr + '="' + val + '":', e.message);
    process.exit(1);
  }
}
console.log('✓ All ' + handlerCount + ' static inline handlers passed syntax check!');
