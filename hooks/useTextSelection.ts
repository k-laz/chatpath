'use client';

import { useCallback, useEffect } from 'react';
import { useSelection } from '@/store/SelectionContext';
import { TextSelection } from '@/types/selection';

export function useTextSelection() {
  const { state, dispatch } = useSelection();

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    
    if (!selection || selection.rangeCount === 0) {
      dispatch({ type: 'CLEAR_SELECTION' });
      return;
    }

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();
    
    if (!selectedText || selectedText.length < 3) {
      dispatch({ type: 'CLEAR_SELECTION' });
      return;
    }

    const messageElement = range.commonAncestorContainer.parentElement?.closest('[data-message-id]');
    const nodeElement = range.commonAncestorContainer.parentElement?.closest('[data-node-id]');
    
    if (!messageElement || !nodeElement) {
      dispatch({ type: 'CLEAR_SELECTION' });
      return;
    }

    const messageId = messageElement.getAttribute('data-message-id');
    const nodeId = nodeElement.getAttribute('data-node-id');
    
    if (!messageId || !nodeId) {
      dispatch({ type: 'CLEAR_SELECTION' });
      return;
    }

    const messageText = messageElement.textContent || '';
    const startOffset = messageText.indexOf(selectedText);
    const endOffset = startOffset + selectedText.length;

    if (startOffset === -1) {
      dispatch({ type: 'CLEAR_SELECTION' });
      return;
    }

    const textSelection: TextSelection = {
      text: selectedText,
      startOffset,
      endOffset,
      messageId,
      nodeId,
      range: range.cloneRange(),
    };

    dispatch({ type: 'SET_SELECTION', payload: textSelection });

    const rect = range.getBoundingClientRect();
    const buttonPosition = {
      x: rect.right + 10,
      y: rect.top + (rect.height / 2) - 20,
    };
    
    dispatch({ type: 'SET_BRANCH_BUTTON_POSITION', payload: buttonPosition });
  }, [dispatch]);

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    dispatch({ type: 'CLEAR_SELECTION' });
  }, [dispatch]);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleSelectionChange]);

  return {
    currentSelection: state.currentSelection,
    isSelecting: state.isSelecting,
    branchButtonPosition: state.branchButtonPosition,
    clearSelection,
  };
}