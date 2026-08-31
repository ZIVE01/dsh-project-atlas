'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import fixtureArtifact from '@/data/orchid-graph.v1.json';

type ViewMode = 'Architecture' | 'Now' | 'Deviations' | 'History';
type NodeState = 'verified' | 'unknown' | 'blind-spot' | 'warning';

type GraphNode = {
  id: string;
  shortId: string;
  type: string;
  label: string;
  subtitle: string;
  layer: 'Interface' | 'Boundary' | 'Policy' | 'Runtime' | 'Evidence';
  state: NodeState;
  confidence: string;
  provenance: string;
  x: number;
  y: number;
};

type GraphEdge = {
  from: string;
  to: string;
  label: string;
  state: NodeState;
};

type Finding = {
  id: string;
  severity: 'high' | 'medium' | 'info';
  title: string;
  detail: string;
  nodeId: string;
  state: 'UNKNOWN' | 'BLIND SPOT' | 'REVIEW';
};

type AgentDecision = 'allow-context' | 'deny' | 'unknown' | 'review';

type AgentEvent = {
  id: number;
  toolName: string;
  decision: AgentDecision;
  summary: string;
};

type ConsoleState =
  | { kind: 'overview' }
  | { kind: 'focus'; entityId: string }
  | { kind: 'path'; entities: string[]; relations: GraphEdge[] }
  | { kind: 'finding'; finding: Finding }
  | { kind: 'comparison'; scope: string }
  | {
      kind: 'deny';
      requestedId: string;
      reason: string;
      selectedBefore: string;
      selectedAfter: string;
    };

type WebMcpTool = {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  execute: (input: Record<string, unknown>) => Promise<unknown> | unknown;
};

type ModelContext = {
  registerTool: (
    tool: WebMcpTool,
    options?: { signal?: AbortSignal },
  ) => Promise<void> | void;
};

const nodes: GraphNode[] = [
  {
    id: 'screen:project-search',
    shortId: 'UI-01',
    type: 'SCREEN',
    label: 'Project search',
    subtitle: 'Human workspace',
    layer: 'Interface',
    state: 'verified',
    confidence: '1.00',
    provenance: 'overlay/ui/search-screen.synthetic · L12–48',
    x: 7,
    y: 18,
  },
  {
    id: 'route:search',
    shortId: 'RT-04',
    type: 'ROUTE',
    label: '/search',
    subtitle: 'Browser boundary',
    layer: 'Boundary',
    state: 'verified',
    confidence: '1.00',
    provenance: 'overlay/ui/router.synthetic · L8–15',
    x: 28,
    y: 18,
  },
  {
    id: 'api:lookup',
    shortId: 'API-02',
    type: 'API',
    label: 'GET /lookup',
    subtitle: 'Bounded query',
    layer: 'Boundary',
    state: 'verified',
    confidence: '0.98',
    provenance: 'overlay/service/lookup-api.synthetic · L20–55',
    x: 50,
    y: 18,
  },
  {
    id: 'capability:catalog-read',
    shortId: 'CAP-17',
    type: 'CAPABILITY',
    label: 'catalog.read',
    subtitle: 'Read-only policy',
    layer: 'Policy',
    state: 'verified',
    confidence: '1.00',
    provenance: 'overlay/policy/catalog-read.synthetic · #/catalog.read',
    x: 72,
    y: 18,
  },
  {
    id: 'handler:lookup',
    shortId: 'HD-02',
    type: 'HANDLER',
    label: 'Lookup handler',
    subtitle: 'Server enforcement',
    layer: 'Runtime',
    state: 'warning',
    confidence: '0.64',
    provenance: 'overlay/evidence/missing-server-enforcement.synthetic',
    x: 72,
    y: 54,
  },
  {
    id: 'store:catalog',
    shortId: 'DB-01',
    type: 'STORE',
    label: 'Catalog store',
    subtitle: 'Owned data',
    layer: 'Runtime',
    state: 'verified',
    confidence: '0.97',
    provenance: 'overlay/storage/catalog.synthetic · L1–32',
    x: 50,
    y: 54,
  },
  {
    id: 'audit:query',
    shortId: 'AU-03',
    type: 'AUDIT',
    label: 'Query receipt',
    subtitle: 'Minimized evidence',
    layer: 'Evidence',
    state: 'unknown',
    confidence: '0.42',
    provenance: 'overlay/evidence/observed-search.synthetic · partial',
    x: 28,
    y: 54,
  },
  {
    id: 'telemetry:window',
    shortId: 'OBS-08',
    type: 'OBSERVED',
    label: 'Runtime window',
    subtitle: 'Coverage 72%',
    layer: 'Evidence',
    state: 'blind-spot',
    confidence: '0.31',
    provenance: 'overlay/evidence/telemetry-gap.synthetic',
    x: 7,
    y: 54,
  },
];

