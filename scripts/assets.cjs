// Bundles and runs scripts/assets/cli.ts (same esbuild approach as the test checks).
// Usage: node scripts/assets.cjs build|validate|inspect [kind/id]
const { execFileSync } = require('node:child_process');
const { createRequire } = require('node:module');
const os = require('node:os');
const path = require('node:path');
const root = path.join(__dirname, '..');
// esbuild ships as a dependency of vite and is not always hoisted into node_modules/.bin.
const esbuild = createRequire(require.resolve('vite', { paths: [root] }))('esbuild');
const out = path.join(os.tmpdir(), 'rst-assets-cli.cjs');
esbuild.buildSync({ entryPoints: [path.join(root, 'scripts/assets/cli.ts')], bundle: true, platform: 'node', format: 'cjs', outfile: out, alias: { '@': path.join(root, 'src') }, logLevel: 'warning' });
try {
  execFileSync(process.execPath, [out, ...process.argv.slice(2)], { cwd: root, stdio: 'inherit' });
} catch (e) { process.exit(e.status || 1); }
