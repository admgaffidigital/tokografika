const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..', 'src');
const htmlContent = fs.readFileSync(path.join(srcDir, 'components', 'body.html'), 'utf8');
const jsContent = fs.readFileSync(path.join(srcDir, 'js', 'app.js'), 'utf8');
const xmlContent = fs.readFileSync(path.join(srcDir, 'template.xml'), 'utf8');

console.log('=== 1. AUDIT: EVENT HANDLERS IN HTML VS JS FUNCTIONS ===');
const inlineEventRegex = /on(?:click|change|submit|input|keydown|keyup|keypress|load|error)=['"]([^'"]+)['"]/gi;
const calledFunctions = new Set();
let match;

while ((match = inlineEventRegex.exec(htmlContent)) !== null) {
  const handlerCode = match[1];
  // extract function names like myFunction() or myFunction(event)
  const fnMatches = handlerCode.match(/([a-zA-Z0-9_$]+)\s*\(/g);
  if (fnMatches) {
    fnMatches.forEach(f => {
      const name = f.replace('(', '').trim();
      if (!['if', 'for', 'while', 'switch', 'alert', 'confirm', 'prompt', 'parseInt', 'parseFloat', 'Number', 'String', 'Boolean', 'console'].includes(name)) {
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

// Extract all actual IDs in HTML & XML
const actualIds = new Set();
const idAttrRegex = /\bid=['"]([^'"]+)['"]/g;
while ((match = idAttrRegex.exec(htmlContent)) !== null) {
  actualIds.add(match[1]);
}
while ((match = idAttrRegex.exec(xmlContent)) !== null) {
  actualIds.add(match[1]);
}

const missingIds = [];
referencedIds.forEach(id => {
  // Also check if dynamically created in JS
  const createdInJs = jsContent.includes(`id='${id}'`) || jsContent.includes(`id="${id}"`) || jsContent.includes(`id=\\'${id}\\'`);
  if (!actualIds.has(id) && !createdInJs) {
    missingIds.push(id);
  }
});

console.log(`Total DOM IDs referenced in JS: ${referencedIds.size}`);
console.log(`Total DOM IDs found in HTML: ${actualIds.size}`);
if (missingIds.length > 0) {
  console.log('⚠️ DOM IDs referenced in JS but NOT found in HTML/templates:', missingIds);
} else {
  console.log('✅ All JS DOM ID references exist in HTML!');
}

console.log('\n=== 3. AUDIT: FIREBASE INITIALIZATION & CREDENTIALS ===');
console.log('Is firebase.initializeApp present in app.js?', jsContent.includes('firebase.initializeApp'));
console.log('Is firebaseConfig present in app.js?', jsContent.includes('firebaseConfig'));
console.log('Is db / firestore initialized in app.js?', jsContent.includes('firebase.firestore()') || jsContent.includes('const db') || jsContent.includes('let db') || jsContent.includes('var db'));

console.log('\n=== 4. AUDIT: LOCALSTORAGE & RUNTIME SAFETY ===');
const lsRegex = /localStorage\.(?:getItem|setItem|removeItem)\s*\(\s*['"]([^'"]+)['"]/g;
const lsKeys = new Set();
while ((match = lsRegex.exec(jsContent)) !== null) {
  lsKeys.add(match[1]);
}
console.log('LocalStorage keys used:', Array.from(lsKeys));
