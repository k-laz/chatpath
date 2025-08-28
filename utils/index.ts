import { ConversationNode } from "@/types/conversation";

// Generate conversation title based on the first user message
export const getConversationTitle = (node: ConversationNode) => {
  const firstUserMessage = node.messages.find((msg) => msg.role === "user");
  if (!firstUserMessage) return `Conversation ${node.id.slice(0, 8)}`;

  const content = firstUserMessage.content.trim();

  // If it's the welcome message, return a default title
  if (content.includes("Welcome to ChatPath")) {
    return "New Conversation";
  }

  // Extract the first sentence or first 50 characters
  const firstSentence = content.split(/[.!?]/)[0].trim();
  const title =
    firstSentence.length > 50
      ? firstSentence.substring(0, 50) + "..."
      : firstSentence;

  return title || `Conversation ${node.id.slice(0, 8)}`;
};
