const fs = require('fs');
const path = require('path');

const genPath = path.join(process.cwd(), 'types', 'generated-db.ts');
const targetPath = path.join(process.cwd(), 'types', 'db.ts');

if (!fs.existsSync(genPath)) {
  console.error('generated-db.ts not found. Run npm run gen:types first.');
  process.exit(2);
}
if (!fs.existsSync(targetPath)) {
  console.error('types/db.ts not found.');
  process.exit(2);
}

const gen = fs.readFileSync(genPath, 'utf8').replace(/\r\n/g,'\n').trim();
const target = fs.readFileSync(targetPath, 'utf8').replace(/\r\n/g,'\n').trim();

if (gen === target) {
  console.log('generated-db.ts and types/db.ts are identical');
  process.exit(0);
}

console.error('Mismatch between generated-db.ts and types/db.ts');

// show a small diff-like hint
const genLines = gen.split('\n');
const tgtLines = target.split('\n');
for (let i = 0; i < Math.max(genLines.length, tgtLines.length); i++) {
  const g = genLines[i] || '';
  const t = tgtLines[i] || '';
  if (g !== t) {
    console.error(`- generated: ${g}`);
    console.error(`+ current:   ${t}`);
    if (i > 20) break; // avoid huge output
  }
}

process.exit(1);
