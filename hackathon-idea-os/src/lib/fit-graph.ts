import {
  FitGraph,
  FitGraphColumn,
  FitGraphEdge,
  FitGraphNode,
  FitGraphNodeKind,
  GitHubSignals,
  Hackathon,
  Idea,
  UserProfile,
} from "./types";

const COLUMN_ORDER: Record<FitGraphColumn, number> = {
  signal: 0,
  hackathon: 1,
  idea: 2,
};

function sanitizeString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function createNodeId(prefix: string, label: string, usedIds: Set<string>) {
  const base = `${prefix}-${slugify(label) || "node"}`;
  let next = base;
  let index = 2;

  while (usedIds.has(next)) {
    next = `${base}-${index}`;
    index += 1;
  }

  usedIds.add(next);
  return next;
}

function normalizedKey(value: string) {
  return value.trim().toLowerCase();
}

function buildNodeLookup(nodes: FitGraphNode[]) {
  const byId = new Map<string, FitGraphNode>();
  const byKey = new Map<string, FitGraphNode>();

  for (const node of nodes) {
    byId.set(node.id, node);
    byKey.set(normalizedKey(node.label), node);
  }

  return { byId, byKey };
}

function pushCandidate(
  nodes: FitGraphNode[],
  usedIds: Set<string>,
  seenLabels: Set<string>,
  label: string | null,
  column: FitGraphColumn,
  kind: FitGraphNodeKind,
  description: string | null,
  prefix: string,
) {
  if (!label) return;

  const key = `${column}:${normalizedKey(label)}`;
  if (seenLabels.has(key)) return;
  seenLabels.add(key);

  nodes.push({
    id: createNodeId(prefix, label, usedIds),
    label,
    column,
    kind,
    description,
  });
}

export function buildSignalNodes(userProfile: UserProfile, githubSignals: GitHubSignals) {
  const nodes: FitGraphNode[] = [];
  const usedIds = new Set<string>();
  const seenLabels = new Set<string>();

  for (const language of githubSignals.languages.slice(0, 4)) {
    pushCandidate(
      nodes,
      usedIds,
      seenLabels,
      language,
      "signal",
      "language",
      "Detected in the user's GitHub repositories.",
      "signal-language",
    );
  }

  for (const framework of githubSignals.frameworks.slice(0, 4)) {
    pushCandidate(
      nodes,
      usedIds,
      seenLabels,
      framework,
      "signal",
      "framework",
      "Framework or library repeatedly used in the user's GitHub work.",
      "signal-framework",
    );
  }

  for (const theme of githubSignals.projectThemes.slice(0, 3)) {
    pushCandidate(
      nodes,
      usedIds,
      seenLabels,
      theme,
      "signal",
      "project_theme",
      "Recurring project theme inferred from GitHub repositories.",
      "signal-theme",
    );
  }

  for (const interest of userProfile.interests.slice(0, 3)) {
    pushCandidate(
      nodes,
      usedIds,
      seenLabels,
      interest,
      "signal",
      "interest",
      "Interest selected during onboarding.",
      "signal-interest",
    );
  }

  for (const skill of userProfile.skills.slice(0, 3)) {
    pushCandidate(
      nodes,
      usedIds,
      seenLabels,
      skill,
      "signal",
      "skill",
      "Additional skill supplied during onboarding.",
      "signal-skill",
    );
  }

  return nodes;
}

export function buildHackathonAnchorNodes(hackathon: Hackathon) {
  const nodes: FitGraphNode[] = [];
  const usedIds = new Set<string>();
  const seenLabels = new Set<string>();

  for (const track of hackathon.tracks) {
    pushCandidate(
      nodes,
      usedIds,
      seenLabels,
      track.name,
      "hackathon",
      "track",
      track.description ?? "Hackathon track.",
      "hackathon-track",
    );
  }

  for (const sponsor of hackathon.sponsors) {
    for (const api of sponsor.apis) {
      pushCandidate(
        nodes,
        usedIds,
        seenLabels,
        api,
        "hackathon",
        "sponsor_api",
        `Sponsor API or SDK surfaced by ${sponsor.name}.`,
        "hackathon-api",
      );
    }

    for (const prize of sponsor.prizes) {
      pushCandidate(
        nodes,
        usedIds,
        seenLabels,
        prize,
        "hackathon",
        "sponsor_prize",
        `Sponsor challenge or bounty tied to ${sponsor.name}.`,
        "hackathon-prize",
      );
    }
  }

  for (const sponsor of hackathon.sponsors) {
    pushCandidate(
      nodes,
      usedIds,
      seenLabels,
      sponsor.name,
      "hackathon",
      "sponsor",
      "Named sponsor supporting the event.",
      "hackathon-sponsor",
    );
  }

  pushCandidate(
    nodes,
    usedIds,
    seenLabels,
    hackathon.theme ?? null,
    "hackathon",
    "theme",
    "Overall hackathon theme.",
    "hackathon-theme",
  );

  for (const criterion of hackathon.judgingCriteria.slice(0, 4)) {
    pushCandidate(
      nodes,
      usedIds,
      seenLabels,
      criterion,
      "hackathon",
      "judging",
      "Judging criterion called out by the event.",
      "hackathon-judging",
    );
  }

  return nodes;
}

