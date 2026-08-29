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

// Check 6: XML comments must not contain '--'
const commentMatches = themeXml.match(/<!--([\s\S]*?)-->/g) || [];
const invalidComments = commentMatches.filter(c => c.slice(4, -3).includes('--'));
if (invalidComments.length > 0) {
  console.error(`❌ ERROR: Found ${invalidComments.length} XML comments containing '--'!`);
  process.exit(1);
} else {
  console.log(`✅ All ${commentMatches.length} XML comments are valid (no '--' inside)`);
}

// Check 7: Full XML tag balance (hierarchy, no unclosed/mismatched tags)
const tagValidationXml = themeXml
  .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, m => ' '.repeat(m.length))
  .replace(/<!--[\s\S]*?-->/g, m => ' '.repeat(m.length));

const tagRegex = /<\/?([a-zA-Z0-9:_-]+)(?:\s+[^>]*?)?(\/?)>/g;
let stack = [];
let matchTag;
let line = 1;
let lastIdx = 0;
let tagErrors = [];

while ((matchTag = tagRegex.exec(tagValidationXml)) !== null) {
  const fullTag = matchTag[0];
  const tagName = matchTag[1];
  const isSelfClosing = matchTag[2] === '/' || fullTag.endsWith('/>');
  const isClosing = fullTag.startsWith('</');
  
  const textBefore = tagValidationXml.substring(lastIdx, matchTag.index);
  line += (textBefore.match(/\n/g) || []).length;
  lastIdx = matchTag.index;

  if (fullTag.startsWith('<?') || fullTag.startsWith('<!')) continue;

  if (isClosing) {
    if (stack.length === 0) {
      tagErrors.push(`Unexpected closing </${tagName}> at line ${line}`);
    } else {
      const top = stack.pop();
      if (top.tagName !== tagName) {
        tagErrors.push(`Tag mismatch at line ${line}: expected </${top.tagName}> (from line ${top.line}) but found </${tagName}>`);
      }
    }
  } else if (!isSelfClosing) {
    stack.push({ tagName, line, fullTag: fullTag.substring(0, 50) });
  }
}

if (tagErrors.length > 0 || stack.length > 0) {
  console.error(`❌ ERROR: XML Tag Structure is invalid!`);
  tagErrors.forEach(e => console.error('  ->', e));
  stack.forEach(s => console.error(`  -> Unclosed <${s.tagName}> from line ${s.line}`));
  process.exit(1);
} else {
  console.log('✅ Full XML Tag Structure & Hierarchy is 100% balanced (0 unclosed tags, 0 mismatches)!');
}

