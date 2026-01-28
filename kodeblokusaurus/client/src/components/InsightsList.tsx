import { useAppState } from "@/contexts/AppStateContext";
import { SemanticInsight } from "@/lib/types";
import { CATEGORY_LABELS, getInsightColor } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";

function getInsightSummary(insight: SemanticInsight): string {
  switch (insight.data.type) {
    case "TypeInference":
      return insight.data.inferredType;
    case "SmartCast":
      return `${insight.data.originalType} -> ${insight.data.narrowedType}`;
    case "Scoping":
      return insight.data.scopeFunction || "scope change";
    case "Extension":
      return insight.data.functionOrProperty;
    case "Lambda":
      return insight.data.returnType;
    case "Nullability":
      return insight.data.nullableType;
    case "Overload":
      return `${insight.data.candidateCount} candidates`;
    default:
      return "";
  }
}

export default function InsightsList() {
  const {
    filteredInsights,
    selectedInsightId,
    setSelectedInsightId,
  } = useAppState();

  const selectedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected insight in the list
  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedInsightId]);

  if (filteredInsights.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
        No insights match the current filters
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y divide-border">
        {filteredInsights.map((insight) => {
          const isSelected = selectedInsightId === insight.id;
          const colorClass = getInsightColor(insight.category);
          const dotColor = colorClass.split(' ').find(c => c.startsWith('text-'))?.replace('text-', 'bg-') || 'bg-gray-400';
          const summary = getInsightSummary(insight);

          return (
            <div
              key={insight.id}
              ref={isSelected ? selectedRef : null}
              className={`
                flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors
                hover:bg-accent/50
                ${isSelected ? 'bg-accent' : ''}
              `}
              onClick={() => setSelectedInsightId(insight.id)}
            >
              {/* Category dot */}
              <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />

              {/* Main content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-sm font-medium text-foreground truncate">
                    {insight.tokenText}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {summary}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{CATEGORY_LABELS[insight.category]}</span>
                  <span className="opacity-50">Ln {insight.position.from.line}</span>
                </div>
              </div>

              {/* Level indicator */}
              {insight.level === "HIGHLIGHTS" && (
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" title="Highlight" />
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
