---
name: pele
description: "Use when rendering Mermaid to SVG. Renders Mermaid 12 source to an SVG or HTML file with Pele, without a browser. Covers 32 types: flowchart, sequence, class, state, ER, gantt, git graph, mindmap, pie, journey, timeline, quadrant, xy chart, C4, block, architecture, requirement, sankey, packet, radar, treemap, kanban, railroad grammar, Wardley map, Ishikawa/fishbone, swimlane, Venn, use case, file tree, Cynefin, event modeling, agent flow. Use for .mmd files or any request for an image of one of these. Do not use to leave a Markdown fence as-is, or for a diagram that is not Mermaid."
license: MIT
compatibility: Requires Node.js 20+ and npm. No browser. For Claude Code, Hermes Agent, and OpenCode.
metadata:
  author: "Juan Pablo Manson"
  version: "0.4.0"
  "opencode/slash": "true"
---

# Pele

Render Mermaid source to SVG with [Pele](https://github.com/obsidianmd/pele). Pele is a synchronous library: no Puppeteer, no mermaid-cli, no MCP server. This skill's interface is `scripts/render.mjs`.

The skill root is the directory that contains this file. Every path below is relative to that directory. That remains true after the skill is installed into Claude Code, Hermes, or OpenCode.

## When to Use

- The user wants a Mermaid diagram as an SVG, HTML, or image file.
- A `.mmd` file, or a ` ```mermaid ` fence, needs to be rendered and checked.
- The user asks for a diagram one of the 32 supported types can draw, and wants a file, not a chat fence. That includes less familiar ones: Wardley map, fishbone, Venn, swimlane, radar, treemap, sankey, railroad grammar, file tree, Cynefin, event model. See Diagram types below.

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

## Diagram types

Know the full list before choosing. Pele renders 32 types, and a third of them need a `-beta` header that differs from the name a user would say.

```bash
node scripts/render.mjs --types
```

That prints JSON: `type`, exact first-line `header`, what it is for, and a working `example` path. [references/diagram-types.md](references/diagram-types.md) has the same table, the headers that fail, and how to pick a type.

- Pick the type that shows what the reader needs, not the first one that comes to mind. Owners per step → `swimlane`. Causes of one problem → `ishikawa`. Dated tasks → `gantt`. Folder layout → `treeView`. Proportional flows → `sankey`.
- If the request fits no type (freeform layout, a picture, a chart type not listed), say so and do not force it into a flowchart.
- If the user names a specific diagram type that is not in the list, say so before offering the closest supported type. Do not approximate it silently.

## Procedure

1. Choose the type and its exact header from `--types`. For any `-beta` type, or any type whose syntax you are not sure of, read its `example` file first and copy its structure.
2. Write the Mermaid source to a `.mmd` file. Do not pass a multi-line diagram as a shell argument.
3. Render it:

```bash
node scripts/render.mjs INPUT.mmd OUTPUT.svg
```

4. Read the JSON receipt on stderr. Completion is all of: exit code 0, `"ok": true`, the receipt `type` is the type you chose, and the output file starts with `<svg`.
5. If `"ok": false`:
   - `unsupported-diagram`: the first line is not a known header. Use `suggest[0].header` if present, otherwise pick one from `--types`.
   - `syntax` or `semantic`: fix the source at `line` / `column` using `snippet`, compare with the type's example, then render again.
   - Do not switch to mermaid-cli, a headless browser, or a hand-written SVG.
6. Report the absolute output path. Do not paste the SVG into the chat unless the user asked for the markup. Do not claim success on a non-zero exit.

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

An `unsupported-diagram` receipt also has `hint` and `suggest`:

```json
{"ok":false,"code":"unsupported-diagram","hint":"Replace the first line with the header below. Many types need the -beta suffix.","suggest":[{"type":"radar","header":"radar-beta","example":"/abs/examples/types/radar.mmd"}]}
```

## Flags

| Flag | Use |
|---|---|
| `--check` | Load Pele, print version, do not render |
| `--types` | Print supported types, headers, and example paths as JSON on stdout |
| `--html` | Standalone HTML instead of raw SVG |
| `--fixed` | Fixed pixel size. Default for a `.svg` file |
| `--responsive` | SVG may shrink to its container. Default for stdout and HTML |
| `--max-width <px>` | Ask Pele to adapt the layout. Can flip a wide `LR` flowchart vertical below 640px |
| `--font-size <px>` | Base font size |
| `--font <family>` | Label font |
| `--id-prefix <str>` | Unique prefix when more than one SVG will share a page |
| `--static-colors` | Resolve the CSS custom properties to plain colors. Required before converting to PNG or PDF |

Stdout stays the SVG (or HTML). The receipt is always the last JSON line on stderr.

A surrounding ` ```mermaid ` fence is stripped. Mermaid's own frontmatter is not.

## Pitfalls

- File SVG defaults to `responsive: false`. Pass `--responsive` only when the SVG will be embedded and should shrink.
- Pele colors shapes with CSS custom properties (`fill="var(--_l)"`). Browsers resolve them; `rsvg-convert`, ImageMagick and several PDF tools do not, and paint those fills black: edge-label boxes turn into solid black blocks. Render with `--static-colors` when the SVG goes to a PNG, PDF, slide or document, and look at the converted file, not only the SVG.
- Node has no canvas measurer. Label widths can differ from a browser render. That is expected.
- Do not pass `--max-width` unless the user asked for a narrow layout. It can change direction.
- Headers are exact. `radar`, `venn`, `wardley`, `swimlane`, `treeView`, `usecase`, `cynefin`, `railroad`, `agentflow` all need `-beta`; `architecture` needs `-beta` too. There is no `fishbone` header; use `ishikawa-beta`.
- Icon names (`fa:fa-user`, architecture icons other than `cloud`, `database`, `disk`, `internet`, `server`) render as an empty slot without an error. This script does not supply an icon callback. Drop the icon or replace it with text.
- Source limit is 50,000 characters. Output limit is 4,000,000. Flowchart edge limit is 5,000.
- `npm install` in the user's repo will not satisfy this script. The package lives in the skill root.
- If `node_modules` exists but Pele fails to load, delete that `node_modules` and run `npm install` in the skill root.
- An already-open agent session will not see a skill installed mid-session. That is a loader cache, not a bad install.

## Verification

From the skill root:

```bash
npm run smoke
```

Completion: exit 0, and stdout JSON has `"ok": true`, a `pele` version, `"types": 32`, a `rendered` list with every catalog type, and a `syntaxError` with `code: "syntax"` and a non-zero `line`. The smoke also fails if `scripts/catalog.mjs` drifts from Pele's own type list, or if a header stops detecting as its type. `examples/broken.mmd` must keep failing. A smoke pass does not mean a new diagram is correct; each new diagram still needs its own receipt.
