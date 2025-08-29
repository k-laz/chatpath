import { ConversationNode } from "@/types/conversation";
import dagre from "dagre";

// Generate conversation title based on the first user message
export function getConversationTitle(node: ConversationNode): string {
  if (node.messages.length === 0) return "New Branch";

  const firstUserMessage = node.messages.find((msg) => msg.role === "user");
  if (firstUserMessage) {
    const content = firstUserMessage.content.trim();
    return content.length > 50 ? content.slice(0, 50) + "..." : content;
  }

  const firstMessage = node.messages[0];
  const content = firstMessage.content.trim();
  return content.length > 50 ? content.slice(0, 50) + "..." : content;
}

/**
 * Calculate layout for the entire conversation tree using Dagre
 * This provides automatic positioning that prevents overlapping and creates a clean hierarchy
 */
export function calculateDagreLayout(
  nodes: ConversationNode[],
  edges: { source: string; target: string }[]
): { [nodeId: string]: { x: number; y: number } } {
  const g = new dagre.graphlib.Graph();

  // Set graph direction and spacing
  g.setGraph({
    rankdir: "LR", // Left to right layout
    nodesep: 100, // Horizontal separation between nodes
    edgesep: 50, // Separation between edges
    ranksep: 200, // Vertical separation between ranks
    marginx: 50, // Margin on x-axis
    marginy: 50, // Margin on y-axis
  });

  // Set default node dimensions
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes to the graph
  nodes.forEach((node) => {
    g.setNode(node.id, {
      width: 500, // Node width
      height: 400, // Node height
    });
  });

  // Add edges to the graph
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  // Calculate the layout
  dagre.layout(g);

  // Extract positions
  const positions: { [nodeId: string]: { x: number; y: number } } = {};
  nodes.forEach((node) => {
    const nodeWithPosition = g.node(node.id);
    positions[node.id] = {
      x: nodeWithPosition.x - nodeWithPosition.width / 2,
      y: nodeWithPosition.y - nodeWithPosition.height / 2,
    };
  });

  return positions;
}

/**
 * Calculate smart position for a new branch node using Dagre
 * This provides automatic positioning that prevents overlapping
 */
export function calculateSmartNodePosition(
  parentPosition: { x: number; y: number },
  existingNodes: ConversationNode[],
  parentNodeId: string,
  existingEdges: { source: string; target: string }[] = []
): { x: number; y: number } {
  console.log("Calculating position for new node using Dagre:", {
    parentPosition,
    existingNodesCount: existingNodes.length,
    parentNodeId,
    existingNodePositions: existingNodes.map((n) => ({
      id: n.id,
      pos: n.position,
    })),
  });

  // If we have a complex tree structure, use Dagre for the entire layout
  if (existingNodes.length > 1) {
    try {
      // Create a temporary node for the new branch (we'll use a placeholder ID)
      const tempNodeId = "temp-new-node";
      const tempNodes = [
        ...existingNodes,
        {
          id: tempNodeId,
          parentId: parentNodeId,
          position: { x: 0, y: 0 }, // Will be calculated by Dagre
          messages: [],
          branches: [],
          context: [],
          createdAt: new Date(),
          isActive: false,
        } as ConversationNode,
      ];

      const tempEdges = [
        ...existingEdges,
        { source: parentNodeId, target: tempNodeId },
      ];

      // Calculate layout for the entire tree including the new node
      const positions = calculateDagreLayout(tempNodes, tempEdges);

      // Return the position for the new node
      const newPosition = positions[tempNodeId];
      if (newPosition) {
        console.log("Dagre calculated position:", newPosition);
        return newPosition;
      }
    } catch (error) {
      console.warn(
        "Dagre layout failed, falling back to simple positioning:",
        error
      );
    }
  }

  // Fallback to simple positioning for simple cases or if Dagre fails
  const baseOffset = 600; // Distance to the right
  const verticalSpacing = 500; // Vertical spacing

  // Simple positioning: to the right of parent
  return {
    x: parentPosition.x + baseOffset,
    y: parentPosition.y,
  };
}

/**
 * Recalculate the entire tree layout using Dagre
 * This is useful for reorganizing the tree after deletions or manual repositioning
 */
export function recalculateTreeLayout(
  nodes: ConversationNode[],
  edges: { source: string; target: string }[]
): { [nodeId: string]: { x: number; y: number } } {
  if (nodes.length === 0) return {};

  try {
    return calculateDagreLayout(nodes, edges);
  } catch (error) {
    console.warn("Failed to recalculate tree layout:", error);

    // Fallback: simple grid layout
    const positions: { [nodeId: string]: { x: number; y: number } } = {};
    const nodeWidth = 500;
    const nodeHeight = 400;
    const spacing = 100;

    nodes.forEach((node, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      positions[node.id] = {
        x: col * (nodeWidth + spacing),
        y: row * (nodeHeight + spacing),
      };
    });

    return positions;
  }
}

/**
 * Create a context message for a new branch based on the selected text
 */
export function createBranchContextMessage(selectedText: string): string {
  const truncatedText =
    selectedText.length > 100
      ? selectedText.slice(0, 100) + "..."
      : selectedText;

  return `🌿 **Continuing from:** "${truncatedText}"\n\nI'd like to explore this topic further. What would you like to discuss about this?`;
}
