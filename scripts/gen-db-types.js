const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

(async function main(){
  const dbPath = path.join(process.cwd(), 'db', 'goshuin.sqlite3');
  if (!fs.existsSync(dbPath)) {
    console.error('Database file not found at', dbPath);
    process.exit(1);
  }
  const db = await open({ filename: dbPath, driver: sqlite3.Database });

  const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
  const interfaces = [];
  for (const t of tables) {
    const name = t.name;
    const cols = await db.all(`PRAGMA table_info(${name});`);
    const fields = [];
    for (const c of cols) {
      const colName = c.name;
      const colTypeRaw = (c.type || '').toUpperCase().trim();
      // Remove any parameters, e.g. DECIMAL(10,8) -> DECIMAL
      const colType = colTypeRaw.replace(/\(.+\)/, '').trim();
      let tsType = 'string';
      if (
        colType.includes('INT') ||
        colType.includes('INTEGER') ||
        colType.includes('FLOAT') ||
        colType.includes('DOUBLE') ||
        colType.includes('DECIMAL') ||
        colType.includes('NUMERIC') ||
        colType.includes('REAL')
      ) {
        tsType = 'number';
      } else if (colType.includes('DATE') || colType.includes('TIME')) {
        tsType = 'string';
      }
      const optional = c.notnull === 0 ? '?' : '';
      fields.push(`  ${colName}${optional}: ${tsType};`);
    }
    const ifaceName = name.replace(/(?:^|_)([a-z])/g, (_, c) => c.toUpperCase());
    interfaces.push(`export interface ${ifaceName} {\n${fields.join('\n')}\n}\n`);
  }

  const out = `// generated file - do not edit\n\n${interfaces.join('\n')}`;
  const outPath = path.join(process.cwd(), 'types', 'generated-db.ts');
  fs.writeFileSync(outPath, out, 'utf8');
  console.log('Wrote', outPath);
  await db.close();
})();
