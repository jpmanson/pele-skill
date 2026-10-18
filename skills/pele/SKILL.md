---
name: pele
description: "Use when rendering Mermaid to SVG. Renders Mermaid 12 source to an SVG file with Pele, without a browser. Use for Mermaid, .mmd, flowchart, sequence, class, state, ER, gantt, git graph, mindmap, or any request for an SVG of a Mermaid diagram. Do not use to leave a Markdown fence as-is, or for a diagram that is not Mermaid."
license: MIT
compatibility: Requires Node.js 20+ and npm. No browser. For Claude Code, Hermes Agent, and OpenCode.
metadata:
  author: "Juan Pablo Manson"
  version: "0.1.0"
  "opencode/slash": "true"
---

# Pele

Render Mermaid source to SVG with [Pele](https://github.com/obsidianmd/pele). Pele is a synchronous library: no Puppeteer, no mermaid-cli, no MCP server. This skill's interface is `scripts/render.mjs`.

The skill root is the directory that contains this file. Every path below is relative to that directory. That remains true after the skill is installed into Claude Code, Hermes, or OpenCode.

## When to Use

- The user wants a Mermaid diagram as an SVG, HTML, or image file.
- A `.mmd` file, or a ` ```mermaid ` fence, needs to be rendered and checked.
- The user asks for a flowchart, sequence, class, state, ER, gantt, git graph, mindmap, pie, C4, or another Mermaid 12 diagram and wants a file, not a chat fence.

Do not use when:

- The Mermaid fence should stay in Markdown that GitHub, Obsidian, or another viewer already renders.
- The requested artifact is not Mermaid (hand-drawn Excalidraw JSON, a bespoke architecture page, a screenshot annotation).
- The user needs pixel-identical mermaid.js output. Pele has its own layout.

Do not wrap this in an MCP server. One script call is the whole capability.

## Prerequisites

- Node.js 20 or newer, and `npm` on `PATH`.
- Dependency install happens in the skill root (`package.json` next to this file), never in the user's project.

If `node_modules/pele` is missing, the script runs `npm install` there. You can also do it yourself:

```bash
npm install --no-fund --no-audit
```

Completion: `node scripts/render.mjs --check` exits 0 and stderr JSON has `"ok": true` and a `pele` version.

## Procedure

1. Write the Mermaid source to a `.mmd` file. Do not pass a multi-line diagram as a shell argument.
2. Render it:

```bash
node scripts/render.mjs INPUT.mmd OUTPUT.svg
```

3. Read the JSON receipt on stderr. Completion is all of: exit code 0, `"ok": true`, and the output file starts with `<svg`.
4. If `"ok": false` and `code` is `syntax` or `semantic`, fix the source at `line` / `column` using `snippet`, then render again. Do not switch to mermaid-cli, a headless browser, or a hand-written SVG.
5. Report the absolute output path. Do not paste the SVG into the chat unless the user asked for the markup. Do not claim success on a non-zero exit.

Use `--html`, or an output path ending in `.html`, when the user needs a file they can open in a browser. The HTML inlines the SVG and sets Pele's CSS color variables.

```bash
node scripts/render.mjs --html INPUT.mmd OUTPUT.html
```

## Receipt

Success on stderr:

```json
{"ok":true,"type":"flowchart","width":180,"height":80,"bytes":1200,"output":"/abs/OUTPUT.svg","html":false,"pele":"1.6.0"}
```

Failure on stderr, exit 1 (exit 2 if Pele could not be installed):

```json
{"ok":false,"code":"syntax","message":"...","type":"flowchart","line":2,"column":5,"snippet":"..."}
```

`code` is `syntax`, `semantic`, `unsupported-diagram`, `limit`, `usage`, `install-failed`, or `render-failed`. Display `message` as text. It can contain the diagram source.

## Flags

| Flag | Use |
|---|---|
| `--check` | Load Pele, print version, do not render |
| `--html` | Standalone HTML instead of raw SVG |
| `--fixed` | Fixed pixel size. Default for a `.svg` file |
| `--responsive` | SVG may shrink to its container. Default for stdout and HTML |
| `--max-width <px>` | Ask Pele to adapt the layout. Can flip a wide `LR` flowchart vertical below 640px |
| `--font-size <px>` | Base font size |
| `--font <family>` | Label font |
| `--id-prefix <str>` | Unique prefix when more than one SVG will share a page |

Stdout stays the SVG (or HTML). The receipt is always the last JSON line on stderr.

A surrounding ` ```mermaid ` fence is stripped. Mermaid's own frontmatter is not.

## Pitfalls

- File SVG defaults to `responsive: false`. Pass `--responsive` only when the SVG will be embedded and should shrink.
- Node has no canvas measurer. Label widths can differ from a browser render. That is expected.
- Do not pass `--max-width` unless the user asked for a narrow layout. It can change direction.
- Icon names (`fa:fa-user`) are omitted. This script does not supply an icon callback. Drop the icon or replace it with text.
- Source limit is 50,000 characters. Output limit is 4,000,000. Flowchart edge limit is 5,000.
- `npm install` in the user's repo will not satisfy this script. The package lives in the skill root.
- If `node_modules` exists but Pele fails to load, delete that `node_modules` and run `npm install` in the skill root.
- An already-open agent session will not see a skill installed mid-session. That is a loader cache, not a bad install.

Diagram headers and partial syntax: [references/diagram-types.md](references/diagram-types.md).

## Verification

From the skill root:

```bash
npm run smoke
```

Completion: exit 0, and stdout JSON has `"ok": true`, a `pele` version, rendered `flowchart` and `sequence` entries, and a `syntaxError` with `code: "syntax"` and a non-zero `line`. `examples/broken.mmd` must keep failing. A smoke pass does not mean a new diagram is correct; each new diagram still needs its own receipt.
