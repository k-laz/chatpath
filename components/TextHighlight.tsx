'use client';

interface TextHighlightProps {
  text: string;
  highlights: Array<{
    start: number;
    end: number;
    branchId: string;
    onClick?: () => void;
  }>;
}

export function TextHighlight({ text, highlights }: TextHighlightProps) {
  if (!highlights.length) {
    return <span>{text}</span>;
  }

  const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start);
  const segments = [];
  let lastEnd = 0;

  sortedHighlights.forEach((highlight, index) => {
    if (highlight.start > lastEnd) {
      segments.push(
        <span key={`text-${index}`}>
          {text.slice(lastEnd, highlight.start)}
        </span>
      );
    }

    segments.push(
      <button
        key={`highlight-${highlight.branchId}`}
        onClick={highlight.onClick}
        className="bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 px-1 rounded transition-colors cursor-pointer border-b-2 border-blue-300 dark:border-blue-600"
        title={`Navigate to branch: ${text.slice(highlight.start, highlight.end)}`}
      >
        {text.slice(highlight.start, highlight.end)}
      </button>
    );

    lastEnd = highlight.end;
  });

  if (lastEnd < text.length) {
    segments.push(
      <span key="text-end">
        {text.slice(lastEnd)}
      </span>
    );
  }

  return <>{segments}</>;
}