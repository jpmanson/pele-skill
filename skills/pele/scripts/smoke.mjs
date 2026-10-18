#!/usr/bin/env node
// Render the bundled examples and one known-bad source. Exit non-zero on failure.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const skillRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const render = join(skillRoot, 'scripts', 'render.mjs');
const outDir = mkdtempSync(join(tmpdir(), 'pele-skill-'));

function run(args, input) {
  return spawnSync(process.execPath, [render, ...args], {
    cwd: skillRoot,
    encoding: 'utf8',
    input,
  });
}

function receipt(result) {
  const line = (result.stderr || '').trim().split('\n').filter(Boolean).pop();
  if (!line) {
    console.error(result.stderr || result.stdout || 'no receipt');
    process.exit(1);
  }
  return JSON.parse(line);
}

function assertSvg(path, type) {
  const svg = readFileSync(path, 'utf8');
  if (!svg.startsWith('<svg')) {
    console.error(`${path} does not start with <svg`);
    process.exit(1);
  }
  if (!svg.includes('</svg>')) {
    console.error(`${path} is not closed`);
    process.exit(1);
  }
  return { bytes: Buffer.byteLength(svg), type };
}

const check = run(['--check']);
const checkReceipt = receipt(check);
if (check.status !== 0 || !checkReceipt.ok || !checkReceipt.pele) {
  console.error(checkReceipt);
  process.exit(1);
}

const cases = [
  ['examples/flowchart.mmd', 'flow.svg', 'flowchart'],
  ['examples/sequence.mmd', 'seq.svg', 'sequence'],
];
const rendered = [];
for (const [input, name, type] of cases) {
  const output = join(outDir, name);
  const result = run([join(skillRoot, input), output]);
  const got = receipt(result);
  if (result.status !== 0 || !got.ok || got.type !== type) {
    console.error(input, got);
    process.exit(1);
  }
  const file = assertSvg(output, type);
  rendered.push({ input, type: got.type, width: got.width, height: got.height, bytes: file.bytes });
}

const fenced = run(['-', join(outDir, 'fenced.svg')], '```mermaid\nflowchart LR\n  A --> B\n```\n');
const fencedReceipt = receipt(fenced);
if (fenced.status !== 0 || fencedReceipt.type !== 'flowchart') {
  console.error(fencedReceipt);
  process.exit(1);
}

const html = run(['--html', join(skillRoot, 'examples/flowchart.mmd'), join(outDir, 'out.html')]);
const htmlReceipt = receipt(html);
const htmlBody = readFileSync(join(outDir, 'out.html'), 'utf8');
if (html.status !== 0 || !htmlReceipt.html || !htmlBody.includes('<svg') || !htmlBody.includes('--pele-bg')) {
  console.error(htmlReceipt);
  process.exit(1);
}

const bad = run([join(skillRoot, 'examples/broken.mmd'), join(outDir, 'bad.svg')]);
const badReceipt = receipt(bad);
if (bad.status === 0 || badReceipt.ok !== false || badReceipt.code !== 'syntax' || !badReceipt.line) {
  console.error(badReceipt);
  process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });
console.log(JSON.stringify({
  ok: true,
  pele: checkReceipt.pele,
  rendered,
  syntaxError: { code: badReceipt.code, line: badReceipt.line, column: badReceipt.column },
}));
