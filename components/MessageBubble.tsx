"use client";

import { Message, BranchPoint } from "@/types/conversation";
import { motion } from "framer-motion";
import { useBranchContext } from "@/hooks/useBranchContext";

interface MessageBubbleProps {
  message: Message;
  nodeId: string;
  onBranchClick?: (branchPoint: BranchPoint) => void;
}

export function MessageBubble({
  message,
  nodeId,
  onBranchClick,
}: MessageBubbleProps) {
  const { getBranchingContext } = useBranchContext();

  const renderTextWithBranches = (
    content: string,
    branchPoints: BranchPoint[]
  ) => {
    if (branchPoints.length === 0) {
      return content;
    }

    const sortedBranches = [...branchPoints].sort(
      (a, b) => a.startOffset - b.startOffset
    );
    const segments = [];
    let lastOffset = 0;

    sortedBranches.forEach((branch, index) => {
      if (branch.startOffset > lastOffset) {
        segments.push(
          <span key={`text-${index}`}>
            {content.slice(lastOffset, branch.startOffset)}
          </span>
        );
      }

      segments.push(
        <button
          key={`branch-${branch.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onBranchClick?.(branch);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 px-1 rounded transition-colors cursor-pointer"
          title={`Branch: ${branch.selectedText}`}
        >
          {content.slice(branch.startOffset, branch.endOffset)}
        </button>
      );

      lastOffset = branch.endOffset;
    });

    if (lastOffset < content.length) {
      segments.push(<span key="text-end">{content.slice(lastOffset)}</span>);
    }

    return segments;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-4 ${message.role === "user" ? "text-right" : "text-left"}`}
    >
      <div
        data-message-id={message.id}
        data-node-id={nodeId}
        className={`inline-block max-w-[80%] p-3 rounded-lg select-text ${
          message.role === "user"
            ? "bg-blue-500 text-white rounded-br-sm"
            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm"
        }`}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onSelect={(e) => e.stopPropagation()}
      >
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {renderTextWithBranches(message.content, message.branchPoints)}
        </div>
        <div className="text-xs opacity-70 mt-1">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
          {message.branchPoints.length > 0 && (
            <span className="ml-2">
              • {message.branchPoints.length} branch
              {message.branchPoints.length !== 1 ? "es" : ""}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
