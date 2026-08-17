/**
 * Build the host lib (ESM, node) and the browser bundle (CJS factory handed
 * to window.__ModuleLoader__.load). External packages are resolved by the
 * harness at runtime (the loader's require / install anchor).
 */
import { build } from 'esbuild'
import { rmSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const PACKAGE_NAME = 'dsh-usage-dashboard'
const EXTERNAL = ['@deepseek-ai/*', 'react', 'react-dom', 'zod', 'clsx']

rmSync('lib', { recursive: true, force: true })
mkdirSync('lib', { recursive: true })

// ---- host half: plain ESM bundle (loaded by the Node-side loader) ----
await build({
  entryPoints: ['src/index.js'],
  outfile: 'lib/index.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'es2022',
  external: EXTERNAL,
  sourcemap: true,
  logLevel: 'info',
})

// ---- client half: CJS bundle wrapped in the ModuleLoader handoff ----
await build({
  entryPoints: ['src/client/index.js'],
  outfile: 'lib/client.bundle.js',
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  external: EXTERNAL,
  sourcemap: false,
  logLevel: 'info',
})

const body = readFileSync('lib/client.bundle.js', 'utf8')
const wrapped = [
  `window.__ModuleLoader__.load({ id: ${JSON.stringify(PACKAGE_NAME)}, factory: (require) => {`,
  '  var module = { exports: {} };',
  '  var exports = module.exports;',
  body,
  '  return module.exports;',
  '} })',
  '',
].join('\n')
writeFileSync('lib/client.js', wrapped)
rmSync('lib/client.bundle.js', { force: true })

console.log('built lib/index.js + lib/client.js')
