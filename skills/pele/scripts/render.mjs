#!/usr/bin/env node
// Render Mermaid source to SVG with Pele. JSON receipt goes to stderr.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { catalog, suggest } from './catalog.mjs';

const skillRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function fail(payload, code = 1) {
  console.error(JSON.stringify({ ok: false, ...payload }));
  process.exit(code);
}

function usage() {
  return `Usage: node scripts/render.mjs [options] <input.mmd|-> [output]

Render Mermaid source to SVG with Pele.
A JSON receipt is written to stderr. SVG (or HTML) goes to the output path, or stdout.

Options:
  --check              Load Pele and print its version. Installs it first if needed.
  --types              Print every supported type, its header, and an example path (JSON, stdout)
  --html               Wrap the SVG in a standalone HTML file
  --responsive         Let the SVG shrink to its container
  --fixed              Fixed pixel size (default when writing a .svg file)
  --max-width <px>     Layout width hint passed to Pele
  --font-size <px>     Base font size (Pele default 16)
  --font <family>      Label font (Pele default sans-serif)
  --id-prefix <str>    Prefix for title/desc ids (default pele)
  -h, --help           Show this help
`;
}

function parseArgs(argv) {
  const opts = {
    check: false,
    types: false,
    html: false,
    responsive: null,
    maxWidth: undefined,
    fontSize: undefined,
    font: undefined,
    idPrefix: 'pele',
    help: false,
    positional: [],
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => {
      const value = argv[++i];
      if (value == null || value.startsWith('-')) {
        fail({ code: 'usage', message: `Missing value for ${arg}` });
      }
      return value;
    };
    if (arg === '--check') opts.check = true;
    else if (arg === '--types') opts.types = true;
    else if (arg === '--html') opts.html = true;
    else if (arg === '--responsive') opts.responsive = true;
    else if (arg === '--fixed') opts.responsive = false;
    else if (arg === '--max-width') opts.maxWidth = numberFlag(arg, next());
    else if (arg === '--font-size') opts.fontSize = numberFlag(arg, next());
    else if (arg === '--font') opts.font = next();
    else if (arg === '--id-prefix') opts.idPrefix = next();
    else if (arg === '-h' || arg === '--help') opts.help = true;
    else if (arg === '-') opts.positional.push(arg);
    else if (arg.startsWith('-')) fail({ code: 'usage', message: `Unknown option ${arg}` });
    else opts.positional.push(arg);
  }
  return opts;
}

function numberFlag(flag, value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    fail({ code: 'usage', message: `${flag} expects a positive number, got ${value}` });
  }
  return n;
}

function stripFence(text) {
  const trimmed = text.replace(/^\uFEFF/, '').trim();
  const fenced = trimmed.match(/^```(?:mermaid|mmd)?[^\n]*\n([\s\S]*?)\n?```$/);
  return fenced ? fenced[1].replace(/\s+$/, '') : trimmed;
}

function ensurePele() {
  const installed = join(skillRoot, 'node_modules', 'pele', 'package.json');
  if (!existsSync(installed)) {
    const result = spawnSync('npm', ['install', '--no-fund', '--no-audit'], {
      cwd: skillRoot,
      encoding: 'utf8',
      shell: process.platform === 'win32',
    });
    if (result.status !== 0) {
      fail({
        code: 'install-failed',
        message: 'npm install failed in the skill directory. Run it there, not in the user project.',
        skillRoot,
        stderr: (result.stderr || '').slice(-2000),
      }, 2);
    }
  }
  let entry;
  try {
    entry = createRequire(join(skillRoot, 'package.json')).resolve('pele');
  } catch (error) {
    fail({
      code: 'install-failed',
      message: error.message,
      skillRoot,
      hint: 'Delete node_modules in the skill directory and run npm install there.',
    }, 2);
  }
  return import(pathToFileURL(entry).href);
}

function peleVersion() {
  try {
    return JSON.parse(readFileSync(join(skillRoot, 'node_modules', 'pele', 'package.json'), 'utf8')).version;
  } catch {
    return null;
  }
}

function wrapHtml(svg) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Diagram</title>
<style>
  html, body { margin: 0; background: #fffcf0; }
  .pele {
    --pele-bg: #fffcf0;
    --pele-fg: #100f0f;
    --pele-muted: #6f6e69;
    --pele-line: #100f0f;
    --pele-surface: #f2f0e5;
    --pele-surface-alt: #e6e4d9;
    --pele-border: #cecdc3;
    --pele-accent: #205ea6;
    --pele-font: sans-serif;
    --pele-radius: 4px;
    padding: 24px;
  }
  .pele svg { max-width: 100%; height: auto; }
</style>
</head>
<body>
<div class="pele">
${svg}
</div>
</body>
</html>
`;
}

function readSource(input) {
  if (input === '-') return stripFence(readFileSync(0, 'utf8'));
  const path = resolve(input);
  if (!existsSync(path)) fail({ code: 'usage', message: `Input not found: ${path}` });
  return stripFence(readFileSync(path, 'utf8'));
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    process.stdout.write(usage());
    return;
  }
  if (opts.types) {
    const types = catalog
      .filter((entry) => entry.type !== 'info')
      .map(({ type, header, use }) => ({ type, header, use, example: join(skillRoot, 'examples', 'types', `${type}.mmd`) }));
    process.stdout.write(`${JSON.stringify(types, null, 1)}\n`);
    return;
  }

  const pele = await ensurePele();
  const version = peleVersion();
  if (opts.check) {
    console.error(JSON.stringify({ ok: true, pele: version, skillRoot }));
    return;
  }
  if (opts.positional.length < 1 || opts.positional.length > 2) {
    fail({ code: 'usage', message: usage().trim() });
  }

  const outputPath = opts.positional[1] ? resolve(opts.positional[1]) : null;
  const asHtml = opts.html || Boolean(outputPath && outputPath.endsWith('.html'));
  const responsive = opts.responsive ?? (asHtml || !outputPath);
  const source = readSource(opts.positional[0]);
  if (!source) fail({ code: 'usage', message: 'Empty Mermaid source' });

  const options = { responsive, idPrefix: opts.idPrefix };
  if (opts.maxWidth != null) options.maxWidth = opts.maxWidth;
  if (opts.fontSize != null) options.fontSize = opts.fontSize;
  if (opts.font) options.fontFamily = opts.font;

  let rendered;
  try {
    rendered = pele.render(source, options);
  } catch (error) {
    const payload = {
      code: error.code || 'render-failed',
      message: error.message,
      type: error.type ?? null,
      line: error.line ?? 0,
      column: error.column ?? 0,
      snippet: error.snippet ?? '',
    };
    if (payload.code === 'unsupported-diagram') {
      const matches = suggest(source);
      payload.hint = matches.length
        ? `Replace the first line with the header below. Many types need the -beta suffix.`
        : 'The first line must be a diagram header. Run --types for the list.';
      payload.suggest = matches.map(({ type, header }) => ({
        type,
        header,
        example: join(skillRoot, 'examples', 'types', `${type}.mmd`),
      }));
    }
    fail(payload);
  }

  const body = asHtml ? wrapHtml(rendered.svg) : rendered.svg;
  if (outputPath) {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, body);
  } else {
    process.stdout.write(body);
  }
  console.error(JSON.stringify({
    ok: true,
    type: rendered.type,
    width: rendered.width,
    height: rendered.height,
    bytes: Buffer.byteLength(body),
    output: outputPath,
    html: asHtml,
    pele: version,
  }));
}

main().catch((error) => {
  fail({ code: 'render-failed', message: error.stack || error.message });
});
