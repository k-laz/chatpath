"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import {
  ConversationNode,
  ConversationTree,
  ConversationEdge,
  Message,
  BranchPoint,
} from "@/types/conversation";
import { BranchCreationData } from "@/types/selection";
import {
  createBranchContextMessage,
  getEdgeHandles,
  generateConversationSummary,
} from "@/utils";
import { v4 as uuidv4 } from "uuid";

interface ConversationState {
  tree: ConversationTree;
  activeNodeId: string | null;
  isLoading: boolean;
  shouldZoomToParent: boolean;
}

type ConversationAction =
  | { type: "SET_TREE"; payload: ConversationTree }
  | { type: "SET_ACTIVE_NODE"; payload: string }
  | {
      type: "ADD_MESSAGE";
      payload: {
        nodeId: string;
        message: Omit<Message, "id" | "timestamp" | "branchPoints">;
      };
    }
  | { type: "CREATE_BRANCH"; payload: BranchCreationData }
  | {
      type: "UPDATE_NODE_POSITION";
      payload: { nodeId: string; position: { x: number; y: number } };
    }
  | { type: "DELETE_NODE"; payload: { nodeId: string; parentNodeId: string } }
  | { type: "NAVIGATE_TO_PARENT"; payload: { nodeId: string } }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "RESET_ZOOM_FLAG" };

const initialState: ConversationState = {
  tree: {
    nodes: [],
    edges: [],
    rootNodeId: "",
  },
  activeNodeId: null,
  isLoading: false,
  shouldZoomToParent: false,
};

