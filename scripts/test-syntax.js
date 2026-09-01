const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('dist/index.html', 'utf8');

const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;

while ((match = scriptRegex.exec(html)) !== null) {
  count++;
  const jsCode = match[1].trim();
  if (!jsCode) continue;

  const beforeMatch = html.substring(0, match.index);
  const startLine = beforeMatch.split('\n').length;
  console.log(`Checking script #${count} starting at line ${startLine}...`);

  try {
    new vm.Script(jsCode, { filename: `script_${count}.js`, lineOffset: startLine - 1 });
    console.log(`✅ Script #${count} is syntactically valid!`);
  } catch (err) {
    console.error(`❌ Syntax error in script #${count}:`, err.message);
    console.error(err.stack);
  }
}
