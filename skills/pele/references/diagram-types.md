# Diagram types

Pele 1.6.0 renders every diagram type built into Mermaid 12.1.0: 32 user types plus `info`. Its parsers track Mermaid's specs; the layout and look are Pele's, not mermaid.js.

The source of truth is `scripts/catalog.mjs`. `node scripts/render.mjs --types` prints it as JSON. `npm run smoke` checks the catalog against Pele's own type list and renders every example below.

## Choosing a type

Pick by what the reader must see, not by what the user called it. A "process" with owners is a `swimlane`; a "roadmap" with dates is a `gantt`, without dates a `timeline`; a "root cause" is an `ishikawa`; "folder structure" is a `treeView`.

| `type` (receipt) | First line | Use for | Example |
|---|---|---|---|
| flowchart | `flowchart LR` (or `TB`, `graph TD`) | Process, decision, dependency graph | [flowchart](../examples/types/flowchart.mmd) |
| sequence | `sequenceDiagram` | Messages between participants over time | [sequence](../examples/types/sequence.mmd) |
| class | `classDiagram` | Classes, fields, methods, inheritance | [class](../examples/types/class.mmd) |
| state | `stateDiagram-v2` | States and transitions | [state](../examples/types/state.mmd) |
| er | `erDiagram` | Entities, attributes, cardinality | [er](../examples/types/er.mmd) |
| gantt | `gantt` | Tasks on a calendar with dependencies | [gantt](../examples/types/gantt.mmd) |
| gitGraph | `gitGraph` | Commits, branches, merges | [gitGraph](../examples/types/gitGraph.mmd) |
| mindmap | `mindmap` | Hierarchy of ideas from one root | [mindmap](../examples/types/mindmap.mmd) |
| pie | `pie` | Parts of a whole | [pie](../examples/types/pie.mmd) |
| journey | `journey` | User steps scored by satisfaction | [journey](../examples/types/journey.mmd) |
| timeline | `timeline` | Events by period, no dates needed | [timeline](../examples/types/timeline.mmd) |
| quadrantChart | `quadrantChart` | Items on a 2x2 matrix | [quadrantChart](../examples/types/quadrantChart.mmd) |
| xychart | `xychart` | Bar and line chart | [xychart](../examples/types/xychart.mmd) |
| c4 | `C4Context` (`C4Container`, `C4Component`, `C4Dynamic`, `C4Deployment`) | C4 architecture model | [c4](../examples/types/c4.mmd) |
| block | `block` | Boxes placed on a column grid | [block](../examples/types/block.mmd) |
| architecture | `architecture-beta` | Cloud services, groups, ports | [architecture](../examples/types/architecture.mmd) |
| requirement | `requirementDiagram` | Requirements and what satisfies them | [requirement](../examples/types/requirement.mmd) |
| sankey | `sankey` | Weighted flows (CSV rows: source,target,value) | [sankey](../examples/types/sankey.mmd) |
| packet | `packet` | Bit fields of a protocol header | [packet](../examples/types/packet.mmd) |
| radar | `radar-beta` | Series compared on shared axes | [radar](../examples/types/radar.mmd) |
| treemap | `treemap-beta` | Nested rectangles sized by value | [treemap](../examples/types/treemap.mmd) |
| kanban | `kanban` | Columns of cards | [kanban](../examples/types/kanban.mmd) |
| railroad | `railroad-ebnf-beta` (`railroad-abnf-beta`, `railroad-peg-beta`, `railroad-beta`) | Grammar as a syntax diagram | [railroad](../examples/types/railroad.mmd) |
| wardley | `wardley-beta` | Value chain against evolution | [wardley](../examples/types/wardley.mmd) |
| ishikawa | `ishikawa-beta` | Fishbone, cause and effect | [ishikawa](../examples/types/ishikawa.mmd) |
| swimlane | `swimlane-beta LR` | Flowchart in lanes by role | [swimlane](../examples/types/swimlane.mmd) |
| venn | `venn-beta` | Overlapping sets | [venn](../examples/types/venn.mmd) |
| usecase | `usecase-beta` | Actors and use cases | [usecase](../examples/types/usecase.mmd) |
| treeView | `treeView-beta` | File or folder tree | [treeView](../examples/types/treeView.mmd) |
| cynefin | `cynefin-beta` | Items in Cynefin domains | [cynefin](../examples/types/cynefin.mmd) |
| eventmodeling | `eventmodeling` | Event model: UI, commands, events | [eventmodeling](../examples/types/eventmodeling.mmd) |
| agentflow | `agentflow-beta TB` | Agent pipeline: flows, tools, connectors | [agentflow](../examples/types/agentflow.mmd) |
| info | `info` | Pele version banner. Not a user diagram | [info](../examples/types/info.mmd) |

## Headers that fail

The header must match exactly. These look right and are rejected:

| Written | Result | Use |
|---|---|---|
| `radar`, `venn`, `wardley`, `treeView`, `usecase`, `cynefin` | `unsupported-diagram` | add `-beta` |
| `swimlane LR`, `agentflow TB` | `unsupported-diagram` | `swimlane-beta LR`, `agentflow-beta TB` |
| `railroad` | `unsupported-diagram` | `railroad-ebnf-beta` (or another dialect) |
| `fishbone` | `unsupported-diagram` | `ishikawa-beta` |
| `architecture` | `syntax` on line 1 | `architecture-beta` |

`xychart-beta`, `sankey-beta`, `packet-beta`, `block-beta`, `ishikawa`, and `treemap` without `-beta` are accepted.

On `unsupported-diagram`, the receipt carries `hint` and a `suggest` list of `{type, header, example}` when the first word resembles a known type. Use that header; do not invent one.

## Writing an unfamiliar type

For the beta types (railroad and below in the table), the syntax is not in most training data. Read the linked example before writing, and copy its structure. The examples are minimal; Mermaid's docs describe the full grammar where Mermaid has published one.

Trust the `type` field in the receipt. Do not guess it from the header.

## Partial support

- Mermaid frontmatter and `%%{init}%%` directives are accepted only where Pele implements them. Prefer plain diagram syntax.
- Icon syntax such as `fa:fa-user`, architecture icons beyond the built-ins (`cloud`, `database`, `disk`, `internet`, `server`), and treeView icon packs need an icon callback. This script does not supply one. An unknown icon does not fail the render: it leaves an empty slot. Use the built-ins or omit icons.
- Click callbacks and interactive mermaid.js bindings are not available. Links that survive Pele's scheme filter are static `<a>` elements.
