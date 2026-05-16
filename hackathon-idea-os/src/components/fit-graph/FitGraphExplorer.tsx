"use client";

import { useState } from "react";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { FitGraph, FitGraphColumn, FitGraphNode, Idea } from "@/lib/types";
import { ScoreBadge } from "@/components/ScoreBadge";

interface FitGraphExplorerProps {
  graph: FitGraph;
  ideas: Idea[];
  initialIdeaId: string | null;
  onSelectIdea: (ideaId: string) => void;
  onBuildPlan: (ideaId: string) => void;
}

type ActiveSelection =
  | { type: "node"; id: string }
  | { type: "edge"; id: string }
  | null;

type CanvasNodeData = {
  label: string;
  description: string | null;
  column: FitGraphColumn;
  kind: FitGraphNode["kind"];
  score?: number;
  selected: boolean;
  dimmed: boolean;
};

type CanvasNode = Node<CanvasNodeData>;
const NODE_TYPES = { fitGraphNode: FitGraphNodeCard };
const FIT_VIEW_OPTIONS = { padding: 0.18 } as const;
const PRO_OPTIONS = { hideAttribution: true } as const;

function FitGraphNodeCard({ data }: NodeProps<CanvasNode>) {
  const shared =
    "rounded-2xl border bg-white px-4 py-3 shadow-sm transition-all duration-150";
  const selected = data.selected ? "border-[#f97316] shadow-lg shadow-orange-100" : "border-zinc-200";
  const dimmed = data.dimmed ? "opacity-35" : "opacity-100";

  const variants = {
    signal: "min-w-[220px] max-w-[220px]",
    hackathon: "min-w-[250px] max-w-[250px] bg-orange-50/70",
    idea: "min-w-[280px] max-w-[280px]",
  } satisfies Record<FitGraphColumn, string>;

  return (
    <div className={`${shared} ${selected} ${dimmed} ${variants[data.column]}`}>
      {data.column !== "signal" && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-2 !w-2 !border-0 !bg-transparent !opacity-0"
        />
      )}

      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-600">
              {data.column === "signal"
                ? "Signal"
                : data.column === "hackathon"
                  ? "Hackathon"
                  : "Idea"}
            </p>
            <p className="text-sm font-bold text-[#18181b] leading-snug">{data.label}</p>
          </div>
          {typeof data.score === "number" && <ScoreBadge score={data.score} size="sm" />}
        </div>
        {data.description && (
          <p className="text-xs leading-relaxed text-zinc-600">{data.description}</p>
        )}
      </div>

      {data.column !== "idea" && (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-2 !w-2 !border-0 !bg-transparent !opacity-0"
        />
      )}
    </div>
  );
}

function buildColumnOrder(graph: FitGraph, column: FitGraphColumn) {
  const nodes = graph.nodes.filter((node) => node.column === column);

  if (column !== "idea") return nodes;

  const order = new Map(graph.topIdeaIds.map((ideaId, index) => [ideaId, index]));
  return [...nodes].sort((left, right) => (order.get(left.id) ?? 99) - (order.get(right.id) ?? 99));
}