function conversationReducer(
  state: ConversationState,
  action: ConversationAction
): ConversationState {
  switch (action.type) {
    case "SET_TREE":
      return {
        ...state,
        tree: action.payload,
        activeNodeId: action.payload.rootNodeId,
      };

    case "SET_ACTIVE_NODE":
      return {
        ...state,
        activeNodeId: action.payload,
      };

    case "ADD_MESSAGE": {
      const { nodeId, message } = action.payload;
      const newMessage: Message = {
        ...message,
        id: uuidv4(),
        timestamp: new Date(),
        branchPoints: [],
      };

      const updatedNodes = state.tree.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, messages: [...node.messages, newMessage] }
          : node
      );

      // Update edge labels for edges connected to this node
      const updatedEdges = state.tree.edges.map((edge) => {
        if (edge.target === nodeId) {
          // Find the target node to get its messages
          const targetNode = updatedNodes.find((node) => node.id === nodeId);
          if (targetNode) {
            const summary = generateConversationSummary(targetNode.messages);
            return {
              ...edge,
              label: summary,
            };
          }
        }
        return edge;
      });

      return {
        ...state,
        tree: {
          ...state.tree,
          nodes: updatedNodes,
          edges: updatedEdges,
        },
      };
    }

    case "CREATE_BRANCH": {
      const { selection, newBranchId, parentNodeId, position } = action.payload;

      const parentNode = state.tree.nodes.find((n) => n.id === parentNodeId);
      if (!parentNode) return state;

      const branchPoint: BranchPoint = {
        id: uuidv4(),
        messageId: selection.messageId,
        selectedText: selection.text,
        startOffset: selection.startOffset,
        endOffset: selection.endOffset,
        childNodeId: newBranchId,
        createdAt: new Date(),
      };

      const contextMessages = parentNode.messages.slice(
        0,
        parentNode.messages.findIndex((m) => m.id === selection.messageId) + 1
      );

      // Create a context message for the new branch
      const contextMessage: Message = {
        id: uuidv4(),
        content: createBranchContextMessage(selection.text),
        role: "assistant",
        timestamp: new Date(),
        branchPoints: [],
      };

      const newNode: ConversationNode = {
        id: newBranchId,
        parentId: parentNodeId,
        position,
        messages: [contextMessage],
        branches: [],
        context: contextMessages.map((m) => `${m.role}: ${m.content}`),
        createdAt: new Date(),
        isActive: true, // Set as active immediately for zoom animation
      };

      // Calculate appropriate edge handles based on node positions
      const { sourceHandle, targetHandle } = getEdgeHandles(
        parentNode.position,
        position
      );

      const newEdge: ConversationEdge = {
        id: `edge-${parentNodeId}-${newBranchId}`,
        source: parentNodeId,
        target: newBranchId,
        sourceHandle,
        targetHandle,
        label: generateConversationSummary([contextMessage]),
        data: {
          selectedText: selection.text,
          branchPoint,
        },
      };

      const updatedNodes = state.tree.nodes.map((node) =>
        node.id === parentNodeId
          ? {
              ...node,
              messages: node.messages.map((msg) =>
                msg.id === selection.messageId
                  ? { ...msg, branchPoints: [...msg.branchPoints, branchPoint] }
                  : msg
              ),
              branches: [...node.branches, branchPoint],
            }
          : node
      );

      return {
        ...state,
        tree: {
          ...state.tree,
          nodes: [...updatedNodes, newNode],
          edges: [...state.tree.edges, newEdge],
        },
        activeNodeId: newBranchId,
      };
    }

    case "UPDATE_NODE_POSITION": {
      const { nodeId, position } = action.payload;
      const updatedNodes = state.tree.nodes.map((node) =>
        node.id === nodeId ? { ...node, position } : node
      );

      return {
        ...state,
        tree: {
          ...state.tree,
          nodes: updatedNodes,
        },
      };
    }

    case "DELETE_NODE": {
      const { nodeId, parentNodeId } = action.payload;
      console.log("DELETE_NODE action:", { nodeId, parentNodeId });

      // Remove the node and its edges
      const updatedNodes = state.tree.nodes.filter(
        (node) => node.id !== nodeId
      );
      const updatedEdges = state.tree.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      );

      // Remove branch points from parent node
      const updatedNodesWithBranchRemoval = updatedNodes.map((node) =>
        node.id === parentNodeId
          ? {
              ...node,
              branches: node.branches.filter(
                (branch) => branch.childNodeId !== nodeId
              ),
              messages: node.messages.map((msg) => ({
                ...msg,
                branchPoints: msg.branchPoints.filter(
                  (bp) => bp.childNodeId !== nodeId
                ),
              })),
            }
          : node
      );

      const newState = {
        ...state,
        tree: {
          ...state.tree,
          nodes: updatedNodesWithBranchRemoval,
          edges: updatedEdges,
        },
        activeNodeId: parentNodeId,
        shouldZoomToParent: true,
      };

      console.log("DELETE_NODE new state:", {
        activeNodeId: newState.activeNodeId,
        shouldZoomToParent: newState.shouldZoomToParent,
      });

      return newState;
    }

    case "NAVIGATE_TO_PARENT": {
      const { nodeId } = action.payload;
      console.log("NAVIGATE_TO_PARENT action:", { nodeId });

      const currentNode = state.tree.nodes.find((node) => node.id === nodeId);

      if (!currentNode || !currentNode.parentId) {
        console.log("No parent found for node:", nodeId);
        return state;
      }

      const newState = {
        ...state,
        activeNodeId: currentNode.parentId,
        shouldZoomToParent: true,
      };

      console.log("NAVIGATE_TO_PARENT new state:", {
        activeNodeId: newState.activeNodeId,
        shouldZoomToParent: newState.shouldZoomToParent,
      });

      return newState;
    }

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };

    case "RESET_ZOOM_FLAG":
      return {
        ...state,
        shouldZoomToParent: false,
      };

    default:
      return state;
  }
}

const ConversationContext = createContext<{
  state: ConversationState;
  dispatch: React.Dispatch<ConversationAction>;
} | null>(null);

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(conversationReducer, initialState);

  return (
    <ConversationContext.Provider value={{ state, dispatch }}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error(
      "useConversation must be used within a ConversationProvider"
    );
  }
  return context;
}
