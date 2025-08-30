"use client";

import { useState, useRef, useEffect } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { ConversationNode } from "@/types/conversation";
import { MessageBubble } from "./MessageBubble";
import { useConversationTree } from "@/hooks/useConversationTree";
import { useBranchContext } from "@/hooks/useBranchContext";
import { getConversationTitle } from "@/utils";

interface ChatNodeData {
  node: ConversationNode;
  onBranchClick?: (branchPoint: any) => void;
}

export function ChatNode({
  data,
  selected,
}: {
  data: ChatNodeData;
  selected?: boolean;
}) {
  const { node, onBranchClick } = data;
  const [inputValue, setInputValue] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  const {
    addMessage,
    setActiveNode,
    activeNodeId,
    deleteNode,
    navigateToParent,
  } = useConversationTree();
  const { getBranchingContext } = useBranchContext();

  const isActive = activeNodeId === node.id;

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [node.messages.length]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    addMessage(node.id, inputValue.trim(), "user");

    setTimeout(() => {
      const responses = [
        "That's an interesting perspective! Can you tell me more about what led you to that conclusion?",
        "I see what you're getting at. How do you think this relates to what we discussed earlier?",
        "That's a great point. What would you say are the main implications of this?",
        "Fascinating! I'd love to explore this further. What aspects would you like to dive deeper into?",
        "You raise a compelling question. Let me think about the different angles we could consider...",
      ];

      const randomResponse =
        responses[Math.floor(Math.random() * responses.length)];
      addMessage(node.id, randomResponse, "assistant");
    }, 1000);

    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFocus = () => {
    if (activeNodeId !== node.id) {
      setActiveNode(node.id);
    }
  };

  const handleDelete = () => {
    if (
      node.parentId &&
      confirm(
        "Are you sure you want to delete this branch? This action cannot be undone."
      )
    ) {
      deleteNode(node.id, node.parentId);
    }
  };

  return (
    <>
      {/* Target handles for incoming connections */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!bg-blue-500 !w-4 !h-4 !border-2 !border-white dark:!border-gray-800"
        style={{ zIndex: 10 }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        className="!bg-blue-500 !w-4 !h-4 !border-2 !border-white dark:!border-gray-800"
        style={{ zIndex: 10 }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        className="!bg-blue-500 !w-4 !h-4 !border-2 !border-white dark:!border-gray-800"
        style={{ zIndex: 10 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!bg-blue-500 !w-4 !h-4 !border-2 !border-white dark:!border-gray-800"
        style={{ zIndex: 10 }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: 1,
          scale: 1,
          // Add a subtle scale animation when becoming active
          ...(isActive && { scale: 1.02 }),
        }}
        transition={{
          duration: 0.3,
          // Add a spring animation for the active state
          ...(isActive && {
            scale: {
              type: "spring",
              stiffness: 300,
              damping: 20,
            },
          }),
        }}
        className={`bg-white dark:bg-gray-800 border-2 rounded-lg shadow-lg min-w-[400px] max-w-[500px] ${
          selected ? "border-blue-500" : "border-gray-200 dark:border-gray-700"
        } ${isActive ? "ring-2 ring-blue-300" : ""}`}
        style={{
          boxShadow:
            isActive && node.messages.length === 1
              ? "0 0 20px rgba(59, 130, 246, 0.3)"
              : undefined,
        }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3 node-drag-handle cursor-move">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isActive ? "bg-green-500" : "bg-gray-400"
                }`}
              />
              <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                {getConversationTitle(node)}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              {node.parentId && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(
                        "Back button clicked for node:",
                        node.id,
                        "parent:",
                        node.parentId
                      );
                      navigateToParent(node.id);
                    }}
                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:outline-2 hover:outline hover:outline-blue-300 dark:hover:outline-blue-600"
                    onMouseDown={(e) => e.stopPropagation()}
                    title="Go back to parent node"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 hover:outline-2 hover:outline hover:outline-red-300 dark:hover:outline-red-600"
                    onMouseDown={(e) => e.stopPropagation()}
                    title="Delete branch and return to parent"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </>
              )}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:outline-2 hover:outline hover:outline-gray-300 dark:hover:outline-gray-600"
                onMouseDown={(e) => e.stopPropagation()}
              >
                {isExpanded ? "−" : "+"}
              </button>
            </div>
          </div>

          {isExpanded && (
            <>
              <div
                ref={messagesRef}
                className="h-64 overflow-y-auto mb-4 pr-2 custom-scrollbar nowheel nopan cursor-text"
                onMouseDown={(e) => e.stopPropagation()}
                onMouseMove={(e) => e.stopPropagation()}
              >
                {node.messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    nodeId={node.id}
                    onBranchClick={(branchPoint) => {
                      setActiveNode(branchPoint.childNodeId);
                      onBranchClick?.(branchPoint);
                    }}
                  />
                ))}
              </div>

              <div
                className="flex gap-2"
                onMouseDown={(e) => e.stopPropagation()}
                onMouseMove={(e) => e.stopPropagation()}
              >
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  onFocus={(e) => {
                    e.stopPropagation();
                    handleFocus();
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  placeholder={
                    node.messages.length === 2 &&
                    node.messages[0].content.includes("Welcome to ChatPath")
                      ? "Ask me anything to get started! Try: 'What is machine learning?' or 'Help me plan a project'"
                      : `Type your message...${
                          node.context.length > 0
                            ? " (continuing from branch)"
                            : ""
                        }`
                  }
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded text-sm resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  rows={2}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 hover:outline-2 hover:outline hover:outline-blue-400 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Source handles for outgoing connections */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="!bg-green-500 !w-4 !h-4 !border-2 !border-white dark:!border-gray-800"
        style={{ zIndex: 10 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!bg-green-500 !w-4 !h-4 !border-2 !border-white dark:!border-gray-800"
        style={{ zIndex: 10 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!bg-green-500 !w-4 !h-4 !border-2 !border-white dark:!border-gray-800"
        style={{ zIndex: 10 }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="!bg-green-500 !w-4 !h-4 !border-2 !border-white dark:!border-gray-800"
        style={{ zIndex: 10 }}
      />
    </>
  );
}
