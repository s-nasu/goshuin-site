// shim to run TypeScript entry with node-friendly command
require('ts-node').register({ transpileOnly: true });
const mod = require('./index.ts');
// If the loaded module has a default export (ESM transpiled), expose it as module.exports.default
if (mod && typeof mod === 'object' && 'default' in mod) {
	module.exports = mod;
} else {
	module.exports = { default: mod };
}
