import { ConversationNode, Message } from "@/types/conversation";
import dagre from "dagre";

/**
 * Helper function to check if a node is positioned at a specific location
 */
function isNodeAtPosition(
  nodePosition: { x: number; y: number },
  targetPosition: { x: number; y: number },
  tolerance: number = 50
): boolean {
  return (
    Math.abs(nodePosition.x - targetPosition.x) < tolerance &&
    Math.abs(nodePosition.y - targetPosition.y) < tolerance
  );
}

/**
 * Helper function to find the best available position for a new node
 */
function findBestAvailablePosition(
  parentPosition: { x: number; y: number },
  parentChildren: ConversationNode[],
  nodeWidth: number,
  nodeHeight: number,
  spacing: number
): { x: number; y: number } {
  const positions = [
    {
      name: "right",
      pos: { x: parentPosition.x + nodeWidth + spacing, y: parentPosition.y },
    },
    {
      name: "bottom",
      pos: { x: parentPosition.x, y: parentPosition.y + nodeHeight + spacing },
    },
    {
      name: "left",
      pos: { x: parentPosition.x - nodeWidth - spacing, y: parentPosition.y },
    },
    {
      name: "bottom-right",
      pos: {
        x: parentPosition.x + nodeWidth + spacing,
        y: parentPosition.y + nodeHeight + spacing,
      },
    },
    {
      name: "bottom-left",
      pos: {
        x: parentPosition.x - nodeWidth - spacing,
        y: parentPosition.y + nodeHeight + spacing,
      },
    },
  ];

  for (const position of positions) {
    const isOccupied = parentChildren.some((child) =>
      isNodeAtPosition(child.position, position.pos, spacing / 2)
    );

    if (!isOccupied) {
      console.log(`Using ${position.name} position:`, position.pos);
      return position.pos;
    }
  }

  // If all positions are occupied, return a fallback position
  console.log("All positions occupied, using fallback position");
  return {
    x: parentPosition.x + nodeWidth + spacing * 2,
    y: parentPosition.y + nodeHeight + spacing * 2,
  };
}

// Generate conversation title based on the conversation context and content
export function getConversationTitle(node: ConversationNode): string {
  if (node.messages.length === 0) return "New Branch";

  // For branches with inherited context, create a more descriptive title
  if (node.context && node.context.length > 0) {
    // Check if this is a new branch with just the context message
    if (
      node.messages.length === 1 &&
      node.messages[0].content.includes("🌿 **Continuing from:**")
    ) {
      const match = node.messages[0].content.match(/"([^"]+)"/);
      if (match) {
        const selectedText = match[1];
        const words = selectedText.split(/\s+/).slice(0, 2).join(" ");
        return words.length > 12 ? words.substring(0, 12) + "..." : words;
      }
    }

    // For branches with actual conversation, use the summary
    if (node.messages.length > 1) {
      return generateConversationSummary(node.messages);
    }
  }

  // Use the existing generateConversationSummary function for intelligent context-based titles
  return generateConversationSummary(node.messages);
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
 * Calculate smart position for a new branch node based on parent's existing children
 * Priority: right border -> bottom border -> left border
 */
