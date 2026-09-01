'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import fixtureArtifact from '@/data/orchid-graph.v1.json';

type ViewMode = 'Architecture' | 'Now' | 'Deviations' | 'History';
type GraphPresentation = 'map' | 'path';
type NodeState = 'verified' | 'unknown' | 'blind-spot' | 'warning';
type EdgeState = NodeState | 'bypass';
type GraphLayer = 'Interface' | 'Boundary' | 'Policy' | 'Runtime' | 'Data' | 'Evidence';
type GraphDomain =
  | 'Experience'
  | 'Delivery'
  | 'Capability control'
  | 'Execution'
  | 'Owned data'
  | 'Evidence';

type GraphPosition = { x: number; y: number };

type GraphNode = {
  id: string;
  shortId: string;
  type: string;
  label: string;
  subtitle: string;
  layer: GraphLayer;
  domain: GraphDomain;
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
  state: EdgeState;
  bend?: number;
  route?: 'upper-review-lane';
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
  | { kind: 'summary' }
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

declare global {
  interface Document {
    modelContext: ModelContext;
  }
}

const nodes: GraphNode[] = [
  {
    id: 'screen:project-search',
    shortId: 'UI-01',
    type: 'SCREEN',
    label: 'Project search',
    subtitle: 'Human workspace',
    layer: 'Interface',
    domain: 'Experience',
    state: 'verified',
    confidence: '1.00',
    provenance: 'overlay/ui/search-screen.synthetic · L12–48',
    x: 7,
    y: 14,
  },
  {
    id: 'screen:catalog-board',
    shortId: 'UI-03',
    type: 'SCREEN',
    label: 'Catalog board',
    subtitle: 'Second read consumer',
    layer: 'Interface',
    domain: 'Experience',
    state: 'verified',
    confidence: '0.98',
    provenance: 'overlay/ui/catalog-board.synthetic · L9–37',
    x: 7,
    y: 40,
  },
  {
    id: 'screen:catalog-admin',
    shortId: 'UI-07',
    type: 'SCREEN',
    label: 'Catalog admin',
    subtitle: 'Mutation surface',
    layer: 'Interface',
    domain: 'Experience',
    state: 'verified',
    confidence: '0.96',
    provenance: 'overlay/ui/catalog-admin.synthetic · L16–61',
    x: 7,
    y: 66,
  },
  {
    id: 'agent:webmcp-review',
    shortId: 'AG-05',
    type: 'AGENT',
    label: 'WebMCP reviewer',
    subtitle: 'Read-only collaborator',
    layer: 'Interface',
    domain: 'Experience',
    state: 'verified',
    confidence: '1.00',
    provenance: 'overlay/agent/webmcp-review.synthetic · #/five-tools',
    x: 9,
    y: 90,
  },
  {
    id: 'route:search',
    shortId: 'RT-04',
    type: 'ROUTE',
    label: '/search',
    subtitle: 'Browser boundary',
    layer: 'Boundary',
    domain: 'Delivery',
    state: 'verified',
    confidence: '1.00',
    provenance: 'overlay/ui/router.synthetic · L8–15',
    x: 23,
    y: 13,
  },
  {
    id: 'api:lookup',
    shortId: 'API-02',
    type: 'API',
    label: 'GET /lookup',
    subtitle: 'Bounded query',
    layer: 'Boundary',
    domain: 'Delivery',
    state: 'verified',
    confidence: '0.98',
    provenance: 'overlay/service/lookup-api.synthetic · L20–55',
    x: 35,
    y: 27,
  },
  {
    id: 'route:catalog-admin',
    shortId: 'RT-09',
    type: 'ROUTE',
    label: '/catalog/admin',
    subtitle: 'Approved mutation route',
    layer: 'Boundary',
    domain: 'Delivery',
    state: 'verified',
    confidence: '0.99',
    provenance: 'overlay/ui/catalog-router.synthetic · L31–49',
    x: 23,
    y: 56,
  },
  {
    id: 'api:catalog-update',
    shortId: 'API-08',
    type: 'API',
    label: 'PATCH /catalog',
    subtitle: 'Bounded command',
    layer: 'Boundary',
    domain: 'Delivery',
    state: 'verified',
    confidence: '0.97',
    provenance: 'overlay/service/catalog-update.synthetic · L11–63',
    x: 35,
    y: 68,
  },
  {
    id: 'tool:compare-layers',
    shortId: 'TL-05',
    type: 'TOOL',
    label: 'Compare layers',
    subtitle: 'Structured WebMCP call',
    layer: 'Boundary',
    domain: 'Delivery',
    state: 'verified',
    confidence: '1.00',
    provenance: 'overlay/webmcp/compare-layers.synthetic · #/tool',
    x: 29,
    y: 90,
  },
  {
    id: 'capability:catalog-read',
    shortId: 'CAP-17',
    type: 'CAPABILITY',
    label: 'catalog.read',
    subtitle: 'Read-only policy',
    layer: 'Policy',
    domain: 'Capability control',
    state: 'verified',
    confidence: '1.00',
    provenance: 'overlay/policy/catalog-read.synthetic · #/catalog.read',
    x: 51,
    y: 27,
  },
  {
    id: 'capability:catalog-write',
    shortId: 'CAP-24',
    type: 'CAPABILITY',
    label: 'catalog.write',
    subtitle: 'Mutation policy',
    layer: 'Policy',
    domain: 'Capability control',
    state: 'verified',
    confidence: '1.00',
    provenance: 'overlay/policy/catalog-write.synthetic · #/catalog.write',
    x: 51,
    y: 64,
  },
  {
    id: 'capability:audit-read',
    shortId: 'CAP-31',
    type: 'CAPABILITY',
    label: 'audit.read',
    subtitle: 'Evidence policy',
    layer: 'Policy',
    domain: 'Capability control',
    state: 'verified',
    confidence: '1.00',
    provenance: 'overlay/policy/audit-read.synthetic · #/audit.read',
    x: 51,
    y: 90,
  },
  {
    id: 'handler:lookup',
    shortId: 'HD-02',
    type: 'HANDLER',
    label: 'Lookup handler',
    subtitle: 'Server enforcement',
    layer: 'Runtime',
    domain: 'Execution',
    state: 'warning',
    confidence: '0.64',
    provenance: 'overlay/evidence/missing-server-enforcement.synthetic',
    x: 68,
    y: 27,
  },
  {
    id: 'handler:catalog-update',
    shortId: 'HD-06',
    type: 'HANDLER',
    label: 'Catalog update',
    subtitle: 'Owner command handler',
    layer: 'Runtime',
    domain: 'Execution',
    state: 'verified',
    confidence: '0.97',
    provenance: 'overlay/runtime/catalog-update.synthetic · L44–96',
    x: 68,
    y: 63,
  },
  {
    id: 'handler:audit-query',
    shortId: 'HD-11',
    type: 'HANDLER',
    label: 'Audit query',
    subtitle: 'Minimized evidence view',
    layer: 'Runtime',
    domain: 'Execution',
    state: 'verified',
    confidence: '0.95',
    provenance: 'overlay/runtime/audit-query.synthetic · L20–72',
    x: 68,
    y: 90,
  },
  {
    id: 'store:catalog',
    shortId: 'DB-01',
    type: 'STORE',
    label: 'Catalog store',
    subtitle: 'Owned data',
    layer: 'Data',
    domain: 'Owned data',
    state: 'verified',
    confidence: '0.97',
    provenance: 'overlay/storage/catalog.synthetic · L1–32',
    x: 86,
    y: 43,
  },
  {
    id: 'store:audit-log',
    shortId: 'DB-05',
    type: 'STORE',
    label: 'Audit log',
    subtitle: 'Append-only evidence',
    layer: 'Data',
    domain: 'Owned data',
    state: 'verified',
    confidence: '0.94',
    provenance: 'overlay/storage/audit-log.synthetic · L1–47',
    x: 86,
    y: 71,
  },
  {
    id: 'audit:query',
    shortId: 'AU-03',
    type: 'AUDIT',
    label: 'Query receipt',
    subtitle: 'Minimized evidence',
    layer: 'Evidence',
    domain: 'Evidence',
    state: 'unknown',
    confidence: '0.42',
    provenance: 'overlay/evidence/observed-search.synthetic · partial',
    x: 86,
    y: 16,
  },
  {
    id: 'telemetry:window',
    shortId: 'OBS-08',
    type: 'OBSERVED',
    label: 'Runtime window',
    subtitle: 'Coverage 72%',
    layer: 'Evidence',
    domain: 'Evidence',
    state: 'blind-spot',
    confidence: '0.31',
    provenance: 'overlay/evidence/telemetry-gap.synthetic',
    x: 90,
    y: 90,
  },
];

const edges: GraphEdge[] = [
  { from: 'screen:project-search', to: 'route:search', label: 'navigates', state: 'verified' },
  { from: 'screen:catalog-board', to: 'route:search', label: 'reuses', state: 'verified', bend: 6 },
  { from: 'route:search', to: 'api:lookup', label: 'requests', state: 'verified' },
  { from: 'api:lookup', to: 'capability:catalog-read', label: 'requires', state: 'verified' },
  { from: 'capability:catalog-read', to: 'handler:lookup', label: 'guards?', state: 'warning' },
  { from: 'handler:lookup', to: 'store:catalog', label: 'reads', state: 'verified' },
  { from: 'store:catalog', to: 'audit:query', label: 'records?', state: 'unknown', bend: 8 },
  { from: 'audit:query', to: 'telemetry:window', label: 'observed by', state: 'blind-spot', bend: 10 },
  { from: 'screen:catalog-admin', to: 'route:catalog-admin', label: 'navigates', state: 'verified' },
  { from: 'route:catalog-admin', to: 'api:catalog-update', label: 'requests', state: 'verified' },
  { from: 'api:catalog-update', to: 'capability:catalog-write', label: 'requires', state: 'verified' },
  { from: 'capability:catalog-write', to: 'handler:catalog-update', label: 'guards', state: 'verified' },
  { from: 'handler:catalog-update', to: 'store:catalog', label: 'writes', state: 'verified' },
  { from: 'handler:catalog-update', to: 'store:audit-log', label: 'audits', state: 'verified' },
  { from: 'agent:webmcp-review', to: 'tool:compare-layers', label: 'invokes', state: 'verified' },
  { from: 'tool:compare-layers', to: 'capability:audit-read', label: 'requires', state: 'verified' },
  { from: 'capability:audit-read', to: 'handler:audit-query', label: 'guards', state: 'verified' },
  { from: 'handler:audit-query', to: 'store:audit-log', label: 'reads', state: 'verified' },
  { from: 'store:audit-log', to: 'telemetry:window', label: 'projects', state: 'verified' },
  {
    from: 'screen:catalog-admin',
    to: 'handler:catalog-update',
    label: 'BYPASS',
    state: 'bypass',
    route: 'upper-review-lane',
  },
];

const findings: Finding[] = [
  {
    id: 'DSH-080',
    severity: 'high',
    title: 'Legacy mutation bypasses capability control',
    detail: 'A direct UI-to-handler path skips the approved route, API, and catalog.write capability.',
    nodeId: 'handler:catalog-update',
    state: 'REVIEW',
  },
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
  Architecture: { eyebrow: 'SYSTEM MAP', title: 'Capabilities, consumers and trust boundaries' },
  Now: { eyebrow: 'DEPLOYED + OBSERVED', title: 'What can be proven right now' },
  Deviations: { eyebrow: 'DIFF MODE', title: 'Where reality diverges from intent' },
  History: { eyebrow: 'IMMUTABLE TIMELINE', title: 'How the architecture changed' },
};

const layerOrder: GraphLayer[] = ['Interface', 'Boundary', 'Policy', 'Runtime', 'Data', 'Evidence'];
const domainClusters = [
  { id: 'surfaces', label: 'SURFACES', left: 1, top: 4, width: 15, height: 92 },
  { id: 'delivery', label: 'ROUTES + API', left: 18, top: 4, width: 23, height: 92 },
  { id: 'capabilities', label: 'CAPABILITY CONTROL', left: 43, top: 4, width: 16, height: 92 },
  { id: 'handlers', label: 'BACKEND OWNERS', left: 60.5, top: 4, width: 15, height: 92 },
  { id: 'data', label: 'OWNED DATA', left: 77, top: 30, width: 20, height: 50 },
  { id: 'audit', label: 'AUDIT CONTRACT', left: 77, top: 4, width: 20, height: 23 },
  { id: 'observed', label: 'OBSERVED EVIDENCE', left: 79, top: 83, width: 19, height: 15 },
] as const;

const DEMO_STAGES = [
  { label: 'PROJECT + SAFETY', timecode: '0:00–0:12', durationMs: 12_000 },
  { label: 'SHARED ENTITY', timecode: '0:12–0:22', durationMs: 10_000 },
  { label: 'BOUNDED READ PATH', timecode: '0:22–0:41', durationMs: 19_000 },
  { label: 'CAPABILITY + CONSUMERS', timecode: '0:41–0:54', durationMs: 13_000 },
  { label: 'VISIBLE BYPASS', timecode: '0:54–1:08', durationMs: 14_000 },
  { label: 'SERVER PROOF', timecode: '1:08–1:21', durationMs: 13_000 },
  { label: 'EXPECTED VS OBSERVED', timecode: '1:21–1:39', durationMs: 18_000 },
  { label: 'BLIND SPOT', timecode: '1:39–1:50', durationMs: 11_000 },
  { label: 'REVIEW EVIDENCE', timecode: '1:50–2:01', durationMs: 11_000 },
  { label: 'FAIL CLOSED', timecode: '2:01–2:17', durationMs: 16_000 },
  { label: 'READ-ONLY AGENT', timecode: '2:17–2:29', durationMs: 12_000 },
  { label: 'JURY SUMMARY', timecode: '2:29–2:45', durationMs: 16_000 },
] as const;
const DEMO_TOTAL_MS = DEMO_STAGES.reduce((total, stage) => total + stage.durationMs, 0);
const DEMO_DURATION_LABEL = '2:45';
const MIN_GRAPH_SCALE = 0.75;
const MAX_GRAPH_SCALE = 1.4;

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
    for (const edge of edges.filter(
      (candidate) => candidate.from === current.entityId && candidate.state !== 'bypass',
    )) {
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

function graphPosition(node: GraphNode, presentation: GraphPresentation, pathEntities: string[]): GraphPosition {
  if (presentation === 'map') return { x: node.x, y: node.y };
  const index = pathEntities.indexOf(node.id);
  const spacing = pathEntities.length > 1 ? 82 / (pathEntities.length - 1) : 0;
  return { x: 9 + Math.max(0, index) * spacing, y: 48 };
}

function graphEdgePath(edge: GraphEdge, from: GraphPosition, to: GraphPosition) {
  if (edge.route === 'upper-review-lane') {
    const laneY = 42;
    const exitSourceX = from.x + 7;
    const enterLaneX = from.x + 10;
    const leaveLaneX = to.x - 10;
    return `M ${from.x} ${from.y} C ${from.x + 3} ${from.y}, ${from.x + 5} ${from.y}, ${exitSourceX} ${from.y} C ${exitSourceX + 1} ${from.y}, ${exitSourceX + 1} ${laneY}, ${enterLaneX} ${laneY} L ${leaveLaneX} ${laneY} C ${to.x - 4} ${laneY}, ${to.x - 4} ${to.y}, ${to.x} ${to.y}`;
  }
  const vertical = Math.abs(to.x - from.x) < 6;
  if (vertical) {
    const offset = edge.bend ?? 7;
    return `M ${from.x} ${from.y} C ${from.x + offset} ${from.y}, ${to.x + offset} ${to.y}, ${to.x} ${to.y}`;
  }
  const midpoint = (from.x + to.x) / 2;
  const bend = edge.bend ?? 0;
  return `M ${from.x} ${from.y} C ${midpoint} ${from.y + bend}, ${midpoint} ${to.y + bend}, ${to.x} ${to.y}`;
}

function graphEdgeLabelPosition(edge: GraphEdge, from: GraphPosition, to: GraphPosition): GraphPosition {
  if (edge.route === 'upper-review-lane') {
    return { x: 43, y: 42 };
  }
  return {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2 + (edge.bend ?? 0) * 0.55,
  };
}

function clampGraphScale(value: number) {
  return Math.min(MAX_GRAPH_SCALE, Math.max(MIN_GRAPH_SCALE, value));
}

function graphEdgeKey(edge: GraphEdge) {
  return `${edge.from}->${edge.to}`;
}

function waitForDemo(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function focusExplanation(node: GraphNode) {
  if (node.id === 'capability:catalog-write') {
    return 'One stable policy connects the approved route, API, owner handler and every known consumer.';
  }
  if (node.id === 'agent:webmcp-review') {
    return 'The agent can inspect five bounded tools; no mutation, database, shell, deploy or production control exists.';
  }
  if (node.state === 'warning') {
    return 'Capability is declared; exact server-side enforcement evidence is not proven.';
  }
  if (node.state === 'blind-spot') {
    return 'Runtime evidence covers only 72%; the missing window stays a visible blind spot.';
  }
  return 'The inspector and graph now share this exact source-backed entity.';
}

export default function Home() {
  const [mode, setMode] = useState<ViewMode>('Architecture');
  const [graphPresentation, setGraphPresentation] = useState<GraphPresentation>('map');
  const [selectedId, setSelectedId] = useState('handler:lookup');
  const [query, setQuery] = useState('');
  const [activeLayer, setActiveLayer] = useState<GraphLayer | 'All'>('All');
  const [toolState, setToolState] = useState<'connected' | 'preview'>('preview');
  const [lastAction, setLastAction] = useState('Human selected Lookup handler');
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<string[]>([]);
  const [highlightedEdgeIds, setHighlightedEdgeIds] = useState<string[]>([]);
  const [consoleState, setConsoleState] = useState<ConsoleState>({ kind: 'overview' });
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([]);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoStep, setDemoStep] = useState('READY · 2:45 GUIDED REHEARSAL');
  const [demoProgress, setDemoProgress] = useState(0);
  const [camera, setCamera] = useState({ scale: 1, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const selectedIdRef = useRef(selectedId);
  const eventSequence = useRef(0);
  const demoRun = useRef(0);
  const consoleTimelineRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const selected = nodes.find((node) => node.id === selectedId) ?? nodes[0];
  const canonicalPath = useMemo(
    () => findGraphPath('screen:project-search', 'store:catalog')!,
    [],
  );
  const activePath = consoleState.kind === 'path' ? consoleState : canonicalPath;
  const presentedNodes = graphPresentation === 'path'
    ? nodes.filter((node) => activePath.entities.includes(node.id))
    : nodes;
  const presentedEdges = graphPresentation === 'path' ? activePath.relations : edges;
  const selectedNeighborhood = useMemo(() => {
    const related = new Set([selected.id]);
    for (const edge of edges) {
      if (edge.from === selected.id || edge.to === selected.id) {
        related.add(edge.from);
        related.add(edge.to);
      }
    }
    return related;
  }, [selected.id]);
  const showSelectedNeighborhood = graphPresentation === 'map' && consoleState.kind === 'focus';
  const incomingRelations = edges.filter((edge) => edge.to === selected.id);
  const outgoingRelations = edges.filter((edge) => edge.from === selected.id);
  const selectedHasBypass = [...incomingRelations, ...outgoingRelations]
    .some((edge) => edge.state === 'bypass');
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

  function resetGraphCamera() {
    setCamera({ scale: 1, x: 0, y: 0 });
  }

  function openMap(source = 'Human') {
    setGraphPresentation('map');
    resetGraphCamera();
    setHighlightedNodeIds([]);
    setHighlightedEdgeIds([]);
    setConsoleState({ kind: 'overview' });
    setLastAction(`${source} opened the complete capability map`);
  }

  function openCanonicalPath() {
    setGraphPresentation('path');
    resetGraphCamera();
    setSelectedNode(canonicalPath.entities.at(-1) ?? 'store:catalog');
    setHighlightedNodeIds(canonicalPath.entities);
    setHighlightedEdgeIds(canonicalPath.relations.map(graphEdgeKey));
    setConsoleState({ kind: 'path', entities: canonicalPath.entities, relations: canonicalPath.relations });
    setLastAction('Human opened the bounded search-to-data path');
  }

  function changeGraphScale(delta: number) {
    setCamera((current) => ({ ...current, scale: clampGraphScale(current.scale + delta) }));
  }

  function handleGraphWheel(event: ReactWheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -0.08 : 0.08;
    changeGraphScale(direction);
  }

  function handleGraphPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const target = event.target;
    if (target instanceof Element && target.closest('button, input, .graph-legend, .graph-edge-label')) return;
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: camera.x,
      originY: camera.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function handleGraphPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setCamera((current) => ({
      ...current,
      x: drag.originX + event.clientX - drag.startX,
      y: drag.originY + event.clientY - drag.startY,
    }));
  }

  function handleGraphPointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragState.current?.pointerId !== event.pointerId) return;
    dragState.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
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
    setGraphPresentation('map');
    resetGraphCamera();
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
    setGraphPresentation('map');
    resetGraphCamera();
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
    setGraphPresentation('path');
    resetGraphCamera();
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
    setGraphPresentation('map');
    resetGraphCamera();
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
    setGraphPresentation('map');
    resetGraphCamera();
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
    setMode('Architecture');
    setQuery('');
    setActiveLayer('All');
    setDemoProgress(0);

    const continueDemo = () => demoRun.current === runId;
    const pause = async (durationMs: number) => {
      await waitForDemo(durationMs);
      return continueDemo();
    };
    const beginStage = (index: number) => {
      const stage = DEMO_STAGES[index];
      const elapsedMs = DEMO_STAGES
        .slice(0, index)
        .reduce((total, candidate) => total + candidate.durationMs, 0);
      setDemoProgress((elapsedMs / DEMO_TOTAL_MS) * 100);
      setDemoStep(`${index + 1} / ${DEMO_STAGES.length} · ${stage.timecode} · ${stage.label}`);
      return stage;
    };

    let stage = beginStage(0);
    inspectProjectOverview();
    if (!(await pause(stage.durationMs))) return;

    stage = beginStage(1);
    focusExactEntity('screen:project-search');
    if (!(await pause(stage.durationMs))) return;

    stage = beginStage(2);
    const traced = traceArchitecturePath('screen:project-search', 'store:catalog');
    let pathAnimationMs = 0;
    if (Array.isArray(traced.entities)) {
      for (const entityId of traced.entities) {
        if (!continueDemo()) return;
        setSelectedNode(entityId);
        await waitForDemo(1_300);
        pathAnimationMs += 1_300;
      }
    }
    if (!(await pause(Math.max(0, stage.durationMs - pathAnimationMs)))) return;

    stage = beginStage(3);
    focusExactEntity('capability:catalog-write');
    if (!(await pause(stage.durationMs))) return;

    stage = beginStage(4);
    listSecurityFindings('high');
    if (!(await pause(stage.durationMs))) return;

    stage = beginStage(5);
    focusExactEntity('handler:lookup');
    if (!(await pause(stage.durationMs))) return;

    stage = beginStage(6);
    compareArchitectureLayers('all');
    if (!(await pause(stage.durationMs))) return;

    stage = beginStage(7);
    focusExactEntity('telemetry:window');
    if (!(await pause(stage.durationMs))) return;

    stage = beginStage(8);
    listSecurityFindings('info');
    if (!(await pause(stage.durationMs))) return;

    stage = beginStage(9);
    focusExactEntity('handler:payment');
    if (!(await pause(stage.durationMs))) return;

    stage = beginStage(10);
    setMode('Architecture');
    focusExactEntity('agent:webmcp-review');
    if (!(await pause(stage.durationMs))) return;

    stage = beginStage(11);
    setMode('Architecture');
    focusExactEntity('handler:lookup');
    setConsoleState({ kind: 'summary' });
    setLastAction('Guided rehearsal complete; five read-only WebMCP tools remain available to the agent');
    if (!(await pause(stage.durationMs))) return;

    setDemoProgress(100);
    setDemoStep(`DEMO COMPLETE · ${DEMO_DURATION_LABEL} · READ ONLY`);
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
    const timeline = consoleTimelineRef.current;
    if (timeline) timeline.scrollTop = timeline.scrollHeight;
  }, [agentEvents]);

  useEffect(() => {
    if (!document.modelContext?.registerTool) return;

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

    Promise.all(tools.map((tool) => document.modelContext.registerTool(tool, { signal: controller.signal })))
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
            {layerOrder.map((label) => (
              <button
                className={`layer-row ${activeLayer === label ? 'active' : ''}`}
                key={label}
                onClick={() => setActiveLayer(activeLayer === label ? 'All' : label)}
                aria-pressed={activeLayer === label}
              >
                <span><i className={`layer-dot ${label.toLowerCase()}`} />{label}</span>
                <b>{nodes.filter((node) => node.layer === label).length}</b>
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
              <span>
                <small>SYNTHETIC ARCHITECTURAL OVERLAY</small>
                <strong>
                  {graphPresentation === 'map'
                    ? 'Capability map · consumers, owners and bypasses'
                    : 'Bounded path · interface to owned data'}
                </strong>
              </span>
            </div>
            <div className="graph-toolbar-actions">
              <div className="presentation-toggle" aria-label="Graph presentation">
                <button
                  className={graphPresentation === 'map' ? 'active' : ''}
                  onClick={() => openMap()}
                  aria-pressed={graphPresentation === 'map'}
                >
                  MAP
                </button>
                <button
                  className={graphPresentation === 'path' ? 'active' : ''}
                  onClick={openCanonicalPath}
                  aria-pressed={graphPresentation === 'path'}
                >
                  PATH
                </button>
              </div>
              <div className="graph-stats">
                <span><b>{nodes.length}</b> entities</span>
                <span><b>{edges.length}</b> relations</span>
                <span className="attention"><b>{findings.length}</b> findings</span>
              </div>
            </div>
          </div>

          <div
            className={`graph-canvas ${dragging ? 'dragging' : ''}`}
            onWheel={handleGraphWheel}
            onPointerDown={handleGraphPointerDown}
            onPointerMove={handleGraphPointerMove}
            onPointerUp={handleGraphPointerEnd}
            onPointerCancel={handleGraphPointerEnd}
          >
            <div className="grid-texture" aria-hidden="true" />
            <div
              className={`graph-world ${graphPresentation}`}
              style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})` }}
            >
              {graphPresentation === 'map' && domainClusters.map((cluster) => (
                <div
                  className={`domain-cluster ${cluster.id}`}
                  key={cluster.id}
                  style={{
                    left: `${cluster.left}%`,
                    top: `${cluster.top}%`,
                    width: `${cluster.width}%`,
                    height: `${cluster.height}%`,
                  }}
                  aria-hidden="true"
                >
                  <span>{cluster.label}</span>
                </div>
              ))}

              <svg className="graph-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {presentedEdges.map((edge) => {
                  const fromNode = nodes.find((node) => node.id === edge.from)!;
                  const toNode = nodes.find((node) => node.id === edge.to)!;
                  const from = graphPosition(fromNode, graphPresentation, activePath.entities);
                  const to = graphPosition(toNode, graphPresentation, activePath.entities);
                  const active = graphPresentation === 'path' || highlightedEdgeIds.includes(graphEdgeKey(edge));
                  return (
                    <path
                      className={`graph-link ${edge.state} ${active ? 'active-path' : ''}`}
                      d={graphEdgePath(edge, from, to)}
                      key={graphEdgeKey(edge)}
                      vectorEffect="non-scaling-stroke"
                    >
                      <title>{`${edge.from} ${edge.label} ${edge.to}`}</title>
                    </path>
                  );
                })}
              </svg>

              {presentedEdges
                .filter((edge) => edge.state === 'bypass' || edge.state === 'warning')
                .map((edge) => {
                  const fromNode = nodes.find((node) => node.id === edge.from)!;
                  const toNode = nodes.find((node) => node.id === edge.to)!;
                  const from = graphPosition(fromNode, graphPresentation, activePath.entities);
                  const to = graphPosition(toNode, graphPresentation, activePath.entities);
                  const labelPosition = graphEdgeLabelPosition(edge, from, to);
                  return (
                    <span
                      className={`graph-edge-label ${edge.state}`}
                      key={`label-${graphEdgeKey(edge)}`}
                      style={{ left: `${labelPosition.x}%`, top: `${labelPosition.y}%` }}
                    >
                      {edge.label}
                    </span>
                  );
                })}

              {presentedNodes.map((node) => {
                const position = graphPosition(node, graphPresentation, activePath.entities);
                const dimmed = !matchingNodes.has(node.id)
                  || (showSelectedNeighborhood && !selectedNeighborhood.has(node.id));
                const onPath = graphPresentation === 'path' || highlightedNodeIds.includes(node.id);
                return (
                  <button
                    key={node.id}
                    className={`graph-node ${node.state} ${selected.id === node.id ? 'selected' : ''} ${onPath ? 'active-path' : ''} ${dimmed ? 'dimmed' : ''}`}
                    style={{ left: `${position.x}%`, top: `${position.y}%` }}
                    onClick={() => focusNode(node.id)}
                    aria-pressed={selected.id === node.id}
                    aria-label={`${node.type}: ${node.label}. ${stateLabel(node.state)}.`}
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
            </div>

            <div className="graph-camera-controls" aria-label="Graph zoom controls">
              <button onClick={() => changeGraphScale(-0.1)} aria-label="Zoom out">−</button>
              <button onClick={resetGraphCamera} className="fit-button">FIT</button>
              <span>{Math.round(camera.scale * 100)}%</span>
              <button onClick={() => changeGraphScale(0.1)} aria-label="Zoom in">+</button>
            </div>

            <p className="graph-pan-hint">Drag empty space to pan · wheel to zoom</p>

            <div className="graph-legend">
              <span><i className="verified" />Verified</span>
              <span><i className="warning" />Needs proof</span>
              <span><i className="bypass" />Bypass</span>
              <span><i className="unknown" />Unknown</span>
              <span><i className="blind-spot" />Blind spot</span>
            </div>
          </div>

          <section className={`agent-console ${consoleState.kind}`} aria-label="Live agent console">
            <div className="console-header">
              <div>
                <span className="console-live"><i aria-hidden="true" /> AGENT CONSOLE</span>
                <span className="demo-status">
                  <small>{demoStep}</small>
                  <i aria-hidden="true"><b style={{ width: `${demoProgress}%` }} /></i>
                </span>
              </div>
              <button className="demo-button" onClick={runFullDemo} disabled={demoRunning}>
                {demoRunning ? 'GUIDED REHEARSAL RUNNING' : `RUN ${DEMO_DURATION_LABEL} GUIDED DEMO`} <span aria-hidden="true">▶</span>
              </button>
            </div>

            <div className="console-content">
              <div ref={consoleTimelineRef} className="console-timeline" aria-label="Tool invocation timeline">
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
                      <small>{focusExplanation(focused)}</small>
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

                {consoleState.kind === 'summary' && (
                  <div className="result-summary">
                    <p>JURY SUMMARY · SHARED ARCHITECTURE WORKSPACE</p>
                    <strong>People and agents investigate the same exact, evidence-aware graph.</strong>
                    <div>
                      <span><b>5 / 5</b> read-only tools exercised</span>
                      <span><b>1</b> bypass exposed</span>
                      <span><b>3</b> uncertainty states preserved</span>
                      <span><b>0</b> mutations allowed</span>
                    </div>
                    <small>Isolated namespace · Apache-2.0 core · no DB, shell, deploy or production controls</small>
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
            <div className={`entity-icon ${selectedHasBypass ? 'bypass' : selected.state}`}>{selected.shortId.split('-')[0]}</div>
            <div>
              <p>{selected.type}</p>
              <h2>{selected.label}</h2>
              <code>{selected.id}</code>
            </div>
          </div>

          <div className={`state-banner ${selectedHasBypass ? 'bypass' : selected.state}`}>
            <span><i aria-hidden="true" />{selectedHasBypass ? 'BYPASS CONNECTED' : stateLabel(selected.state)}</span>
            <small>{selectedHasBypass ? 'Review required' : selected.state === 'verified' ? 'Source-backed relation' : 'Not safe to promote'}</small>
          </div>

          <dl className="fact-list">
            <div><dt>Layer</dt><dd>{selected.layer}</dd></div>
            <div><dt>Domain</dt><dd>{selected.domain}</dd></div>
            <div><dt>Relations</dt><dd>{incomingRelations.length} in · {outgoingRelations.length} out</dd></div>
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
              {selectedHasBypass
                ? 'This owner has a red direct path that bypasses the approved route, API and capability chain. Atlas keeps that exception visible.'
                : selected.state === 'warning'
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
