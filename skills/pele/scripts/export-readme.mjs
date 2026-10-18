#!/usr/bin/env node
// Bake README figures. Colors are literal so GitHub does not drop CSS variables.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const skillRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(skillRoot, '../..');
const outDir = join(repoRoot, 'docs', 'images');
const srcDir = join(skillRoot, 'examples', 'readme');

const THEME = {
  '--_bg': '#fffcf0',
  '--pele-bg': '#fffcf0',
  '--_fg': '#100f0f',
  '--pele-fg': '#100f0f',
  '--_m': '#6f6e69',
  '--pele-muted': '#6f6e69',
  '--_l': '#100f0f',
  '--pele-line': '#100f0f',
  '--_s': '#f2f0e5',
  '--pele-surface': '#f2f0e5',
  '--_a': '#e6e4d9',
  '--pele-surface-alt': '#e6e4d9',
  '--_b': '#cecdc3',
  '--pele-border': '#cecdc3',
  '--_c': '#205ea6',
  '--pele-accent': '#205ea6',
  '--_r': '4',
  '--pele-radius': '4px',
  '--pele-critical': '#af3029',
  '--pele-font': 'sans-serif',
  '--pele-font-mono': 'ui-monospace, monospace',
};
const series = ['#4c78a8', '#f58518', '#54a24b', '#e45756', '#72b7b2', '#eeca3b', '#b279a2', '#9d755d'];
for (let i = 0; i < series.length; i++) {
  THEME[`--pele-series-${i + 1}`] = series[i];
  THEME[`--_series-${i + 1}`] = series[i];
}

function resolveVars(text) {
  let prev = '';
  let out = text;
  for (let n = 0; n < 8 && out !== prev; n++) {
    prev = out;
    out = out.replace(/var\(\s*(--[A-Za-z0-9_-]+)\s*(?:,\s*([^)]*))?\)/g, (_, name, fallback) => {
      if (THEME[name]) return THEME[name];
      return fallback ? fallback.trim() : '#100f0f';
    });
  }
  return out;
}

function hoistStyles(svg) {
  return svg.replace(/<([A-Za-z][\w:.-]*)(\s[^>]*?)(\/?)>/g, (full, tag, attrs, slash) => {
    const styleMatch = attrs.match(/\sstyle="([^"]*)"/);
    if (!styleMatch) return full;
    let style = styleMatch[1];
    const take = (prop) => {
      const match = style.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`));
      return match ? match[1].trim() : null;
    };
    const fill = take('fill');
    const stroke = take('stroke');
    const rx = take('rx')?.replace(/px$/, '');
    let next = attrs.replace(/\sstyle="[^"]*"/, '');
    const setAttr = (name, value) => {
      if (!value || value.includes('var(')) return;
      if (new RegExp(`\\s${name}="`).test(next)) {
        next = next.replace(new RegExp(`\\s${name}="[^"]*"`), ` ${name}="${value}"`);
      } else {
        next += ` ${name}="${value}"`;
      }
    };
    setAttr('fill', fill);
    setAttr('stroke', stroke);
    setAttr('rx', rx);
    style = style
      .replace(/(?:^|;)\s*fill\s*:\s*[^;]+/g, '')
      .replace(/(?:^|;)\s*stroke\s*:\s*[^;]+/g, '')
      .replace(/(?:^|;)\s*rx\s*:\s*[^;]+/g, '')
      .replace(/^;+|;+$/g, '')
      .replace(/;{2,}/g, ';')
      .trim();
    if (style) next += ` style="${style}"`;
    return `<${tag}${next}${slash}>`;
  });
}

function bake(svg, width, height, pad = 32) {
  let body = hoistStyles(resolveVars(svg));
  const w = width + pad * 2;
  const h = height + pad * 2;
  body = body.replace(/viewBox="[^"]*"/, `viewBox="-${pad} -${pad} ${w} ${h}"`);
  body = body.replace(/\swidth="[^"]*"/, ` width="${w}"`);
  body = body.replace(/\sheight="[^"]*"/, ` height="${h}"`);
  const frame = `<rect x="-${pad}" y="-${pad}" width="${w}" height="${h}" fill="${THEME['--_bg']}" stroke="#e6e4d9" stroke-width="1"/>`;
  body = body.replace(/(<svg\b[^>]*>)/, `$1${frame}`);
  if (body.includes('var(')) {
    throw new Error('unresolved CSS variable left in SVG');
  }
  if (body.includes(' / ')) {
    throw new Error('broken self-closing tag');
  }
  return body;
}

const require = createRequire(join(skillRoot, 'package.json'));
const pele = await import(pathToFileURL(require.resolve('pele')).href);
mkdirSync(outDir, { recursive: true });

const files = readdirSync(srcDir).filter((name) => name.endsWith('.mmd')).sort();
const rendered = [];
for (const name of files) {
  const source = readFileSync(join(srcDir, name), 'utf8');
  const result = pele.render(source, { responsive: false, idPrefix: name.replace(/\.mmd$/, ''), fontFamily: 'sans-serif' });
  const svg = bake(result.svg, result.width, result.height);
  const out = join(outDir, name.replace(/\.mmd$/, '.svg'));
  writeFileSync(out, svg);
  rendered.push({ file: out, type: result.type, width: result.width, height: result.height, bytes: Buffer.byteLength(svg) });
}
console.log(JSON.stringify({ ok: true, rendered }, null, 2));
