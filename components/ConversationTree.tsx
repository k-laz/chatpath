"use client";

import { useCallback, useMemo, useEffect } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
} from "@xyflow/react";
import { ChatNode } from "./ChatNode";
import { useConversationTree } from "@/hooks/useConversationTree";
import { ConversationNode } from "@/types/conversation";

import "@xyflow/react/dist/style.css";

const nodeTypes: NodeTypes = {
  chat: ChatNode,
};

export function ConversationTree() {
  const { tree, updateNodePosition, ensureMinimumNodes } =
    useConversationTree();

  // Ensure there's always at least one node
  useEffect(() => {
    ensureMinimumNodes();
  }, [ensureMinimumNodes]);

  const nodes: Node[] = useMemo(
    () =>
      tree.nodes.map((node: ConversationNode) => ({
        id: node.id,
        type: "chat",
        position: node.position,
        data: { node },
        draggable: true,
        // Add selective dragging configuration
        dragHandle: ".node-drag-handle",
        selectable: true,
      })),
    [tree.nodes]
  );

  const edges: Edge[] = useMemo(
    () =>
      tree.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: "smoothstep",
        animated: true,
        style: {
          strokeWidth: 2,
          stroke: "#3b82f6",
        },
        labelStyle: {
          fontSize: "12px",
          fontWeight: 500,
          fill: "#6b7280",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          borderRadius: "4px",
          padding: "2px 6px",
        },
      })),
    [tree.edges]
  );

  const [nodesState, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Update nodes and edges state when they change
  useEffect(() => {
    setNodes(nodes);
  }, [nodes, setNodes]);

  useEffect(() => {
    setEdges(edges);
  }, [edges, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  const onNodeDragStop = useCallback(
    (_event: any, node: Node) => {
      updateNodePosition(node.id, node.position);
    },
    [updateNodePosition]
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        className="bg-gray-50 dark:bg-gray-900"
      >
        <Background color="#aaa" gap={20} />
        <Controls className="!left-4 !bottom-4" />
        <MiniMap
          className="!right-4 !bottom-4 !w-48 !h-32"
          nodeStrokeColor="#3b82f6"
          nodeColor="#e5e7eb"
          nodeBorderRadius={8}
        />
      </ReactFlow>
    </div>
  );
}
