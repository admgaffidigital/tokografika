const fs = require('fs');
const path = require('path');

const themeXml = fs.readFileSync(path.resolve(__dirname, '..', 'dist', 'theme.xml'), 'utf8');

console.log('=== BLOGGER XML VALIDATION ===');

// Check 1: Unclosed CDATA
const cdataOpen = (themeXml.match(/<!\[CDATA\[/g) || []).length;
const cdataClose = (themeXml.match(/\]\]>/g) || []).length;
console.log(`CDATA tags: ${cdataOpen} opened, ${cdataClose} closed. ${cdataOpen === cdataClose ? '✅ Balanced' : '❌ UNBALANCED!'}`);

// Check 2: Blogger namespace and root tag
console.log('Has xmlns:b?', themeXml.includes("xmlns:b='http://www.google.com/2005/gml/b'") || themeXml.includes('xmlns:b="http://www.google.com/2005/gml/b"'));
console.log('Has <b:skin>?', themeXml.includes('<b:skin>'));
console.log('Has <b:section>?', themeXml.includes('<b:section'));

// Check 3: Check for unescaped ampersands outside CDATA
let stripped = themeXml.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');
stripped = stripped.replace(/<!--[\s\S]*?-->/g, '');

const badAmpMatches = [];
const ampRegex = /&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g;
let match;
while ((match = ampRegex.exec(stripped)) !== null) {
  const snippet = stripped.substring(Math.max(0, match.index - 20), Math.min(stripped.length, match.index + 30));
  badAmpMatches.push({ index: match.index, snippet: snippet.replace(/\n/g, ' ') });
}

if (badAmpMatches.length > 0) {
  console.log(`⚠️ Found ${badAmpMatches.length} unescaped '&' outside CDATA (Blogger may reject these):`);
  badAmpMatches.slice(0, 10).forEach(m => console.log('  ->', m.snippet));
} else {
  console.log('✅ No unescaped & found outside CDATA!');
}

// Check 4: Check for unclosed HTML void tags in XML outside CDATA
const voidTags = ['img', 'input', 'br', 'hr', 'meta', 'link'];
const unclosedTags = [];
voidTags.forEach(tag => {
  const re = new RegExp(`<${tag}\\b([^>]*?)(?<!/)>`, 'gi');
  let m;
  while ((m = re.exec(stripped)) !== null) {
    unclosedTags.push({ tag, match: m[0] });
  }
});

if (unclosedTags.length > 0) {
  console.log(`⚠️ Found ${unclosedTags.length} unclosed void tags (should be self-closing <${unclosedTags[0].tag} /> for XML):`);
  unclosedTags.slice(0, 10).forEach(u => console.log('  ->', u.match));
} else {
  console.log('✅ All void tags are properly self-closed (<img />, <input />, <link />, etc.)!');
}

// Check 5: Blogger section & widget tags pairing
const bSectionOpen = (themeXml.match(/<b:section\b/g) || []).length;
const bSectionClose = (themeXml.match(/<\/b:section>/g) || []).length;
if (bSectionOpen !== bSectionClose) {
  console.error(`❌ ERROR: <b:section> tag mismatch! Opened: ${bSectionOpen}, Closed: ${bSectionClose}`);
  process.exit(1);
} else {
  console.log(`✅ <b:section> tags balanced (${bSectionOpen} pairs)`);
}
