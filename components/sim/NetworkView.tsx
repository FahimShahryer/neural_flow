"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  type Edge,
  type Node,
  type NodeMouseHandler,
  type EdgeMouseHandler,
} from "@xyflow/react";
import type { NNPhaseId, NNState } from "@/lib/engines/nn";
import { NeuronNode, type NeuronNodeData } from "./NeuronNode";
import {
  WeightEdge,
  type WeightEdgeData,
  type WeightEdgePhase,
} from "./WeightEdge";
import { computeLayout, neuronId, weightId } from "./networkLayout";

/* Memoized outside the component — React Flow warns otherwise. */
const nodeTypes = { neuron: NeuronNode } as const;
const edgeTypes = { weight: WeightEdge } as const;

export type NetworkViewProps = {
  state: NNState;
  /** Per-layer labels above each neuron. layerLabels[l][i] labels neuron i of layer l. */
  layerLabels?: (string | undefined)[][];
  /** Fires when any neuron or edge is clicked. Id is the engine inspect id. */
  onInspect?: (id: string) => void;
  /** Show weight values on each edge. Off by default to keep the picture clean. */
  showWeightLabels?: boolean;
  /** Height in pixels of the canvas. */
  height?: number;
};

function roleFor(
  layer: number,
  totalLayers: number,
): NeuronNodeData["role"] {
  if (layer === 0) return "input";
  if (layer === totalLayers - 1) return "output";
  return "hidden";
}

function edgePhaseFor(phase: NNPhaseId): WeightEdgePhase {
  switch (phase) {
    case "forward":
    case "predict":
      return "forward";
    case "backward":
      return "backward";
    case "update":
      return "update";
    default:
      return "idle";
  }
}

export function NetworkView({
  state,
  layerLabels,
  onInspect,
  showWeightLabels = false,
  height = 360,
}: NetworkViewProps) {
  const { nodes, edges } = useMemo(() => {
    const totalLayers = state.config.layers.length;
    const positions = computeLayout(state.config.layers);

    const nodes: Node[] = positions.map((p) => {
      const role = roleFor(p.layer, totalLayers);
      const value = state.activations[p.layer]?.[p.index] ?? 0;
      const active =
        state.phase === "input"
          ? p.layer === 0
          : state.phase === "forward" || state.phase === "predict";
      const label = layerLabels?.[p.layer]?.[p.index];
      const data: NeuronNodeData = { role, value, active, label };
      return {
        id: neuronId(p.layer, p.index),
        type: "neuron",
        position: { x: p.x, y: p.y },
        data: data as unknown as Record<string, unknown>,
        draggable: true,
      };
    });

    const edgePhase = edgePhaseFor(state.phase);
    const edges: Edge[] = [];
    for (let layerPair = 0; layerPair < state.weights.length; layerPair++) {
      const W = state.weights[layerPair];
      for (let outIdx = 0; outIdx < W.length; outIdx++) {
        for (let inIdx = 0; inIdx < W[outIdx].length; inIdx++) {
          const w = W[outIdx][inIdx];
          const grad = state.gradients?.[layerPair]?.[outIdx]?.[inIdx];
          const data: WeightEdgeData = {
            weight: w,
            gradient: grad,
            phase: edgePhase,
            showLabel: showWeightLabels,
          };
          edges.push({
            id: weightId(layerPair, outIdx, inIdx),
            type: "weight",
            source: neuronId(layerPair, inIdx),
            target: neuronId(layerPair + 1, outIdx),
            data: data as unknown as Record<string, unknown>,
          });
        }
      }
    }
    return { nodes, edges };
  }, [state, layerLabels, showWeightLabels]);

  const onNodeClick: NodeMouseHandler = (_, node) => {
    onInspect?.(node.id);
  };
  const onEdgeClick: EdgeMouseHandler = (_, edge) => {
    onInspect?.(edge.id);
  };

  return (
    <div
      className="not-prose relative overflow-hidden rounded-xl border border-border/70 bg-background"
      style={{ height }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        zoomOnScroll={false}
        panOnScroll={false}
        panOnDrag
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={18}
          size={1}
          className="!bg-transparent"
          color="currentColor"
        />
      </ReactFlow>
    </div>
  );
}
