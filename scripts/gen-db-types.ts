import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function main() {
  const dbPath = path.join(process.cwd(), 'db', 'goshuin.sqlite3');
  if (!fs.existsSync(dbPath)) {
    console.error('Database file not found at', dbPath);
    process.exit(1);
  }
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  const rows = await db.all(`SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';`);

  const interfaces: string[] = [];

  for (const row of rows) {
    const name = row.name as string;
    const sql = (row.sql as string) || '';
    // crude parse: find column definitions between parentheses
    const colsMatch = sql.match(/\(([\s\S]*)\)/);
    if (!colsMatch) continue;
    const colsSql = colsMatch[1];
    const cols = colsSql.split(/,\s*/).map(s => s.trim()).filter(Boolean);
    const fields: string[] = [];
    for (const col of cols) {
      // simplistic: capture "name TYPE"
      const m = col.match(/^"?([a-zA-Z0-9_]+)"?\s+([A-Z]+)/i);
      if (!m) continue;
      const colName = m[1];
      const colTypeRaw = m[2].toUpperCase();
      let tsType = 'string';
      if (colTypeRaw.includes('INT')) tsType = 'number';
      else if (colTypeRaw.includes('DECIMAL') || colTypeRaw.includes('NUM') || colTypeRaw.includes('REAL')) tsType = 'number';
      else if (colTypeRaw.includes('DATE') || colTypeRaw.includes('TIME')) tsType = 'string';
      fields.push(`  ${colName}${col.includes('NOT NULL') ? '' : '?'}: ${tsType};`);
    }
    const ifaceName = name.replace(/(?:^|_)([a-z])/g, (_, c) => c.toUpperCase());
    interfaces.push(`export interface ${ifaceName} {\n${fields.join('\n')}\n}\n`);
  }

  const out = `// generated file - do not edit\n\n${interfaces.join('\n')}`;
  const outPath = path.join(process.cwd(), 'types', 'generated-db.ts');
  fs.writeFileSync(outPath, out, 'utf8');
  console.log('Wrote', outPath);
  await db.close();
}

main().catch(err => { console.error(err); process.exit(1); });
