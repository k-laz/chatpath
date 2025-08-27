export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  branchPoints: BranchPoint[];
}

export interface BranchPoint {
  id: string;
  messageId: string;
  selectedText: string;
  startOffset: number;
  endOffset: number;
  childNodeId: string;
  createdAt: Date;
}

export interface ConversationNode {
  id: string;
  parentId: string | null;
  position: { x: number; y: number };
  messages: Message[];
  branches: BranchPoint[];
  context: string[];
  createdAt: Date;
  isActive: boolean;
}

export interface ConversationTree {
  nodes: ConversationNode[];
  edges: ConversationEdge[];
  rootNodeId: string;
}

export interface ConversationEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  data?: {
    selectedText: string;
    branchPoint: BranchPoint;
  };
}