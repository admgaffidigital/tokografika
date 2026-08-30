const fs = require('fs');
const path = require('path');
const { resolveIncludes, srcDir } = require('./build');

const htmlContent = resolveIncludes('components/body.html', srcDir);
const jsContent = resolveIncludes('js/app.js', srcDir);
const mainHtmlContent = resolveIncludes('index.html', srcDir);

console.log('=== 1. AUDIT: EVENT HANDLERS IN HTML VS JS FUNCTIONS ===');
const inlineEventRegex = /on(?:click|change|submit|input|keydown|keyup|keypress|load|error)=['"]([^'"]+)['"]/gi;
const calledFunctions = new Set();
const builtInNames = new Set([
  'if', 'for', 'while', 'switch', 'alert', 'confirm', 'prompt', 
  'parseInt', 'parseFloat', 'Number', 'String', 'Boolean', 'console',
  'back', 'forward', 'go', 'stopPropagation', 'preventDefault', 'reload', 'focus', 'blur', 'select', 'submit', 'reset'
]);
let match;

while ((match = inlineEventRegex.exec(htmlContent)) !== null) {
  const handlerCode = match[1];
  // extract function names like myFunction() or myFunction(event)
  const fnMatches = handlerCode.match(/([a-zA-Z0-9_$]+)\s*\(/g);
  if (fnMatches) {
    fnMatches.forEach(f => {
      const name = f.replace('(', '').trim();
      if (!builtInNames.has(name)) {
        calledFunctions.add(name);
      }
    });
  }
}

const missingFunctions = [];
calledFunctions.forEach(fn => {
  // Check if defined in JS (function fn, window.fn =, const fn =, let fn =, var fn =)
  const re = new RegExp(`(?:function\\s+${fn}\\b|window\\.${fn}\\s*=|const\\s+${fn}\\s*=|let\\s+${fn}\\s*=|var\\s+${fn}\\s*=)`, 'g');
  if (!re.test(jsContent)) {
    missingFunctions.push(fn);
  }
});

console.log(`Total event handler functions checked: ${calledFunctions.size}`);
if (missingFunctions.length > 0) {
  console.log('⚠️ Potentially missing JS functions in HTML:', missingFunctions);
} else {
  console.log('✅ All HTML event handlers have matching JS functions!');
}

console.log('\n=== 2. AUDIT: DOM IDs REFERENCED IN JS VS HTML ===');
const getElementRegex = /(?:document\.getElementById|el)\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
const referencedIds = new Set();

while ((match = getElementRegex.exec(jsContent)) !== null) {
  const id = match[1];
  // Ignore dynamic ID patterns with template literals or interpolation
  if (!id.includes('${') && !id.includes('+')) {
    referencedIds.add(id);
  }
}

const missingIds = [];
referencedIds.forEach(id => {
  // Search for id="..." in HTML and index.html
  const idPattern = new RegExp(`id=['"]${id}['"]`, 'i');
  if (!idPattern.test(htmlContent) && !idPattern.test(mainHtmlContent)) {
    // Check if dynamically created or known
    missingIds.push(id);
  }
});

console.log(`Total DOM IDs referenced in JS: ${referencedIds.size}`);
const totalHtmlIds = (htmlContent.match(/id=['"][^'"]+['"]/gi) || []).length;
console.log(`Total DOM IDs found in HTML: ${totalHtmlIds}`);

if (missingIds.length > 0) {
  console.log('⚠️ DOM IDs in JS not found as static HTML elements (may be rendered dynamically):', missingIds);
} else {
  console.log('✅ All JS DOM ID references exist in HTML!');
}

console.log('\n=== 3. AUDIT: FIREBASE INITIALIZATION & CREDENTIALS ===');
console.log('Is firebase.initializeApp present in app.js?', jsContent.includes('firebase.initializeApp'));
console.log('Is firebaseConfig present in app.js?', jsContent.includes('firebaseConfig'));
console.log('Is db / firestore initialized in app.js?', jsContent.includes('db = firebase.firestore()') || jsContent.includes('firebase.firestore()'));

console.log('\n=== 4. AUDIT: LOCALSTORAGE & RUNTIME SAFETY ===');
const storageKeys = new Set();
const lsRegex = /localStorage\.(?:getItem|setItem|removeItem)\s*\(\s*['"`]([^'"`]+)['"`]/g;
while ((match = lsRegex.exec(jsContent)) !== null) {
  storageKeys.add(match[1]);
}
console.log('LocalStorage keys used:', Array.from(storageKeys));
console.log('\n✨ Audit completed successfully!');
