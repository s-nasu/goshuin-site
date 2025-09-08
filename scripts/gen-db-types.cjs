const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

(async function main(){
  const dbPath = path.join(process.cwd(), 'db', 'goshuin.sqlite3');
  if (!fs.existsSync(dbPath)) {
    console.error('Database file not found at', dbPath);
    process.exit(1);
  }
  const db = new sqlite3.Database(dbPath);
  const rows = await new Promise((resolve, reject) => {
    db.all("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';", (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
  const interfaces = [];
  for (const row of rows) {
    const name = row.name;
    // use PRAGMA table_info to get precise column data
    const colsInfo = await new Promise((resolve, reject) => {
      db.all(`PRAGMA table_info(${name});`, (err, r) => {
        if (err) return reject(err);
        resolve(r);
      });
    });
    const fields = [];
    for (const colInfo of colsInfo) {
      // colInfo: { cid, name, type, notnull, dflt_value, pk }
      const colName = colInfo.name;
      const colTypeRaw = (colInfo.type || '').toUpperCase();
      let tsType = 'string';
      if (colTypeRaw.includes('INT')) tsType = 'number';
      else if (colTypeRaw.includes('DECIMAL') || colTypeRaw.includes('NUM') || colTypeRaw.includes('REAL') || colTypeRaw.includes('FLOAT')) tsType = 'number';
      else if (colTypeRaw.includes('DATE') || colTypeRaw.includes('TIME')) tsType = 'string';
      const notnull = !!colInfo.notnull;
      fields.push(`  ${colName}${notnull ? '' : '?'}: ${tsType};`);
    }
    const ifaceName = name.replace(/(?:^|_)([a-z])/g, (_, c) => c.toUpperCase());
    interfaces.push(`export interface ${ifaceName} {\n${fields.join('\n')}\n}\n`);
  }
  const out = `// generated file - do not edit\n\n${interfaces.join('\n')}`;
  const outPath = path.join(process.cwd(), 'types', 'generated-db.ts');
  fs.writeFileSync(outPath, out, 'utf8');
  console.log('Wrote', outPath);
  db.close();
})();