function buildCanvasNodes(
  graph: FitGraph,
  ideas: Idea[],
  selection: ActiveSelection,
) {
  const ideaById = new Map(ideas.map((idea) => [idea.id, idea]));
  const graphNodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const highlightNodeIds = new Set<string>();
  const highlightEdgeIds = new Set<string>();

  if (selection?.type === "node") {
    highlightNodeIds.add(selection.id);
    for (const edge of graph.edges) {
      if (edge.source === selection.id || edge.target === selection.id) {
        highlightEdgeIds.add(edge.id);
        highlightNodeIds.add(edge.source);
        highlightNodeIds.add(edge.target);
      }
    }
  }

  if (selection?.type === "edge") {
    const edge = graph.edges.find((entry) => entry.id === selection.id);
    if (edge) {
      highlightEdgeIds.add(edge.id);
      highlightNodeIds.add(edge.source);
      highlightNodeIds.add(edge.target);
    }
  }

  const xPositions: Record<FitGraphColumn, number> = {
    signal: 0,
    hackathon: 370,
    idea: 760,
  };
  const cardHeights: Record<FitGraphColumn, number> = {
    signal: 110,
    hackathon: 124,
    idea: 138,
  };
  const gap = 28;
  const nodes: Node<CanvasNodeData>[] = [];

  for (const column of ["signal", "hackathon", "idea"] as const) {
    const columnNodes = buildColumnOrder(graph, column);
    const totalHeight =
      columnNodes.length * cardHeights[column] + Math.max(0, columnNodes.length - 1) * gap;
    const startY = totalHeight > 0 ? -(totalHeight / 2) : 0;

    columnNodes.forEach((node, index) => {
      const selected = selection?.type === "node" && selection.id === node.id;
      const dimmed =
        selection !== null &&
        highlightNodeIds.size > 0 &&
        !highlightNodeIds.has(node.id);

      nodes.push({
        id: node.id,
        type: "fitGraphNode",
        position: {
          x: xPositions[column],
          y: startY + index * (cardHeights[column] + gap),
        },
        draggable: false,
        selectable: false,
        data: {
          label: node.label,
          description:
            column === "idea"
              ? ideaById.get(node.id)?.problem ?? node.description
              : node.description,
          column,
          kind: node.kind,
          score: column === "idea" ? ideaById.get(node.id)?.winScore : undefined,
          selected,
          dimmed,
        },
      });
    });
  }

  const edges: Edge[] = graph.edges.map((edge) => {
    const selected = selection?.type === "edge" && selection.id === edge.id;
    const dimmed =
      selection !== null &&
      highlightEdgeIds.size > 0 &&
      !highlightEdgeIds.has(edge.id);

    const stroke = selected ? "#f97316" : "#18181b";

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: "smoothstep",
      selectable: false,
      animated: selected,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: stroke,
      },
      style: {
        stroke,
        strokeWidth: 1.5 + edge.weight * 1.2,
        opacity: dimmed ? 0.22 : 0.78,
      },
    };
  });

  return { nodes, edges, graphNodeById };
}

function findSelectedIdeaId(graph: FitGraph, ideas: Idea[], currentIdeaId: string | null) {
  if (currentIdeaId && ideas.some((idea) => idea.id === currentIdeaId)) return currentIdeaId;
  return graph.topIdeaIds[0] ?? ideas[0]?.id ?? null;
}

