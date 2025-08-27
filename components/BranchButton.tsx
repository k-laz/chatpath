'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTextSelection } from '@/hooks/useTextSelection';
import { useConversationTree } from '@/hooks/useConversationTree';
import { v4 as uuidv4 } from 'uuid';

export function BranchButton() {
  const { currentSelection, branchButtonPosition, clearSelection } = useTextSelection();
  const { createBranch, getNodeById } = useConversationTree();

  const handleCreateBranch = () => {
    if (!currentSelection) return;

    const parentNode = getNodeById(currentSelection.nodeId);
    if (!parentNode) return;

    const newBranchId = uuidv4();
    
    const newBranchPosition = {
      x: parentNode.position.x + 300,
      y: parentNode.position.y + (parentNode.branches.length * 200),
    };

    createBranch({
      selection: currentSelection,
      newBranchId,
      parentNodeId: currentSelection.nodeId,
      position: newBranchPosition,
    });

    clearSelection();
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
        className="fixed z-50 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-colors"
        style={{
          left: branchButtonPosition.x,
          top: branchButtonPosition.y,
        }}
        title="Create branch from selected text"
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
          <line x1="6" y1="3" x2="6" y2="15" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="m18 9-2 5-6-2" />
        </svg>
      </motion.button>
    </AnimatePresence>
  );
}