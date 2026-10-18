# Diagram types

Pele 1.6.0 renders the diagram types built into Mermaid 12.1.0. Its parsers track Mermaid's specs; the layout and look are Pele's, not mermaid.js.

Detected `type` values from a successful render:

- flowchart (`flowchart`, `graph`)
- sequence
- class
- state
- er
- gantt
- git
- mindmap
- pie
- journey
- timeline
- quadrant
- xychart
- c4
- block
- architecture
- requirement
- sankey
- packet
- radar
- treemap
- kanban
- railroad, wardley, ishikawa, swimlane, venn, usecase, treeview, cynefin, eventmodeling, agentflow, info

Trust the `type` field in the receipt. Do not guess it from the header.

`detectType` is not exposed by this skill's script. If render fails with `unsupported-diagram`, the header is missing or the type is not in this list. Add a real diagram header (`flowchart LR`, `sequenceDiagram`, `classDiagram`, `stateDiagram-v2`, `erDiagram`, `gantt`, `gitGraph`, `mindmap`, `pie`, `C4Context`, and so on). Do not invent a header the source does not support.

Partial support:

- Mermaid frontmatter and `%%{init}%%` directives are accepted only where Pele implements them. Prefer plain diagram syntax.
- Icon syntax such as `fa:fa-user` needs an icon callback. This script does not supply one. Omit icons.
- Click callbacks and interactive mermaid.js bindings are not available. Links that survive Pele's scheme filter are static `<a>` elements.