export function FitGraphExplorer({
  graph,
  ideas,
  initialIdeaId,
  onSelectIdea,
  onBuildPlan,
}: FitGraphExplorerProps) {
  const [selection, setSelection] = useState<ActiveSelection>(() =>
    graph.topIdeaIds[0] ? { type: "node", id: graph.topIdeaIds[0] } : null,
  );
  const [localSelectedIdeaId, setLocalSelectedIdeaId] = useState<string | null>(() =>
    findSelectedIdeaId(graph, ideas, initialIdeaId),
  );
  const selectedIdeaId =
    localSelectedIdeaId && ideas.some((idea) => idea.id === localSelectedIdeaId)
      ? localSelectedIdeaId
      : findSelectedIdeaId(graph, ideas, initialIdeaId);

  const selectedIdea =
    ideas.find((idea) => idea.id === selectedIdeaId) ?? ideas.find((idea) => idea.id === graph.topIdeaIds[0]) ?? null;
  const { nodes, edges, graphNodeById } = buildCanvasNodes(graph, ideas, selection);
  const selectedNode = selection?.type === "node" ? graphNodeById.get(selection.id) ?? null : null;
  const selectedEdge = selection?.type === "edge" ? graph.edges.find((edge) => edge.id === selection.id) ?? null : null;
  const connectedEdges = selectedNode
    ? graph.edges.filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id)
    : selectedEdge
      ? [selectedEdge]
      : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {graph.topIdeaIds
          .map((ideaId) => ideas.find((idea) => idea.id === ideaId))
          .filter((idea): idea is Idea => Boolean(idea))
          .map((idea) => (
            <button
              key={idea.id}
              type="button"
              onClick={() => {
                setLocalSelectedIdeaId(idea.id);
                setSelection({ type: "node", id: idea.id });
                onSelectIdea(idea.id);
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedIdeaId === idea.id
                  ? "border-[#f97316] bg-orange-50 text-orange-700"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-[#f97316] hover:text-[#f97316]"
              }`}
            >
              {idea.title}
            </button>
          ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-3xl border border-zinc-200 bg-white p-3 shadow-sm">
          <div className="h-[680px] w-full overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.08),_transparent_32%),linear-gradient(180deg,_#fff,_#fafafa)]">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={NODE_TYPES}
              fitView
              fitViewOptions={FIT_VIEW_OPTIONS}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              minZoom={0.65}
              maxZoom={1.45}
              proOptions={PRO_OPTIONS}
              onNodeClick={(_, node) => {
                setSelection({ type: "node", id: node.id });
                const clickedNode = graphNodeById.get(node.id);
                if (clickedNode?.column === "idea") {
                  setLocalSelectedIdeaId(node.id);
                  onSelectIdea(node.id);
                }
              }}
              onEdgeClick={(_, edge) => {
                setSelection({ type: "edge", id: edge.id });
                const edgeIdeaId = graph.topIdeaIds.find(
                  (ideaId) => ideaId === edge.source || ideaId === edge.target,
                );
                if (edgeIdeaId) {
                  setLocalSelectedIdeaId(edgeIdeaId);
                  onSelectIdea(edgeIdeaId);
                }
              }}
            >
              <Background gap={20} size={1} color="#f4f4f5" />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600 mb-2">
              Inspector
            </p>

            {selectedEdge ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-bold text-[#18181b]">
                    {graphNodeById.get(selectedEdge.source)?.label} → {graphNodeById.get(selectedEdge.target)?.label}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">Edge weight: {selectedEdge.weight}/5</p>
                </div>
                <p className="text-sm text-zinc-700 leading-relaxed">{selectedEdge.reason}</p>
              </div>
            ) : selectedNode ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-bold text-[#18181b]">{selectedNode.label}</p>
                  {selectedNode.description && (
                    <p className="text-sm text-zinc-600 mt-1 leading-relaxed">
                      {selectedNode.description}
                    </p>
                  )}
                </div>

                {connectedEdges.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                      Connected reasoning
                    </p>
                    {connectedEdges.map((edge) => {
                      const otherNodeId = edge.source === selectedNode.id ? edge.target : edge.source;
                      const otherNode = graphNodeById.get(otherNodeId);

                      return (
                        <button
                          key={edge.id}
                          type="button"
                          onClick={() => setSelection({ type: "edge", id: edge.id })}
                          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-left hover:border-[#f97316] hover:bg-orange-50 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                              {otherNode?.label ?? "Connected node"}
                            </p>
                            <span className="text-[11px] font-bold text-orange-600">
                              {edge.weight}/5
                            </span>
                          </div>
                          <p className="text-sm text-zinc-700 mt-1 leading-relaxed">{edge.reason}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-zinc-600 leading-relaxed">
                Click a node or edge to inspect the reasoning structure behind the fit graph.
              </p>
            )}
          </div>

          {selectedIdea && (
            <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600 mb-2">
                Selected plan idea
              </p>
              <h3 className="text-lg font-bold text-[#18181b]">{selectedIdea.title}</h3>
              <p className="text-sm text-zinc-600 mt-2 leading-relaxed">{selectedIdea.problem}</p>
              <div className="mt-3 flex items-center gap-2">
                <ScoreBadge score={selectedIdea.winScore} size="sm" />
                <span className="text-xs text-zinc-500">highest-probability win signal</span>
              </div>
              <button
                type="button"
                onClick={() => onBuildPlan(selectedIdea.id)}
                className="mt-4 w-full rounded-xl bg-[#f97316] px-4 py-3 text-sm font-bold text-white hover:bg-orange-500 transition-colors"
              >
                Generate plan for this idea →
              </button>
            </div>
          )}

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3">
              All 10 ideas
            </p>
            <div className="space-y-2">
              {ideas.map((idea, index) => (
                <button
                  key={idea.id}
                  type="button"
                  onClick={() => onBuildPlan(idea.id)}
                  className="flex w-full items-center justify-between rounded-xl border border-zinc-200 px-3 py-3 text-left hover:border-[#f97316] hover:bg-orange-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-zinc-400">#{index + 1}</p>
                    <p className="text-sm font-semibold text-[#18181b] truncate">{idea.title}</p>
                  </div>
                  <ScoreBadge score={idea.winScore} size="sm" />
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