function buildIdeaNodes(topIdeas: Idea[]) {
  return topIdeas.map((idea) => ({
    id: idea.id,
    ideaId: idea.id,
    label: idea.title,
    column: "idea" as const,
    kind: "idea" as const,
    description: idea.demoMoment || idea.problem,
  }));
}

function clampWeight(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.min(5, Math.max(1, Math.round(numeric)));
}

function collectAliases(
  rawNode: Record<string, unknown>,
  resolvedNode: FitGraphNode,
  aliases: Map<string, string>,
) {
  const rawId = sanitizeString(rawNode.id);
  const rawLabel = sanitizeString(rawNode.label);
  const rawIdeaId = sanitizeString(rawNode.ideaId);

  if (rawId) {
    aliases.set(rawId, resolvedNode.id);
    aliases.set(normalizedKey(rawId), resolvedNode.id);
  }

  if (rawLabel) {
    aliases.set(normalizedKey(rawLabel), resolvedNode.id);
  }

  if (rawIdeaId) {
    aliases.set(rawIdeaId, resolvedNode.id);
    aliases.set(normalizedKey(rawIdeaId), resolvedNode.id);
  }
}

function resolveNodeFromRaw(
  rawNode: Record<string, unknown>,
  signalLookup: ReturnType<typeof buildNodeLookup>,
  hackathonLookup: ReturnType<typeof buildNodeLookup>,
  ideaLookup: ReturnType<typeof buildNodeLookup>,
) {
  const column = sanitizeString(rawNode.column);
  const rawId = sanitizeString(rawNode.id);
  const rawLabel = sanitizeString(rawNode.label);
  const rawIdeaId = sanitizeString(rawNode.ideaId);

  if (column === "signal") {
    return (
      (rawId ? signalLookup.byId.get(rawId) : undefined) ??
      (rawLabel ? signalLookup.byKey.get(normalizedKey(rawLabel)) : undefined) ??
      null
    );
  }

  if (column === "hackathon") {
    return (
      (rawId ? hackathonLookup.byId.get(rawId) : undefined) ??
      (rawLabel ? hackathonLookup.byKey.get(normalizedKey(rawLabel)) : undefined) ??
      null
    );
  }

  if (column === "idea") {
    return (
      (rawIdeaId ? ideaLookup.byId.get(rawIdeaId) : undefined) ??
      (rawId ? ideaLookup.byId.get(rawId) : undefined) ??
      (rawLabel ? ideaLookup.byKey.get(normalizedKey(rawLabel)) : undefined) ??
      null
    );
  }

  return (
    (rawId ? signalLookup.byId.get(rawId) : undefined) ??
    (rawLabel ? signalLookup.byKey.get(normalizedKey(rawLabel)) : undefined) ??
    (rawId ? hackathonLookup.byId.get(rawId) : undefined) ??
    (rawLabel ? hackathonLookup.byKey.get(normalizedKey(rawLabel)) : undefined) ??
    (rawIdeaId ? ideaLookup.byId.get(rawIdeaId) : undefined) ??
    (rawId ? ideaLookup.byId.get(rawId) : undefined) ??
    (rawLabel ? ideaLookup.byKey.get(normalizedKey(rawLabel)) : undefined) ??
    null
  );
}

function resolveNodeReference(
  value: unknown,
  aliases: Map<string, string>,
  nodesById: Map<string, FitGraphNode>,
  nodesByKey: Map<string, FitGraphNode>,
) {
  const ref = sanitizeString(value);
  if (!ref) return null;

  const normalized = normalizedKey(ref);
  const actualId =
    aliases.get(ref) ??
    aliases.get(normalized) ??
    nodesById.get(ref)?.id ??
    nodesByKey.get(normalized)?.id ??
    null;

  return actualId ? nodesById.get(actualId) ?? null : null;
}

