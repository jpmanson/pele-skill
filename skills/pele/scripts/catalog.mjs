// Diagram types Pele 1.6.0 renders. One entry per receipt `type`.
// `header` is the first line Pele's detector needs. Words in `aliases` are
// what a user or agent might say, or write as a header, instead.
// Every entry has a working source at examples/types/<type>.mmd.
export const catalog = [
  { type: 'flowchart', header: 'flowchart LR', use: 'Process, decision, or dependency graph', aliases: ['graph', 'flow', 'process', 'decision tree', 'flowchart-elk'] },
  { type: 'sequence', header: 'sequenceDiagram', use: 'Messages between participants over time', aliases: ['sequence', 'interaction', 'api call', 'handshake'] },
  { type: 'class', header: 'classDiagram', use: 'Classes, fields, methods, inheritance', aliases: ['class', 'uml', 'object model'] },
  { type: 'state', header: 'stateDiagram-v2', use: 'States and transitions', aliases: ['state', 'state machine', 'fsm', 'lifecycle'] },
  { type: 'er', header: 'erDiagram', use: 'Entities, attributes, cardinality', aliases: ['er', 'entity relationship', 'schema', 'database model'] },
  { type: 'gantt', header: 'gantt', use: 'Tasks on a calendar with dependencies', aliases: ['schedule', 'project plan', 'roadmap'] },
  { type: 'gitGraph', header: 'gitGraph', use: 'Commits, branches, merges', aliases: ['git', 'branching', 'git graph'] },
  { type: 'mindmap', header: 'mindmap', use: 'Hierarchy of ideas from one root', aliases: ['mind map', 'brainstorm'] },
  { type: 'pie', header: 'pie', use: 'Parts of a whole', aliases: ['pie chart', 'share', 'breakdown'] },
  { type: 'journey', header: 'journey', use: 'User steps scored by satisfaction', aliases: ['user journey', 'customer journey', 'experience map'] },
  { type: 'timeline', header: 'timeline', use: 'Events by period', aliases: ['history', 'chronology', 'milestones'] },
  { type: 'quadrantChart', header: 'quadrantChart', use: 'Items on a 2x2 matrix', aliases: ['quadrant', '2x2', 'priority matrix', 'eisenhower'] },
  { type: 'xychart', header: 'xychart', use: 'Bar and line chart on x/y axes', aliases: ['xychart-beta', 'bar chart', 'line chart', 'chart'] },
  { type: 'c4', header: 'C4Context', use: 'C4 model (also C4Container, C4Component, C4Dynamic, C4Deployment)', aliases: ['c4 model', 'system context', 'c4container', 'c4component'] },
  { type: 'block', header: 'block', use: 'Blocks on a grid you place by column', aliases: ['block-beta', 'blocks', 'grid layout'] },
  { type: 'architecture', header: 'architecture-beta', use: 'Cloud services, groups, and ports', aliases: ['architecture', 'infrastructure', 'cloud', 'topology'] },
  { type: 'requirement', header: 'requirementDiagram', use: 'Requirements and what satisfies or verifies them', aliases: ['requirement', 'sysml', 'traceability'] },
  { type: 'sankey', header: 'sankey', use: 'Weighted flows between nodes', aliases: ['sankey-beta', 'flow volume', 'energy flow', 'budget flow'] },
  { type: 'packet', header: 'packet', use: 'Bit fields of a protocol header', aliases: ['packet-beta', 'bit layout', 'protocol header'] },
  { type: 'radar', header: 'radar-beta', use: 'Several series compared on shared axes', aliases: ['radar', 'spider chart', 'spider'] },
  { type: 'treemap', header: 'treemap-beta', use: 'Nested rectangles sized by value', aliases: ['treemap', 'nested area'] },
  { type: 'kanban', header: 'kanban', use: 'Columns of cards', aliases: ['board', 'task board'] },
  { type: 'railroad', header: 'railroad-ebnf-beta', use: 'Grammar as a syntax diagram (also railroad-abnf-beta, railroad-peg-beta, railroad-beta)', aliases: ['railroad', 'syntax diagram', 'grammar', 'ebnf', 'bnf'] },
  { type: 'wardley', header: 'wardley-beta', use: 'Value chain plotted against evolution', aliases: ['wardley', 'wardley map', 'value chain'] },
  { type: 'ishikawa', header: 'ishikawa-beta', use: 'Cause-and-effect for one problem', aliases: ['ishikawa', 'fishbone', 'cause and effect', 'root cause'] },
  { type: 'swimlane', header: 'swimlane-beta LR', use: 'Flowchart split into lanes by role', aliases: ['swimlane', 'swim lane', 'cross-functional', 'bpmn'] },
  { type: 'venn', header: 'venn-beta', use: 'Overlapping sets', aliases: ['venn', 'overlap', 'sets'] },
  { type: 'usecase', header: 'usecase-beta', use: 'Actors and the use cases they reach', aliases: ['usecase', 'use case', 'actors'] },
  { type: 'treeView', header: 'treeView-beta', use: 'File or folder tree', aliases: ['treeview', 'tree view', 'file tree', 'directory tree', 'folder structure'] },
  { type: 'cynefin', header: 'cynefin-beta', use: 'Items in the Cynefin domains', aliases: ['cynefin', 'sense-making'] },
  { type: 'eventmodeling', header: 'eventmodeling', use: 'Event model: UI, commands, events over time', aliases: ['event modeling', 'event model', 'event sourcing'] },
  { type: 'agentflow', header: 'agentflow-beta TB', use: 'Agent pipeline: flows, tools, connectors', aliases: ['agentflow', 'agent flow', 'agent pipeline', 'llm workflow'] },
  { type: 'info', header: 'info', use: 'Pele version banner only. Not a user diagram', aliases: [] },
];

function normalize(word) {
  return word.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

// Suggest catalog entries for a source whose header Pele did not recognize.
export function suggest(source) {
  const body = source.replace(/^---\n[\s\S]*?\n---\n/, '');
  const first = (body.split('\n').find((line) => line.trim() && !line.trim().startsWith('%%')) || '').trim();
  const head = normalize(first.split(/\s+/)[0] || '');
  if (!head) return [];
  return catalog.filter((entry) =>
    [entry.type, entry.header.split(/\s+/)[0], ...entry.aliases]
      .map(normalize)
      .some((name) => name === head || (name.length >= 4 && head.startsWith(name))),
  );
}
