import { SemanticInsight, InsightCategory, SemanticProfile } from "@/lib/types";
import { sortInsightsByPosition } from "@/lib/utils";
import React, { createContext, useContext, useMemo, useState } from "react";

interface AppState {
  snippet: SemanticProfile | null;
  setSnippet: (snippet: SemanticProfile) => void;

  // Selection state - click only (no hover affecting global state)
  selectedInsightId: string | null;
  setSelectedInsightId: (id: string | null) => void;

  // Filters
  selectedCategories: InsightCategory[];
  toggleCategory: (category: InsightCategory) => void;
  showHighlightsOnly: boolean;
  setShowHighlightsOnly: (show: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Derived
  filteredInsights: SemanticInsight[];

  // Details panel
  detailsExpanded: boolean;
  setDetailsExpanded: (expanded: boolean) => void;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [snippet, setSnippet] = useState<SemanticProfile | null>(null);
  const [selectedInsightId, setSelectedInsightId] = useState<string | null>(null);

  const [selectedCategories, setSelectedCategories] = useState<InsightCategory[]>([]);
  const [showHighlightsOnly, setShowHighlightsOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [detailsExpanded, setDetailsExpanded] = useState(true);

  const filteredInsights = useMemo(() => {
    if (!snippet) return [];

    let insights = snippet.insights;

    // Filter by category
    if (selectedCategories.length > 0) {
      insights = insights.filter(i => selectedCategories.includes(i.category));
    }

    // Filter by level
    if (showHighlightsOnly) {
      insights = insights.filter(i => i.level === "HIGHLIGHTS");
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      insights = insights.filter(i =>
        i.tokenText.toLowerCase().includes(query) ||
        i.kind.toLowerCase().includes(query) ||
        JSON.stringify(i.data).toLowerCase().includes(query)
      );
    }

    return sortInsightsByPosition(insights);
  }, [snippet, selectedCategories, showHighlightsOnly, searchQuery]);

  const toggleCategory = (category: InsightCategory) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <AppStateContext.Provider value={{
      snippet,
      setSnippet,
      selectedInsightId,
      setSelectedInsightId,
      selectedCategories,
      toggleCategory,
      showHighlightsOnly,
      setShowHighlightsOnly,
      searchQuery,
      setSearchQuery,
      filteredInsights,
      detailsExpanded,
      setDetailsExpanded
    }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
}