export function calculateSmartNodePosition(
  parentPosition: { x: number; y: number },
  existingNodes: ConversationNode[],
  parentNodeId: string,
  existingEdges: { source: string; target: string }[] = []
): { x: number; y: number } {
  console.log("Calculating position for new node:", {
    parentPosition,
    existingNodesCount: existingNodes.length,
    parentNodeId,
    existingNodePositions: existingNodes.map((n) => ({
      id: n.id,
      pos: n.position,
    })),
  });

  // Get all direct children of the parent node
  const parentChildren = existingNodes.filter(
    (node) => node.parentId === parentNodeId
  );

  // Define positioning constants
  const nodeWidth = 500;
  const nodeHeight = 400;
  const spacing = 100;

  console.log("Positioning new node:", {
    parentPosition,
    parentChildrenCount: parentChildren.length,
    parentChildrenPositions: parentChildren.map((c) => ({
      id: c.id,
      pos: c.position,
    })),
  });

  // Try to find the best available position
  const bestPosition = findBestAvailablePosition(
    parentPosition,
    parentChildren,
    nodeWidth,
    nodeHeight,
    spacing
  );

  // If we found a good position, use it
  if (bestPosition) {
    return bestPosition;
  }

  // If all positions are occupied, use Dagre for complex layout
  try {
    // Create a temporary node for the new branch
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

  // Final fallback: offset from parent position
  return {
    x: parentPosition.x + nodeWidth + spacing * 2,
    y: parentPosition.y + nodeHeight + spacing * 2,
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

/**
 * Generate a short summary (3-4 words max) of the conversation context
 */
export function generateConversationSummary(messages: Message[]): string {
  if (messages.length === 0) return "New branch";

  // Check if this is just the initial context message
  if (
    messages.length === 1 &&
    messages[0].content.includes("🌿 **Continuing from:**")
  ) {
    const match = messages[0].content.match(/"([^"]+)"/);
    if (match) {
      const selectedText = match[1];
      const words = selectedText.split(/\s+/).slice(0, 3).join(" ");
      return words.length > 15 ? words.substring(0, 15) + "..." : words;
    }
    return "Branch";
  }

  // For branches with context, include the branching context in the summary
  if (
    messages.length === 1 &&
    messages[0].content.includes("🌿 **Continuing from:**")
  ) {
    const match = messages[0].content.match(/"([^"]+)"/);
    if (match) {
      const selectedText = match[1];
      const words = selectedText.split(/\s+/).slice(0, 2).join(" ");
      return words.length > 12 ? words.substring(0, 12) + "..." : words;
    }
  }

  // For very short conversations (2-3 messages), focus on the main topic
  if (messages.length <= 3) {
    const userMessages = messages
      .filter((msg) => msg.role === "user")
      .map((msg) => msg.content.toLowerCase());

    if (userMessages.length > 0) {
      const allText = userMessages.join(" ");
      const words = allText.split(/\s+/).filter((word) => word.length > 3);
      const meaningfulWords = words.filter(
        (word) =>
          ![
            "what",
            "how",
            "why",
            "when",
            "where",
            "this",
            "that",
            "with",
            "from",
            "about",
            "have",
            "will",
            "would",
            "could",
            "should",
            "that's",
            "interesting",
            "fascinating",
            "great",
            "point",
            "think",
            "consider",
            "explore",
            "discuss",
            "talk",
            "tell",
            "more",
            "further",
            "deeper",
            "aspects",
            "angles",
            "implications",
            "conclusion",
            "perspective",
            "question",
            "compelling",
            "relates",
            "earlier",
            "main",
            "different",
            "led",
          ].includes(word)
      );

      if (meaningfulWords.length >= 1) {
        return meaningfulWords.slice(0, 2).join(" ").substring(0, 15);
      }
    }
  }

  // Get the most recent user messages (up to 3) and recent assistant messages
  const userMessages = messages
    .filter((msg) => msg.role === "user")
    .slice(-3)
    .map((msg) => msg.content.toLowerCase());

  const assistantMessages = messages
    .filter((msg) => msg.role === "assistant")
    .slice(-2)
    .map((msg) => msg.content.toLowerCase());

  if (userMessages.length === 0) return "Assistant chat";

  // Combine user and assistant messages for better context
  const allRecentMessages = [...userMessages, ...assistantMessages];

  // Common topic keywords to look for
  const topicKeywords = {
    tech: [
      "technology",
      "programming",
      "code",
      "software",
      "app",
      "website",
      "ai",
      "machine learning",
      "data",
      "algorithm",
      "database",
      "api",
      "framework",
      "react",
      "javascript",
      "python",
      "node",
      "typescript",
      "html",
      "css",
      "frontend",
      "backend",
      "server",
      "client",
      "development",
      "debugging",
      "testing",
      "deployment",
    ],
    science: [
      "science",
      "research",
      "experiment",
      "theory",
      "physics",
      "chemistry",
      "biology",
      "mathematics",
      "statistics",
      "analysis",
      "hypothesis",
    ],
    creative: [
      "design",
      "art",
      "creative",
      "writing",
      "story",
      "project",
      "idea",
      "inspiration",
      "portfolio",
      "branding",
      "visual",
      "aesthetic",
      "ui",
      "ux",
      "user interface",
      "user experience",
      "graphic",
      "illustration",
      "photography",
      "video",
      "animation",
      "music",
      "content",
      "copywriting",
    ],
    business: [
      "business",
      "startup",
      "company",
      "marketing",
      "strategy",
      "planning",
      "finance",
      "investment",
      "revenue",
      "customer",
      "product",
      "market",
    ],
    learning: [
      "learn",
      "study",
      "education",
      "course",
      "tutorial",
      "help",
      "understand",
      "explain",
      "teach",
      "knowledge",
      "skill",
    ],
    problem: [
      "problem",
      "issue",
      "troubleshoot",
      "fix",
      "solve",
      "debug",
      "error",
      "bug",
      "broken",
      "not working",
      "failed",
    ],
    planning: [
      "plan",
      "organize",
      "schedule",
      "timeline",
      "goal",
      "objective",
      "strategy",
      "roadmap",
      "milestone",
      "deadline",
    ],
  };

  // Check for topic matches
  const allText = allRecentMessages.join(" ");
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some((keyword) => allText.includes(keyword))) {
      return topic.charAt(0).toUpperCase() + topic.slice(1);
    }
  }

  // If no specific topic found, try to extract key words
  const words = allText.split(/\s+/).filter((word) => word.length > 3);
  const commonWords = words.filter(
    (word) =>
      ![
        "what",
        "how",
        "why",
        "when",
        "where",
        "this",
        "that",
        "with",
        "from",
        "about",
        "have",
        "will",
        "would",
        "could",
        "should",
        "that's",
        "interesting",
        "fascinating",
        "great",
        "point",
        "think",
        "consider",
        "explore",
        "discuss",
        "talk",
        "tell",
        "more",
        "further",
        "deeper",
        "aspects",
        "angles",
        "implications",
        "conclusion",
        "perspective",
        "question",
        "compelling",
        "relates",
        "earlier",
        "main",
        "different",
        "led",
      ].includes(word)
  );

  if (commonWords.length >= 2) {
    return commonWords.slice(0, 2).join(" ").substring(0, 15);
  }

  // Fallback to first few words of the first user message
  const firstUserMessage = userMessages[0];
  if (firstUserMessage) {
    const firstWords = firstUserMessage.split(/\s+/).slice(0, 3).join(" ");
    if (firstWords.length > 15) {
      return firstWords.substring(0, 15) + "...";
    }
    return firstWords;
  }

  return "Chat";
}

