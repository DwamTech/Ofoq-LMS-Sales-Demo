import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const stage = process.argv[2] === 'final' ? 'final' : 'baseline';
const out = resolve('artifacts/mansatak-approved');
await mkdir(out, { recursive: true });
const run = args => spawnSync(process.execPath, args, { encoding: 'utf8', windowsHide: true, maxBuffer: 30_000_000 });
const ts = run(['node_modules/typescript/bin/tsc', '--noEmit', '--pretty', 'false']);
const lint = run(['node_modules/eslint/bin/eslint.js', 'app', 'components', 'utils', 'lib', '-f', 'json']);
const jest = run(['node_modules/jest/bin/jest.js', '--runInBand']);
const records = JSON.parse(lint.stdout);
const result = {
  typescript: ts.stdout.split(/\r?\n/).filter(line => line.includes('error TS')),
  lint: { errors: records.reduce((n, r) => n + r.errorCount, 0), warnings: records.reduce((n, r) => n + r.warningCount, 0) },
  jest: { exitCode: jest.status, summary: (jest.stdout + jest.stderr).split(/\r?\n/).filter(line => /^Tests:|^Test Suites:/.test(line)) },
};
await writeFile(resolve(out, stage + '-typescript.log'), ts.stdout + ts.stderr);
await writeFile(resolve(out, stage + '-eslint.json'), lint.stdout);
await writeFile(resolve(out, stage + '-jest.log'), jest.stdout + jest.stderr);
await writeFile(resolve(out, stage + '.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ ...result, typescript: result.typescript.length }));