function normalizeEdgeDirection(source: FitGraphNode, target: FitGraphNode) {
  if (source.column === "signal" && target.column === "hackathon") {
    return { source, target };
  }

  if (source.column === "hackathon" && target.column === "idea") {
    return { source, target };
  }

  if (source.column === "hackathon" && target.column === "signal") {
    return { source: target, target: source };
  }

  if (source.column === "idea" && target.column === "hackathon") {
    return { source: target, target: source };
  }

  return null;
}

function sortNodes(nodes: FitGraphNode[]) {
  return [...nodes].sort((left, right) => {
    const columnDiff = COLUMN_ORDER[left.column] - COLUMN_ORDER[right.column];
    if (columnDiff !== 0) return columnDiff;
    return left.label.localeCompare(right.label);
  });
}

export function sanitizeFitGraph(
  rawGraph: unknown,
  topIdeas: Idea[],
  signalNodes: FitGraphNode[],
  hackathonNodes: FitGraphNode[],
): FitGraph | null {
  if (!rawGraph || typeof rawGraph !== "object") return null;

  const record = rawGraph as Record<string, unknown>;
  const rawNodes = Array.isArray(record.nodes) ? record.nodes : [];
  const rawEdges = Array.isArray(record.edges) ? record.edges : [];
  const ideaNodes = buildIdeaNodes(topIdeas);
  const topIdeaIds = topIdeas.map((idea) => idea.id);

  const signalLookup = buildNodeLookup(signalNodes);
  const hackathonLookup = buildNodeLookup(hackathonNodes);
  const ideaLookup = buildNodeLookup(ideaNodes);
  const allNodes = [...signalNodes, ...hackathonNodes, ...ideaNodes];
  const allLookup = buildNodeLookup(allNodes);
  const aliases = new Map<string, string>();
  const selectedNodes = new Map<string, FitGraphNode>();

  for (const rawNode of rawNodes) {
    if (!rawNode || typeof rawNode !== "object") continue;
    const resolved = resolveNodeFromRaw(
      rawNode as Record<string, unknown>,
      signalLookup,
      hackathonLookup,
      ideaLookup,
    );

    if (!resolved) continue;

    selectedNodes.set(resolved.id, resolved);
    collectAliases(rawNode as Record<string, unknown>, resolved, aliases);
  }

  for (const ideaNode of ideaNodes) {
    selectedNodes.set(ideaNode.id, ideaNode);
    aliases.set(ideaNode.id, ideaNode.id);
    aliases.set(normalizedKey(ideaNode.id), ideaNode.id);
    aliases.set(normalizedKey(ideaNode.label), ideaNode.id);
  }

  const usedNodeIds = new Set<string>(ideaNodes.map((ideaNode) => ideaNode.id));
  const edges = new Map<string, FitGraphEdge>();

  for (const rawEdge of rawEdges) {
    if (!rawEdge || typeof rawEdge !== "object") continue;
    const recordEdge = rawEdge as Record<string, unknown>;
    const sourceNode = resolveNodeReference(recordEdge.source, aliases, allLookup.byId, allLookup.byKey);
    const targetNode = resolveNodeReference(recordEdge.target, aliases, allLookup.byId, allLookup.byKey);
    const direction = sourceNode && targetNode ? normalizeEdgeDirection(sourceNode, targetNode) : null;
    const reason = sanitizeString(recordEdge.reason);
    const weight = clampWeight(recordEdge.weight);

    if (!direction || !reason || !weight) continue;

    const edgeId = sanitizeString(recordEdge.id) ?? `${direction.source.id}__${direction.target.id}`;
    const dedupeKey = `${direction.source.id}:${direction.target.id}:${normalizedKey(reason)}`;

    edges.set(dedupeKey, {
      id: edgeId,
      source: direction.source.id,
      target: direction.target.id,
      weight,
      reason,
    });

    usedNodeIds.add(direction.source.id);
    usedNodeIds.add(direction.target.id);
    selectedNodes.set(direction.source.id, direction.source);
    selectedNodes.set(direction.target.id, direction.target);
  }

  if (edges.size === 0) return null;

  const orderedNodes = sortNodes(
    allNodes.filter((node) => selectedNodes.has(node.id) && usedNodeIds.has(node.id)),
  );

  return {
    nodes: orderedNodes,
    edges: [...edges.values()],
    topIdeaIds,
  };
}
