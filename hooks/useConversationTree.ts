"use client";

import { useCallback, useEffect } from "react";
import { useConversation } from "@/store/ConversationContext";
import {
  ConversationNode,
  ConversationTree,
  Message,
} from "@/types/conversation";
import { BranchCreationData } from "@/types/selection";
import { v4 as uuidv4 } from "uuid";

export function useConversationTree() {
  const { state, dispatch } = useConversation();

  const initializeTree = useCallback(() => {
    const rootNodeId = uuidv4();
    const welcomeMessage: Message = {
      id: uuidv4(),
      content:
        '🌳 Welcome to ChatPath!\n\nThis is a conversational tree interface where you can branch off from any point in our conversation to explore different topics while preserving context.\n\nHere\'s how it works:\n• Select any text in this message or future responses\n• A blue branch button will appear\n• Click it to create a new conversation branch\n• Each branch maintains the full context up to that point\n\nTry it now! Select the phrase "explore different topics" above and click the branch button that appears.',
      role: "assistant",
      timestamp: new Date(),
      branchPoints: [],
    };

    const promptMessage: Message = {
      id: uuidv4(),
      content:
        "What would you like to talk about today? I can help you with questions about technology, science, creative projects, problem-solving, or anything else that interests you!",
      role: "assistant",
      timestamp: new Date(),
      branchPoints: [],
    };

    const rootNode: ConversationNode = {
      id: rootNodeId,
      parentId: null,
      position: { x: 0, y: 0 },
      messages: [welcomeMessage, promptMessage],
      branches: [],
      context: [],
      createdAt: new Date(),
      isActive: true,
    };

    const tree: ConversationTree = {
      nodes: [rootNode],
      edges: [],
      rootNodeId,
    };

    dispatch({ type: "SET_TREE", payload: tree });
  }, [dispatch]);

  const addMessage = useCallback(
    (nodeId: string, content: string, role: "user" | "assistant") => {
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          nodeId,
          message: { content, role },
        },
      });
    },
    [dispatch]
  );

  const createBranch = useCallback(
    (branchData: BranchCreationData) => {
      dispatch({ type: "CREATE_BRANCH", payload: branchData });
    },
    [dispatch]
  );

  const setActiveNode = useCallback(
    (nodeId: string) => {
      dispatch({ type: "SET_ACTIVE_NODE", payload: nodeId });
    },
    [dispatch]
  );

  const updateNodePosition = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      dispatch({ type: "UPDATE_NODE_POSITION", payload: { nodeId, position } });
    },
    [dispatch]
  );

  const deleteNode = useCallback(
    (nodeId: string, parentNodeId: string) => {
      dispatch({ type: "DELETE_NODE", payload: { nodeId, parentNodeId } });
    },
    [dispatch]
  );

  const navigateToParent = useCallback(
    (nodeId: string) => {
      dispatch({ type: "NAVIGATE_TO_PARENT", payload: { nodeId } });
    },
    [dispatch]
  );

  const resetZoomFlag = useCallback(() => {
    dispatch({ type: "RESET_ZOOM_FLAG" });
  }, [dispatch]);

  const resetZoomToNode = useCallback(() => {
    dispatch({ type: "RESET_ZOOM_TO_NODE" });
  }, [dispatch]);

  const getNodeById = useCallback(
    (nodeId: string): ConversationNode | undefined => {
      return state.tree.nodes.find((node) => node.id === nodeId);
    },
    [state.tree.nodes]
  );

  const getActiveNode = useCallback((): ConversationNode | undefined => {
    return state.activeNodeId ? getNodeById(state.activeNodeId) : undefined;
  }, [state.activeNodeId, getNodeById]);

  const resetTree = useCallback(() => {
    localStorage.removeItem("chatpath-conversation-tree");
    initializeTree();
  }, [initializeTree]);

  const ensureMinimumNodes = useCallback(() => {
    if (state.tree.nodes.length === 0) {
      initializeTree();
    }
  }, [state.tree.nodes.length, initializeTree]);

  useEffect(() => {
    if (state.tree.nodes.length === 0) {
      initializeTree();
    }
  }, [state.tree.nodes.length, initializeTree]);

  useEffect(() => {
    const savedTree = localStorage.getItem("chatpath-conversation-tree");
    if (savedTree && state.tree.nodes.length === 0) {
      try {
        const parsedTree = JSON.parse(savedTree);
        // Ensure parsed tree has at least one node
        if (parsedTree.nodes && parsedTree.nodes.length > 0) {
          dispatch({ type: "SET_TREE", payload: parsedTree });
        } else {
          initializeTree();
        }
      } catch (error) {
        console.error("Failed to load saved conversation tree:", error);
        initializeTree();
      }
    }
  }, [dispatch, initializeTree, state.tree.nodes.length]);

  useEffect(() => {
    if (state.tree.nodes.length > 0) {
      const treeToSave = {
        ...state.tree,
        nodes: state.tree.nodes.map((node) => ({
          ...node,
          messages: node.messages.map((msg) => ({
            ...msg,
            timestamp:
              msg.timestamp instanceof Date
                ? msg.timestamp.toISOString()
                : msg.timestamp,
          })),
          createdAt:
            node.createdAt instanceof Date
              ? node.createdAt.toISOString()
              : node.createdAt,
        })),
      };
      localStorage.setItem(
        "chatpath-conversation-tree",
        JSON.stringify(treeToSave)
      );
    }
  }, [state.tree]);

  return {
    tree: state.tree,
    activeNodeId: state.activeNodeId,
    isLoading: state.isLoading,
    shouldZoomToParent: state.shouldZoomToParent,
    zoomToNodeId: state.zoomToNodeId,
    addMessage,
    createBranch,
    setActiveNode,
    updateNodePosition,
    deleteNode,
    navigateToParent,
    resetZoomFlag,
    resetZoomToNode,
    getNodeById,
    getActiveNode,
    initializeTree,
    resetTree,
    ensureMinimumNodes,
  };
}
