/**
 * Preflight Automated Script: test-babel-admin.js
 * Extracts and parses all <script type="text/babel"> blocks in all web HTML files
 * using @babel/parser to ensure 0 syntax or JSX compilation errors.
 */

const fs = require('fs');
const path = require('path');
const babelParser = require('@babel/parser');

const WEB_DIR = path.join(__dirname, '..', 'web');

const htmlFiles = [
  'index.html',
  'admin.html',
  'product-editor.html',
  'maintenance.html'
];

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  ARALIYA ATELIER: BABEL JSX SYNTAX PREFLIGHT TEST');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

let totalScriptsChecked = 0;
let hasErrors = false;

htmlFiles.forEach(fileName => {
  const filePath = path.join(WEB_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    console.warn(`[WARN] File not found: ${fileName}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  // Match <script type="text/babel">...</script>
  const scriptRegex = /<script\s+type=["']text\/babel["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let scriptIndex = 1;

  while ((match = scriptRegex.exec(content)) !== null) {
    totalScriptsChecked++;
    const code = match[1];

    try {
      babelParser.parse(code, {
        sourceType: 'module',
        plugins: ['jsx']
      });
      console.log(`✓ [PASS] ${fileName} (Babel Script #${scriptIndex}) - Syntax & JSX valid`);
    } catch (err) {
      hasErrors = true;
      console.error(`✗ [FAIL] ${fileName} (Babel Script #${scriptIndex}) Syntax Error at Line ${err.loc ? err.loc.line : '?'}, Col ${err.loc ? err.loc.column : '?'}:`);
      console.error(`  ${err.message}`);
    }
    scriptIndex++;
  }
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (hasErrors) {
  console.error(`Preflight Failed: Syntax errors detected in inline Babel scripts.`);
  process.exit(1);
} else {
  console.log(`Preflight Passed: All ${totalScriptsChecked} inline Babel scripts validated with 0 errors!`);
  process.exit(0);
}
