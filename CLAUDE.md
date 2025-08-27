# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` - Starts Next.js development server with Turbopack
- **Build**: `npm run build` - Creates production build with Turbopack optimization
- **Production server**: `npm start` - Runs production server after build

The development server runs on http://localhost:3000 and features hot reloading.

## Project Overview

This is a conversational tree interface application that allows users to branch off from any point in a chat thread to explore tangential questions while preserving context. Think of it as Git branching for conversations - users can create visual trees of knowledge exploration by dragging text selections into new conversation branches.

## Core Features

- **Granular Text Selection Branching**: Users can select any portion of text within any message to create branches
- **Visual Tree Structure**: Conversations are displayed as an interactive node-based graph
- **Context Inheritance**: New branches inherit full conversation history up to the branching point
- **Persistent Branch Tracking**: Visual indicators show where conversations have diverged
- **Interactive Canvas**: Zoom, pan, and drag functionality for exploring conversation trees

## Project Architecture

This is a Next.js 15 application using the App Router pattern with the following structure:

- **App Directory**: `app/` - Contains all routes and layouts using App Router

  - `layout.tsx` - Root layout with Geist fonts and global styling
  - `page.tsx` - Main conversational tree interface
  - `globals.css` - Global CSS with Tailwind and CSS variables for theming

- **Components Directory**: `components/`

  - `ConversationTree.tsx` - Main React Flow canvas component
  - `ChatNode.tsx` - Custom node component containing chat interface
  - `MessageBubble.tsx` - Individual message component with text selection
  - `BranchButton.tsx` - Floating button for creating branches from selections
  - `TextHighlight.tsx` - Component for highlighting previously branched text

- **Hooks Directory**: `hooks/`

  - `useTextSelection.ts` - Handles browser Selection API for granular text selection
  - `useConversationTree.ts` - Manages tree state and branching logic
  - `useBranchContext.ts` - Handles context inheritance between branches

- **Store Directory**: `store/`

  - `ConversationContext.tsx` - React Context provider for conversation tree state
  - `SelectionContext.tsx` - Context provider for text selection and branch creation

- **Types Directory**: `types/`
  - `conversation.ts` - TypeScript interfaces for messages, branches, and tree structure
  - `selection.ts` - Types for text selection and branching data

## Technology Stack

- **Framework**: Next.js 15.5.0 with App Router
- **Runtime**: React 19.1.0
- **Styling**: Tailwind CSS v4 with PostCSS
- **Fonts**: Geist Sans and Geist Mono via `next/font/google`
- **Build Tool**: Turbopack (enabled for both dev and build)

### Key Libraries

- **React Flow**: Canvas-based node interface for conversation tree visualization
- **React Context**: Native React state management for conversation tree and selections
- **Framer Motion**: Smooth animations for branch creation and transitions
- **Floating UI**: Precise positioning for branch creation buttons and tooltips

### Browser APIs

- **Selection API**: Native browser text selection for granular branching
- **Intersection Observer API**: Optimized rendering of large conversation trees
- **ResizeObserver API**: Responsive node sizing and layout adjustments

## Data Structure

The conversation tree follows this structure:

```typescript
interface ConversationNode {
  id: string;
  parentId: string | null;
  position: { x: number; y: number };
  messages: Message[];
  branches: BranchPoint[];
  context: string[]; // Inherited conversation history
  createdAt: Date;
  isActive: boolean;
}

interface BranchPoint {
  id: string;
  messageId: string;
  selectedText: string;
  startOffset: number;
  endOffset: number;
  childNodeId: string;
  createdAt: Date;
}

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  branchPoints: BranchPoint[];
}
```

## Key Implementation Details

### Text Selection System

- Uses native browser Selection API to capture precise character offsets
- Floating branch button appears on text selection with Floating UI positioning
- Selected text is highlighted and tracked for future navigation

### Visual Branch Indicators

- Previously branched text segments have blue highlight backgrounds
- Small indicator dots mark branching points within messages
- Click highlights to navigate to associated branches

### Context Inheritance

- New branches automatically inherit conversation history up to branching point
- Branch context is displayed with "Continuing from: [selected text]" prefix
- Full message history is preserved and accessible

### Canvas Interactions

- React Flow handles zoom, pan, and node positioning
- Custom edges connect parent messages to child branches
- Edge labels show the selected text that created each branch

## Performance Considerations

- **Virtualization**: Large conversation trees use React Flow's built-in virtualization
- **Lazy Loading**: Chat messages load incrementally as nodes come into view
- **State Persistence**: Conversation trees are saved to localStorage with debounced updates
- **Memory Management**: Inactive branches can be collapsed to reduce render overhead

## Styling Guidelines

- Uses Tailwind CSS v4 with custom CSS variables for theming
- Supports automatic light/dark mode switching
- Custom node styling integrates with React Flow's styling system
- Framer Motion animations use CSS transforms for optimal performance

## Development Best Practices

- Each conversation node is a separate React component for optimal re-rendering
- Text selection state is managed through React Context with useReducer for complex state updates
- Branch creation is handled through immutable state updates via context actions
- All user interactions are debounced to prevent performance issues
- Context providers are split by concern (conversation vs selection) to minimize unnecessary re-renders

The project follows Next.js App Router conventions with file-based routing and uses the latest React features including concurrent rendering for smooth canvas interactions.
