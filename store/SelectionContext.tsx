'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { SelectionState, TextSelection } from '@/types/selection';

type SelectionAction =
  | { type: 'SET_SELECTION'; payload: TextSelection | null }
  | { type: 'SET_IS_SELECTING'; payload: boolean }
  | { type: 'SET_BRANCH_BUTTON_POSITION'; payload: { x: number; y: number } | null }
  | { type: 'CLEAR_SELECTION' };

const initialState: SelectionState = {
  currentSelection: null,
  isSelecting: false,
  branchButtonPosition: null,
};

function selectionReducer(state: SelectionState, action: SelectionAction): SelectionState {
  switch (action.type) {
    case 'SET_SELECTION':
      return {
        ...state,
        currentSelection: action.payload,
        isSelecting: action.payload !== null,
      };

    case 'SET_IS_SELECTING':
      return {
        ...state,
        isSelecting: action.payload,
      };

    case 'SET_BRANCH_BUTTON_POSITION':
      return {
        ...state,
        branchButtonPosition: action.payload,
      };

    case 'CLEAR_SELECTION':
      return {
        ...state,
        currentSelection: null,
        isSelecting: false,
        branchButtonPosition: null,
      };

    default:
      return state;
  }
}

const SelectionContext = createContext<{
  state: SelectionState;
  dispatch: React.Dispatch<SelectionAction>;
} | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(selectionReducer, initialState);

  return (
    <SelectionContext.Provider value={{ state, dispatch }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
}