const edges: GraphEdge[] = [
  { from: 'screen:project-search', to: 'route:search', label: 'navigates', state: 'verified' },
  { from: 'route:search', to: 'api:lookup', label: 'requests', state: 'verified' },
  { from: 'api:lookup', to: 'capability:catalog-read', label: 'requires', state: 'verified' },
  { from: 'capability:catalog-read', to: 'handler:lookup', label: 'guards?', state: 'warning' },
  { from: 'handler:lookup', to: 'store:catalog', label: 'reads', state: 'verified' },
  { from: 'store:catalog', to: 'audit:query', label: 'records', state: 'unknown' },
  { from: 'audit:query', to: 'telemetry:window', label: 'observed by', state: 'blind-spot' },
];

const findings: Finding[] = [
  {
    id: 'DSH-101',
    severity: 'high',
    title: 'Server enforcement not proven',
    detail: 'The capability exists, but the exact backend check is missing from the evidence chain.',
    nodeId: 'handler:lookup',
    state: 'UNKNOWN',
  },
  {
    id: 'DSH-203',
    severity: 'medium',
    title: 'Observed coverage gap',
    detail: 'Twenty-eight percent of the expected runtime window has no trustworthy observation.',
    nodeId: 'telemetry:window',
    state: 'BLIND SPOT',
  },
  {
    id: 'DSH-307',
    severity: 'info',
    title: 'Audit relation needs review',
    detail: 'A candidate relation was found, but its source cannot make the edge authoritative.',
    nodeId: 'audit:query',
    state: 'REVIEW',
  },
];

const modeCopy: Record<ViewMode, { eyebrow: string; title: string }> = {
  Architecture: { eyebrow: 'EXPECTED LAYER', title: 'How the project is meant to work' },
  Now: { eyebrow: 'DEPLOYED + OBSERVED', title: 'What can be proven right now' },
  Deviations: { eyebrow: 'DIFF MODE', title: 'Where reality diverges from intent' },
  History: { eyebrow: 'IMMUTABLE TIMELINE', title: 'How the architecture changed' },
};

const DEMO_STEP_MS = 4000;

function stateLabel(state: NodeState) {
  if (state === 'blind-spot') return 'BLIND SPOT';
  return state.toUpperCase();
}

function toolResult(payload: unknown) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

function findGraphPath(fromEntityId: string, toEntityId: string) {
  const queue = [{ entityId: fromEntityId, entities: [fromEntityId], relations: [] as GraphEdge[] }];
  const visited = new Set([fromEntityId]);
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.entityId === toEntityId) return current;
    for (const edge of edges.filter((candidate) => candidate.from === current.entityId)) {
      if (visited.has(edge.to)) continue;
      visited.add(edge.to);
      queue.push({
        entityId: edge.to,
        entities: [...current.entities, edge.to],
        relations: [...current.relations, edge],
      });
    }
  }
  return null;
}

function graphEdgeKey(edge: GraphEdge) {
  return `${edge.from}->${edge.to}`;
}