/**
 * Determine the appropriate source and target handles for an edge based on node positions
 */
export function getEdgeHandles(
  sourcePosition: { x: number; y: number },
  targetPosition: { x: number; y: number },
  nodeWidth: number = 500,
  nodeHeight: number = 400
): { sourceHandle: string; targetHandle: string } {
  const sourceCenterX = sourcePosition.x + nodeWidth / 2;
  const sourceCenterY = sourcePosition.y + nodeHeight / 2;
  const targetCenterX = targetPosition.x + nodeWidth / 2;
  const targetCenterY = targetPosition.y + nodeHeight / 2;

  // Calculate the direction from source to target
  const deltaX = targetCenterX - sourceCenterX;
  const deltaY = targetCenterY - sourceCenterY;

  console.log("Edge handle calculation:", {
    sourcePosition,
    targetPosition,
    deltaX,
    deltaY,
    isHorizontal: Math.abs(deltaX) > Math.abs(deltaY),
  });

  // Determine source handle based on target position relative to source
  let sourceHandle = "right"; // default
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    // Horizontal relationship
    if (deltaX > 0) {
      sourceHandle = "right";
    } else {
      sourceHandle = "left";
    }
  } else {
    // Vertical relationship
    if (deltaY > 0) {
      sourceHandle = "bottom";
    } else {
      sourceHandle = "top";
    }
  }

  // Determine target handle based on source position relative to target
  let targetHandle = "left"; // default
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    // Horizontal relationship
    if (deltaX > 0) {
      targetHandle = "left";
    } else {
      targetHandle = "right";
    }
  } else {
    // Vertical relationship
    if (deltaY > 0) {
      targetHandle = "top";
    } else {
      targetHandle = "bottom";
    }
  }

  console.log("Selected handles:", { sourceHandle, targetHandle });

  return { sourceHandle, targetHandle };
}
