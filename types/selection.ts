export interface TextSelection {
  text: string;
  startOffset: number;
  endOffset: number;
  messageId: string;
  nodeId: string;
  range: Range | null;
}

export interface SelectionState {
  currentSelection: TextSelection | null;
  isSelecting: boolean;
  branchButtonPosition: { x: number; y: number } | null;
}

export interface BranchCreationData {
  selection: TextSelection;
  newBranchId: string;
  parentNodeId: string;
  position: { x: number; y: number };
}