function waitForDemo(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export default function Home() {
  const [mode, setMode] = useState<ViewMode>('Architecture');
  const [selectedId, setSelectedId] = useState(nodes[4].id);
  const [query, setQuery] = useState('');
  const [activeLayer, setActiveLayer] = useState<GraphNode['layer'] | 'All'>('All');
  const [toolState, setToolState] = useState<'connected' | 'preview'>('preview');
  const [lastAction, setLastAction] = useState('Human selected Lookup handler');
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<string[]>([]);
  const [highlightedEdgeIds, setHighlightedEdgeIds] = useState<string[]>([]);
  const [consoleState, setConsoleState] = useState<ConsoleState>({ kind: 'overview' });
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([]);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoStep, setDemoStep] = useState('READY');
  const selectedIdRef = useRef(selectedId);
  const eventSequence = useRef(0);
  const demoRun = useRef(0);

  const selected = nodes.find((node) => node.id === selectedId) ?? nodes[0];
  const matchingNodes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return new Set(
      nodes
        .filter((node) => activeLayer === 'All' || node.layer === activeLayer)
        .filter((node) => !normalized || `${node.label} ${node.type} ${node.id}`.toLowerCase().includes(normalized))
        .map((node) => node.id),
    );
  }, [activeLayer, query]);

  function setSelectedNode(nodeId: string) {
    selectedIdRef.current = nodeId;
    setSelectedId(nodeId);
  }

  function recordAgentEvent(toolName: string, decision: AgentDecision, summary: string) {
    eventSequence.current += 1;
    const event: AgentEvent = { id: eventSequence.current, toolName, decision, summary };
    setAgentEvents((current) => [...current, event].slice(-5));
  }

  function focusNode(nodeId: string, source = 'Human') {
    const node = nodes.find((candidate) => candidate.id === nodeId);
    if (!node) return false;
    setSelectedNode(node.id);
    setHighlightedNodeIds([node.id]);
    setHighlightedEdgeIds([]);
    setConsoleState({ kind: 'focus', entityId: node.id });
    setLastAction(`${source} focused ${node.label}`);
    return true;
  }

  function inspectProjectOverview() {
    const payload = {
      projectId: 'prj_orchid_synthetic',
      namespace: 'synthetic:orchid',
      engineGraphNodes: fixtureArtifact.graph.nodes.length,
      engineGraphEdges: fixtureArtifact.graph.edges.length,
      engineUnknowns: fixtureArtifact.graph.unknowns.length,
      visibleProjectionNodes: nodes.length,
      visibleProjectionEdges: edges.length,
      visibleProjectionSource: 'synthetic-architectural-overlay-v1',
      findings: findings.length,
      integrity: 'PASS',
      graphSha256: fixtureArtifact.graphSha256,
      scope: 'synthetic-read-only',
    };
    setConsoleState({ kind: 'overview' });
    setHighlightedNodeIds([]);
    setHighlightedEdgeIds([]);
    setLastAction('Agent inspected the project overview');
    recordAgentEvent('inspect_project_overview', 'allow-context', 'Pinned graph identity and integrity verified');
    return payload;
  }

  function focusExactEntity(entityId: string) {
    const selectedBefore = selectedIdRef.current;
    const node = nodes.find((candidate) => candidate.id === entityId);
    if (!node) {
      setConsoleState({
        kind: 'deny',
        requestedId: entityId,
        reason: 'unknown-exact-entity-id',
        selectedBefore,
        selectedAfter: selectedIdRef.current,
      });
      setLastAction(`Agent request denied for ${entityId}; selection unchanged`);
      recordAgentEvent('focus_graph_entity', 'deny', `${entityId} rejected; selection unchanged`);
      return { decision: 'deny', reason: 'unknown-exact-entity-id', mutation: false };
    }
    setSelectedNode(node.id);
    setHighlightedNodeIds([node.id]);
    setHighlightedEdgeIds([]);
    setConsoleState({ kind: 'focus', entityId: node.id });
    setLastAction(`Agent focused ${node.label}`);
    recordAgentEvent('focus_graph_entity', 'allow-context', `Focused exact entity ${node.id}`);
    return { decision: 'allow-context', focusedEntityId: node.id, mutation: false };
  }

  function traceArchitecturePath(fromEntityId: string, toEntityId: string) {
    const from = fromEntityId;
    const to = toEntityId;
    const exactNodeIds = nodes.map((node) => node.id);
    if (!exactNodeIds.includes(from) || !exactNodeIds.includes(to)) {
      recordAgentEvent('trace_architecture_path', 'deny', 'Unknown exact entity ID rejected');
      return { decision: 'deny', reason: 'unknown-exact-entity-id' };
    }
    const path = findGraphPath(from, to);
    if (!path) {
      recordAgentEvent('trace_architecture_path', 'unknown', 'No forward source-backed path exists');
      return { decision: 'unknown', reason: 'no-forward-source-backed-path' };
    }
    setSelectedNode(to);
    setHighlightedNodeIds(path.entities);
    setHighlightedEdgeIds(path.relations.map(graphEdgeKey));
    setConsoleState({ kind: 'path', entities: path.entities, relations: path.relations });
    setLastAction(`Agent traced ${path.entities.length} exact entities`);
    recordAgentEvent(
      'trace_architecture_path',
      'allow-context',
      `${path.entities.length} entities · ${path.relations.length} relations · 1 needs proof`,
    );
    return {
      decision: 'allow-context',
      entities: path.entities,
      relations: path.relations,
      bounded: true,
      mutation: false,
    };
  }

  function listSecurityFindings(severity: string) {
    const result = findings.filter((finding) => severity === 'all' || finding.severity === severity);
    setMode('Deviations');
    if (result[0]) {
      setSelectedNode(result[0].nodeId);
      setHighlightedNodeIds(result.map((finding) => finding.nodeId));
      setHighlightedEdgeIds([]);
      setConsoleState({ kind: 'finding', finding: result[0] });
    }
    setLastAction(`Agent listed ${result.length} preserved findings`);
    recordAgentEvent('list_security_findings', result[0]?.state === 'UNKNOWN' ? 'unknown' : 'review', `${result.length} findings preserved`);
    return { projectId: 'prj_orchid_synthetic', findings: result, mutation: false };
  }

  function compareArchitectureLayers(scope: string) {
    setMode('Deviations');
    setHighlightedNodeIds(findings.map((finding) => finding.nodeId));
    setHighlightedEdgeIds([]);
    setConsoleState({ kind: 'comparison', scope });
    setLastAction(`Agent compared ${scope} layers`);
    recordAgentEvent('compare_architecture_layers', 'review', 'UNKNOWN, BLIND SPOT and REVIEW preserved');
    return {
      decision: 'allow-context',
      expectedSnapshot: 'snp_expected_004',
      observedWindow: 'win_observed_018',
      deviations: findings.map(({ id, state, title, nodeId }) => ({ id, state, title, nodeId })),
      unknownsPreserved: true,
      mutation: false,
    };
  }

  async function runFullDemo() {
    if (demoRunning) return;
    const runId = demoRun.current + 1;
    demoRun.current = runId;
    setDemoRunning(true);
    setAgentEvents([]);

    const continueDemo = () => demoRun.current === runId;
    const pause = async () => {
      await waitForDemo(DEMO_STEP_MS);
      return continueDemo();
    };

    setDemoStep('1 / 9 · OVERVIEW');
    inspectProjectOverview();
    if (!(await pause())) return;

    setDemoStep('2 / 9 · EXACT ENTITY');
    focusExactEntity('screen:project-search');
    if (!(await pause())) return;

    setDemoStep('3 / 9 · BOUNDED PATH');
    const traced = traceArchitecturePath('screen:project-search', 'store:catalog');
    if ('entities' in traced) {
      for (const entityId of traced.entities) {
        if (!continueDemo()) return;
        setSelectedNode(entityId);
        await waitForDemo(520);
      }
    }
    if (!(await pause())) return;

    setDemoStep('4 / 9 · HIGH FINDING');
    listSecurityFindings('high');
    if (!(await pause())) return;

    setDemoStep('5 / 9 · SERVER PROOF');
    focusExactEntity('handler:lookup');
    if (!(await pause())) return;

    setDemoStep('6 / 9 · EXPECTED VS OBSERVED');
    compareArchitectureLayers('all');
    if (!(await pause())) return;

    setDemoStep('7 / 9 · BLIND SPOT');
    focusExactEntity('telemetry:window');
    if (!(await pause())) return;

    setDemoStep('8 / 9 · FAIL CLOSED');
    focusExactEntity('handler:payment');
    if (!(await pause())) return;

    setDemoStep('9 / 9 · FINAL EVIDENCE');
    focusExactEntity('handler:lookup');
    setDemoStep('DEMO COMPLETE · READ ONLY');
    setDemoRunning(false);
  }

  const toolExecutors = useRef({
    inspectProjectOverview,
    focusExactEntity,
    traceArchitecturePath,
    listSecurityFindings,
    compareArchitectureLayers,
  });

  useEffect(() => {
    toolExecutors.current = {
      inspectProjectOverview,
      focusExactEntity,
      traceArchitecturePath,
      listSecurityFindings,
      compareArchitectureLayers,
    };
  });

  useEffect(() => () => {
    demoRun.current += 1;
  }, []);

  useEffect(() => {
    const modelContext = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!modelContext?.registerTool) return;

    const controller = new AbortController();
    const exactNodeIds = nodes.map((node) => node.id);

    const tools: WebMcpTool[] = [
      {
        name: 'inspect_project_overview',
        description:
          'Return the pinned identity, graph coverage and safety state of the currently visible synthetic project. This tool is read-only.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        execute: () => toolResult(toolExecutors.current.inspectProjectOverview()),
      },
      {
        name: 'focus_graph_entity',
        description:
          'Focus one exact graph entity in the shared UI. Unknown or fuzzy identifiers fail closed and do not change the page.',
        inputSchema: {
          type: 'object',
          properties: {
            entityId: { type: 'string', enum: exactNodeIds, description: 'Exact stable entity ID.' },
          },
          required: ['entityId'],
          additionalProperties: false,
        },
        execute: ({ entityId }) => {
          const id = typeof entityId === 'string' ? entityId : '';
          return toolResult(toolExecutors.current.focusExactEntity(id));
        },
      },
      {
        name: 'trace_architecture_path',
        description:
          'Return a bounded, source-backed path between two exact entities. It never invents a missing edge and never modifies project data.',
        inputSchema: {
          type: 'object',
          properties: {
            fromEntityId: { type: 'string', enum: exactNodeIds },
            toEntityId: { type: 'string', enum: exactNodeIds },
          },
          required: ['fromEntityId', 'toEntityId'],
          additionalProperties: false,
        },
        execute: ({ fromEntityId, toEntityId }) => {
          const from = typeof fromEntityId === 'string' ? fromEntityId : '';
          const to = typeof toEntityId === 'string' ? toEntityId : '';
          return toolResult(toolExecutors.current.traceArchitecturePath(from, to));
        },
      },
      {
        name: 'list_security_findings',
        description:
          'List minimized security and architecture findings for the visible synthetic project. Results preserve unknown and blind-spot states.',
        inputSchema: {
          type: 'object',
          properties: {
            severity: { type: 'string', enum: ['all', 'high', 'medium', 'info'], default: 'all' },
          },
          additionalProperties: false,
        },
        execute: ({ severity }) => {
          const selectedSeverity = typeof severity === 'string' ? severity : 'all';
          return toolResult(toolExecutors.current.listSecurityFindings(selectedSeverity));
        },
      },
      {
        name: 'compare_architecture_layers',
        description:
          'Compare exact expected and observed synthetic layers and return deviations without promoting runtime evidence into architecture.',
        inputSchema: {
          type: 'object',
          properties: {
            scope: { type: 'string', enum: ['all', 'security', 'runtime'], default: 'all' },
          },
          additionalProperties: false,
        },
        execute: ({ scope }) => {
          return toolResult(toolExecutors.current.compareArchitectureLayers(String(scope ?? 'all')));
        },
      },
    ];

    Promise.all(tools.map((tool) => modelContext.registerTool(tool, { signal: controller.signal })))
      .then(() => setToolState('connected'))
      .catch(() => setToolState('preview'));

    return () => controller.abort();
  }, []);

  return (
    <main className="app-shell" data-mode={mode}>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="DSH Project Atlas home">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span>
            <strong>DSH</strong>
            <small>PROJECT ATLAS</small>
          </span>
        </a>

        <div className="project-switcher" aria-label="Current synthetic project">
          <span className="project-orb" aria-hidden="true" />
          <span>
            <small>ACTIVE PROJECT</small>
            <strong>Orchid Commerce</strong>
          </span>
          <span className="synthetic-tag">SYNTHETIC</span>
        </div>

        <div className="header-status">
          <span className={`connection-pill ${toolState}`}>
            <i aria-hidden="true" />
            {toolState === 'connected' ? 'WebMCP connected' : 'Browser preview'}
          </span>
          <span className="read-only-pill">READ ONLY</span>
        </div>
      </header>

      <section className="hero-strip" id="top">
        <div>
          <p className="eyebrow">{modeCopy[mode].eyebrow}</p>
          <h1>{modeCopy[mode].title}</h1>
        </div>
        <div className="view-tabs" role="tablist" aria-label="Graph view">
          {(Object.keys(modeCopy) as ViewMode[]).map((item) => (
            <button
              key={item}
              className={mode === item ? 'active' : ''}
              onClick={() => {
                setMode(item);
                setLastAction(`Human opened ${item} view`);
              }}
              role="tab"
              aria-selected={mode === item}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="snapshot-meta">
          <span><small>NAMESPACE</small><b>synthetic:orchid</b></span>
          <span><small>GRAPH</small><b>sha256: {fixtureArtifact.graphSha256.slice(0, 4)}…{fixtureArtifact.graphSha256.slice(-4)}</b></span>
          <span><small>INTEGRITY</small><b className="pass">PASS</b></span>
        </div>
      </section>

      <div className="workspace">
        <aside className="control-rail" aria-label="Graph controls">
          <div className="rail-section">
            <p className="rail-label">FIND IN GRAPH</p>
            <label className="search-box">
              <span aria-hidden="true">⌕</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Entity, route, capability…"
                aria-label="Find a graph entity"
              />
              <kbd>⌘ K</kbd>
            </label>
          </div>

          <div className="rail-section">
            <p className="rail-label">LAYERS</p>
            {[
              ['Interface', 1],
              ['Boundary', 2],
              ['Policy', 1],
              ['Runtime', 2],
              ['Evidence', 2],
            ].map(([label, count]) => (
              <button
                className={`layer-row ${activeLayer === label ? 'active' : ''}`}
                key={String(label)}
                onClick={() => setActiveLayer(activeLayer === label ? 'All' : label as GraphNode['layer'])}
                aria-pressed={activeLayer === label}
              >
                <span><i className={`layer-dot ${String(label).toLowerCase()}`} />{label}</span>
                <b>{count}</b>
              </button>
            ))}
          </div>

          <div className="rail-section tool-section">
            <div className="tool-title">
              <p className="rail-label">AGENT TOOLS</p>
              <span>{toolState === 'connected' ? '5 LIVE' : '5 DECLARED'}</span>
            </div>
            <p className="tool-intro">The agent uses structured tools—not pixels—to explore this exact view.</p>
            {[
              'inspect_project_overview',
              'focus_graph_entity',
              'trace_architecture_path',
              'list_security_findings',
              'compare_architecture_layers',
            ].map((tool) => (
              <div className="tool-row" key={tool}><i aria-hidden="true" />{tool}</div>
            ))}
          </div>

          <div className="agent-prompt">
            <p>TRY WITH YOUR AGENT</p>
            <blockquote>“Show me where catalog.read can bypass server enforcement.”</blockquote>
            <span>Shared page context · no database access</span>
          </div>
        </aside>

        <section className="graph-panel" aria-label="Project semantic graph">
          <div className="graph-toolbar">
            <div className="graph-title">
              <span className="pulse-dot" aria-hidden="true" />
              <span><small>SYNTHETIC ARCHITECTURAL OVERLAY</small><strong>Search capability chain</strong></span>
            </div>
            <div className="graph-stats">
              <span><b>{nodes.length}/{fixtureArtifact.graph.nodes.length}</b> entities</span>
              <span><b>{edges.length}/{fixtureArtifact.graph.edges.length}</b> relations</span>
              <span className="attention"><b>{findings.length}</b> findings</span>
            </div>
          </div>

          <div className="graph-canvas">
            <div className="grid-texture" aria-hidden="true" />
            {edges.map((edge, index) => {
              const from = nodes.find((node) => node.id === edge.from)!;
              const to = nodes.find((node) => node.id === edge.to)!;
              const horizontal = from.y === to.y;
              const left = Math.min(from.x, to.x) + 11;
              const top = Math.min(from.y, to.y) + 8;
              const width = horizontal ? Math.abs(to.x - from.x) - 10 : 2;
              const height = horizontal ? 2 : Math.abs(to.y - from.y) - 7;
              return (
                <span
                  className={`graph-edge ${edge.state} ${horizontal ? 'horizontal' : 'vertical'} ${highlightedEdgeIds.includes(graphEdgeKey(edge)) ? 'active-path' : ''}`}
                  key={`${edge.from}-${edge.to}`}
                  style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
                  title={edge.label}
                  aria-hidden="true"
                >
                  {index < 4 && <small>{edge.label}</small>}
                </span>
              );
            })}

            {nodes.map((node) => {
              const dimmed = !matchingNodes.has(node.id);
              return (
                <button
                  key={node.id}
                  className={`graph-node ${node.state} ${selected.id === node.id ? 'selected' : ''} ${highlightedNodeIds.includes(node.id) ? 'active-path' : ''} ${dimmed ? 'dimmed' : ''}`}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  onClick={() => focusNode(node.id)}
                  aria-pressed={selected.id === node.id}
                >
                  <span className="node-topline">
                    <small>{node.type}</small>
                    <i aria-hidden="true" />
                  </span>
                  <strong>{node.label}</strong>
                  <span>{node.subtitle}</span>
                  <em>{node.shortId}</em>
                </button>
              );
            })}

            <div className="graph-legend">
              <span><i className="verified" />Verified</span>
              <span><i className="unknown" />Unknown</span>
              <span><i className="blind-spot" />Blind spot</span>
              <span><i className="warning" />Needs proof</span>
            </div>
          </div>

          <section className={`agent-console ${consoleState.kind}`} aria-label="Live agent console">
            <div className="console-header">
              <div>
                <span className="console-live"><i aria-hidden="true" /> AGENT CONSOLE</span>
                <small>{demoStep}</small>
              </div>
              <button className="demo-button" onClick={runFullDemo} disabled={demoRunning}>
                {demoRunning ? 'DEMO RUNNING' : 'RUN FULL DEMO'} <span aria-hidden="true">▶</span>
              </button>
            </div>

            <div className="console-content">
              <div className="console-timeline" aria-label="Tool invocation timeline">
                {agentEvents.length === 0 ? (
                  <div className="console-empty">
                    <span>READY</span>
                    <p>Use WebMCP or run the guided replay.</p>
                  </div>
                ) : (
                  agentEvents.map((event) => (
                    <div className={`console-event ${event.decision}`} key={event.id}>
                      <i aria-hidden="true" />
                      <span>
                        <code>{event.toolName}</code>
                        <small>{event.summary}</small>
                      </span>
                      <b>{event.decision === 'allow-context' ? 'ALLOW' : event.decision.toUpperCase()}</b>
                    </div>
                  ))
                )}
              </div>

              <div className="console-result" aria-live="polite">
                {consoleState.kind === 'overview' && (
                  <div className="result-overview">
                    <p>PINNED PROJECT OVERVIEW</p>
                    <strong>Integrity verified. Runtime uncertainty is still visible.</strong>
                    <div className="metric-row">
                      <span><b>{fixtureArtifact.graph.nodes.length}</b> nodes</span>
                      <span><b>{fixtureArtifact.graph.edges.length}</b> relations</span>
                      <span><b>{fixtureArtifact.graph.unknowns.length}</b> unknown</span>
                      <span className="pass"><b>PASS</b> integrity</span>
                    </div>
                  </div>
                )}

                {consoleState.kind === 'focus' && (() => {
                  const focused = nodes.find((node) => node.id === consoleState.entityId)!;
                  return (
                    <div className="result-focus">
                      <p>EXACT ENTITY · {focused.type}</p>
                      <strong>{focused.label}</strong>
                      <code>{focused.id}</code>
                      <span className={`result-state ${focused.state}`}>{stateLabel(focused.state)}</span>
                      <small>
                        {focused.state === 'warning'
                          ? 'Capability is declared; exact server-side enforcement evidence is not proven.'
                          : 'The inspector and graph now share this exact source-backed entity.'}
                      </small>
                    </div>
                  );
                })()}

                {consoleState.kind === 'path' && (
                  <div className="result-path">
                    <p>BOUNDED SOURCE-BACKED PATH</p>
                    <strong>{consoleState.entities.length} entities · {consoleState.relations.length} relations</strong>
                    <div className="path-strip">
                      {consoleState.entities.map((entityId, index) => (
                        <span key={entityId}>
                          <b>{nodes.find((node) => node.id === entityId)?.label}</b>
                          {index < consoleState.entities.length - 1 && <i aria-hidden="true">→</i>}
                        </span>
                      ))}
                    </div>
                    <small><i className="warning-dot" /> 1 relation still needs server-side proof · mutation: false</small>
                  </div>
                )}

                {consoleState.kind === 'finding' && (
                  <div className="result-finding">
                    <div><span className={`severity ${consoleState.finding.severity}`}>{consoleState.finding.severity}</span><code>{consoleState.finding.id}</code><b>{consoleState.finding.state}</b></div>
                    <strong>{consoleState.finding.title}</strong>
                    <p>{consoleState.finding.detail}</p>
                    <small>Exact entity · {consoleState.finding.nodeId}</small>
                  </div>
                )}

                {consoleState.kind === 'comparison' && (
                  <div className="result-comparison">
                    <p>EXPECTED ↔ OBSERVED · {consoleState.scope.toUpperCase()}</p>
                    <div className="comparison-snapshots">
                      <span><small>EXPECTED</small><b>snp_expected_004</b></span>
                      <i aria-hidden="true">≠</i>
                      <span><small>OBSERVED</small><b>win_observed_018</b></span>
                    </div>
                    <div className="preserved-states">
                      <span className="unknown">UNKNOWN</span>
                      <span className="blind-spot">BLIND SPOT</span>
                      <span className="review">REVIEW</span>
                      <small>Nothing was promoted to verified.</small>
                    </div>
                  </div>
                )}

                {consoleState.kind === 'deny' && (
                  <div className="result-deny" role="alert">
                    <p>FAIL-CLOSED · LOCAL SAFETY REHEARSAL</p>
                    <strong>Unknown entity rejected</strong>
                    <code>requested: {consoleState.requestedId}</code>
                    <span>reason: {consoleState.reason}</span>
                    <small>
                      selected before/after: {consoleState.selectedBefore} / {consoleState.selectedAfter}
                      <b>SELECTION UNCHANGED · mutation: false</b>
                    </small>
                  </div>
                )}
              </div>
            </div>
          </section>

          <div className="activity-line" aria-live="polite">
            <span>LAST SHARED ACTION</span>
            <p>{lastAction}</p>
            <time>just now</time>
          </div>
        </section>

        <aside className="inspector" aria-label="Selected entity inspector">
          <div className="inspector-heading">
            <span>INSPECTOR</span>
            <small>EXACT ENTITY</small>
          </div>

          <div className="entity-identity">
            <div className={`entity-icon ${selected.state}`}>{selected.shortId.split('-')[0]}</div>
            <div>
              <p>{selected.type}</p>
              <h2>{selected.label}</h2>
              <code>{selected.id}</code>
            </div>
          </div>

          <div className={`state-banner ${selected.state}`}>
            <span><i aria-hidden="true" />{stateLabel(selected.state)}</span>
            <small>{selected.state === 'verified' ? 'Source-backed relation' : 'Not safe to promote'}</small>
          </div>

          <dl className="fact-list">
            <div><dt>Layer</dt><dd>{selected.layer}</dd></div>
            <div><dt>Confidence</dt><dd>{selected.confidence}</dd></div>
            <div><dt>Namespace</dt><dd>synthetic:orchid</dd></div>
            <div><dt>Last observed</dt><dd>{selected.layer === 'Evidence' ? '14:22:08 UTC' : 'Not applicable'}</dd></div>
          </dl>

          <div className="provenance-card">
            <p>PROVENANCE</p>
            <code>{selected.provenance}</code>
            <span>Overlay reference · engine fixture verified separately</span>
          </div>

          <div className="inspector-note">
            <span>Why this matters</span>
            <p>
              {selected.state === 'warning'
                ? 'The policy is declared, but this handler needs exact server-side enforcement evidence before the chain can be trusted.'
                : selected.state === 'blind-spot'
                  ? 'Missing observation is preserved as a blind spot. It is never treated as proof that a path does not exist.'
                  : 'This fact stays attached to its exact source and cannot silently cross into another project.'}
            </p>
          </div>

          <button
            className="source-button"
            onClick={() => setLastAction(`Human inspected ${selected.provenance}`)}
          >
            Inspect source reference <span>↗</span>
          </button>
          <p className="inspector-lock">No edit, deploy, SQL or production controls exist.</p>
        </aside>
      </div>

    </main>
  );
}
