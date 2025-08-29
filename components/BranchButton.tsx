"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useTextSelection } from "@/hooks/useTextSelection";
import { useConversationTree } from "@/hooks/useConversationTree";
import { calculateSmartNodePosition } from "@/utils";
import { v4 as uuidv4 } from "uuid";

export function BranchButton() {
  const { currentSelection, branchButtonPosition, clearSelection } =
    useTextSelection();
  const { createBranch, getNodeById, tree } = useConversationTree();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateBranch = async () => {
    if (!currentSelection || isCreating) return;

    setIsCreating(true);

    try {
      const parentNode = getNodeById(currentSelection.nodeId);
      if (!parentNode) return;

      const newBranchId = uuidv4();

      // Use Dagre-based positioning to avoid collisions
      const newBranchPosition = calculateSmartNodePosition(
        parentNode.position,
        tree.nodes,
        currentSelection.nodeId,
        tree.edges
      );

      createBranch({
        selection: currentSelection,
        newBranchId,
        parentNodeId: currentSelection.nodeId,
        position: newBranchPosition,
      });

      clearSelection();
    } finally {
      setIsCreating(false);
    }
  };

  if (!currentSelection || !branchButtonPosition) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleCreateBranch}
        disabled={isCreating}
        className={`fixed z-50 ${
          isCreating
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600"
        } text-white p-2 rounded-full shadow-lg transition-colors`}
        style={{
          left: branchButtonPosition.x,
          top: branchButtonPosition.y,
        }}
        title={
          isCreating ? "Creating branch..." : "Create branch from selected text"
        }
      >
        {isCreating ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-spin"
          >
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        ) : (
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
            <line x1="6" y1="3" x2="6" y2="15" />
            <circle cx="18" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <path d="m18 9-2 5-6-2" />
          </svg>
        )}
      </motion.button>
    </AnimatePresence>
  );
}
