const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const genPath = path.join(process.cwd(), 'types', 'generated-db.ts');
const targetPath = path.join(process.cwd(), 'types', 'db.ts');

if (!fs.existsSync(genPath)) {
  console.error('generated-db.ts not found. Run gen:types first.');
  process.exit(1);
}
if (!fs.existsSync(targetPath)) {
  console.error('types/db.ts not found.');
  process.exit(1);
}

const genCode = fs.readFileSync(genPath, 'utf8');
const targetCode = fs.readFileSync(targetPath, 'utf8');

const genSrc = ts.createSourceFile(genPath, genCode, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
const targetSrc = ts.createSourceFile(targetPath, targetCode, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);

// collect interfaces from generated file
const genIfaces = new Map();
for (const stmt of genSrc.statements) {
  if (ts.isInterfaceDeclaration(stmt) && stmt.name && stmt.name.escapedText) {
    genIfaces.set(String(stmt.name.escapedText), stmt);
  }
}

// create transformer to replace matching interfaces in target
function transformer(context) {
  const { factory } = context;
  return function visit(node) {
    if (ts.isSourceFile(node)) {
      const statements = node.statements.map(stmt => {
        if (ts.isInterfaceDeclaration(stmt) && stmt.name && stmt.name.escapedText) {
          const name = String(stmt.name.escapedText);
          if (genIfaces.has(name)) {
            // use the generated node, but preserve leading/trailing trivia via factory updates
            const genNode = genIfaces.get(name);
            // preserve modifiers (export) if present in either
            const modifiers = stmt.modifiers || genNode.modifiers;
            const newNode = factory.updateInterfaceDeclaration(
              genNode,
              modifiers,
              genNode.name,
              genNode.typeParameters,
              genNode.heritageClauses,
              genNode.members
            );
            ts.setOriginalNode(newNode, genNode);
            return newNode;
          }
        }
        return stmt;
      });
      return factory.updateSourceFile(node, statements);
    }
    return ts.visitEachChild(node, visit, context);
  };
}

const result = ts.transform(targetSrc, [transformer]);
const transformed = result.transformed[0];
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
const newCode = printer.printFile(transformed);

// backup
const backupPath = targetPath + '.bak.' + Date.now();
fs.copyFileSync(targetPath, backupPath);
fs.writeFileSync(targetPath, newCode, 'utf8');
console.log('Backup created at', backupPath);
console.log('Merged interfaces from generated-db.ts into types/db.ts');
