"use client";

import { useCallback, useMemo, useEffect, useRef } from "react";
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
  ReactFlowInstance,
} from "@xyflow/react";
import { ChatNode } from "./ChatNode";
import { CustomEdge } from "./CustomEdge";
import { useConversationTree } from "@/hooks/useConversationTree";
import { ConversationNode } from "@/types/conversation";
import { recalculateTreeLayout } from "@/utils";

import "@xyflow/react/dist/style.css";

const nodeTypes: NodeTypes = {
  chat: ChatNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

export function ConversationTree() {
  const {
    tree,
    updateNodePosition,
    ensureMinimumNodes,
    activeNodeId,
    shouldZoomToParent,
    resetZoomFlag,
    setActiveNode,
  } = useConversationTree();
  const reactFlowRef = useRef<ReactFlowInstance | null>(null);

  const handleRecalculateLayout = useCallback(() => {
    if (tree.nodes.length === 0) return;

    try {
      const newPositions = recalculateTreeLayout(tree.nodes, tree.edges);

      // Update all node positions
      Object.entries(newPositions).forEach(([nodeId, position]) => {
        updateNodePosition(nodeId, position);
      });

      // Fit view to show all nodes
      setTimeout(() => {
        reactFlowRef.current?.fitView({ duration: 800, padding: 0.8 });
      }, 100);
    } catch (error) {
      console.error("Failed to recalculate layout:", error);
    }
  }, [tree.nodes, tree.edges, updateNodePosition]);

  // Ensure there's always at least one node
  useEffect(() => {
    ensureMinimumNodes();
  }, [ensureMinimumNodes]);

  const handleBranchClick = useCallback(
    (branchPoint: any) => {
      if (reactFlowRef.current) {
        // Find the target node
        const targetNode = tree.nodes.find(
          (node) => node.id === branchPoint.childNodeId
        );
        if (targetNode) {
          // Zoom to the target node
          reactFlowRef.current.fitView({
            nodes: [{ id: targetNode.id, position: targetNode.position }],
            duration: 800,
            padding: 0.8,
          });
        }
      }
    },
    [tree.nodes]
  );

  const nodes: Node[] = useMemo(
    () =>
      tree.nodes.map((node: ConversationNode) => ({
        id: node.id,
        type: "chat",
        position: node.position,
        data: { node, onBranchClick: handleBranchClick },
        draggable: true,
        // Add selective dragging configuration
        dragHandle: ".node-drag-handle",
        selectable: true,
      })),
    [tree.nodes, handleBranchClick]
  );

  const edges: Edge[] = useMemo(
    () =>
      tree.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: "custom",
        animated: true,
        style: {
          strokeWidth: 2,
          stroke: "#3b82f6",
        },
        data: {
          label: edge.label,
          selectedText: edge.data?.selectedText,
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

  const onNodeClick = useCallback(
    (event: any, node: Node) => {
      // Don't zoom if the click was on an interactive element (input, button, etc.)
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "BUTTON" ||
        target.closest("button") ||
        target.closest("input") ||
        target.closest("textarea") ||
        target.closest(".node-drag-handle")
      ) {
        // Still set as active but don't zoom
        setActiveNode(node.id);
        return;
      }

      // Set the clicked node as active
      setActiveNode(node.id);

      if (reactFlowRef.current) {
        // Zoom to the clicked node with smooth animation
        setTimeout(() => {
          reactFlowRef.current?.fitView({
            nodes: [node],
            duration: 600,
            padding: 0.8,
          });
        }, 50);
      }
    },
    [setActiveNode]
  );

  // Zoom to active node when it changes (for new nodes or when returning to parent after deletion)
  useEffect(() => {
    console.log("Zoom useEffect triggered:", {
      activeNodeId,
      shouldZoomToParent,
      nodesLength: nodesState.length,
    });

    // Log all available nodes for debugging
    console.log(
      "Available nodes:",
      nodesState.map((node) => ({
        id: node.id,
        position: node.position,
        title:
          (node.data as any)?.node?.messages[0]?.content?.substring(0, 30) ||
          "No title",
      }))
    );

    // If we should zoom to parent (from deletion or back button), use activeNodeId
    if (shouldZoomToParent && activeNodeId && reactFlowRef.current) {
      const targetNode = nodesState.find((node) => node.id === activeNodeId);
      if (targetNode) {
        console.log("Zooming to parent node:", {
          id: targetNode.id,
          position: targetNode.position,
          title:
            (targetNode.data as any)?.node?.messages[0]?.content?.substring(
              0,
              50
            ) || "No title",
        });
        setTimeout(() => {
          reactFlowRef.current?.fitView({
            nodes: [targetNode],
            duration: 800,
            padding: 0.8,
          });
          // Reset the zoom flag after using it
          resetZoomFlag();
        }, 200);
        return;
      }
    }

    // Fallback to original logic for other cases
    if (activeNodeId && reactFlowRef.current) {
      const activeNode = nodesState.find((node) => node.id === activeNodeId);
      if (activeNode) {
        const nodeData = activeNode.data as { node: ConversationNode };
        console.log("Active node found:", {
          nodeId: activeNode.id,
          messagesLength: nodeData.node.messages.length,
        });

        // Zoom for newly created nodes with just the context message
        if (nodeData.node.messages.length === 1) {
          console.log("New node with 1 message - zooming");
          setTimeout(() => {
            reactFlowRef.current?.fitView({
              nodes: [activeNode],
              duration: 800,
              padding: 0.8,
            });
          }, 100);
        } else {
          console.log("No zoom condition met");
        }
      } else {
        console.log("Active node not found in nodesState array");
      }
    } else {
      console.log("Missing activeNodeId or reactFlowRef");
    }
  }, [activeNodeId, nodesState, shouldZoomToParent, resetZoomFlag]);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowRef.current = instance;
  }, []);

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onInit={onInit}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
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

      {/* Custom Layout Button */}
      {tree.nodes.length > 1 && (
        <button
          onClick={handleRecalculateLayout}
          className="absolute top-4 right-4 z-10 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg shadow-lg transition-colors"
          title="Recalculate tree layout"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
        </button>
      )}
    </div>
  );
}
