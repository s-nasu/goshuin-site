const fs = require('fs');
const path = require('path');

const genPath = path.join(process.cwd(), 'types', 'generated-db.ts');
const targetPath = path.join(process.cwd(), 'types', 'db.ts');
const backupPath = path.join(process.cwd(), 'types', `db.ts.bak.${Date.now()}`);

if (!fs.existsSync(genPath)) {
  console.error('generated-db.ts not found. Run gen:types first.');
  process.exit(1);
}
if (!fs.existsSync(targetPath)) {
  console.error('types/db.ts not found.');
  process.exit(1);
}

const gen = fs.readFileSync(genPath, 'utf8');
const target = fs.readFileSync(targetPath, 'utf8');

// parse interfaces from generated file: naive regex to capture interface blocks
const ifaceRegex = /export interface\s+(\w+)\s*{([\s\S]*?)}/g;
let m;
const genIfaces = {};
while ((m = ifaceRegex.exec(gen)) !== null) {
  genIfaces[m[1]] = m[0];
}

// Backup target
fs.copyFileSync(targetPath, backupPath);
console.log('Backed up', targetPath, 'to', backupPath);

let out = target;
for (const name of Object.keys(genIfaces)) {
  const re = new RegExp(`export interface\\s+${name}\\s*{[\\s\\S]*?}`, 'g');
  if (re.test(out)) {
    out = out.replace(re, genIfaces[name]);
    console.log('Replaced interface', name);
  } else {
    // append
    out += '\n\n' + genIfaces[name];
    console.log('Appended interface', name);
  }
}

fs.writeFileSync(targetPath, out, 'utf8');
console.log('Merged generated types into', targetPath);
