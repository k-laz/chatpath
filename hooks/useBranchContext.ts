'use client';

import { useCallback } from 'react';
import { useConversationTree } from './useConversationTree';
import { ConversationNode } from '@/types/conversation';

export function useBranchContext() {
  const { getNodeById } = useConversationTree();

  const getFullContext = useCallback((node: ConversationNode): string[] => {
    const fullContext: string[] = [];
    
    if (node.parentId) {
      const parentNode = getNodeById(node.parentId);
      if (parentNode) {
        fullContext.push(...getFullContext(parentNode));
      }
    }

    fullContext.push(...node.context);
    
    return fullContext;
  }, [getNodeById]);

  const getBranchingContext = useCallback((nodeId: string, selectedText: string): string => {
    const node = getNodeById(nodeId);
    if (!node) return '';
    
    const context = getFullContext(node);
    const contextString = context.join('\n');
    
    return `Continuing from: "${selectedText}"\n\nPrevious context:\n${contextString}`;
  }, [getNodeById, getFullContext]);

  const getAncestryPath = useCallback((nodeId: string): string[] => {
    const path: string[] = [];
    let currentNode = getNodeById(nodeId);
    
    while (currentNode) {
      path.unshift(currentNode.id);
      if (currentNode.parentId) {
        currentNode = getNodeById(currentNode.parentId);
      } else {
        break;
      }
    }
    
    return path;
  }, [getNodeById]);

  const isDescendantOf = useCallback((nodeId: string, potentialAncestorId: string): boolean => {
    const path = getAncestryPath(nodeId);
    return path.includes(potentialAncestorId);
  }, [getAncestryPath]);

  return {
    getFullContext,
    getBranchingContext,
    getAncestryPath,
    isDescendantOf,
  };
}