import { SemanticInsight, InsightCategory, SemanticProfile } from "@/lib/types";
import { sortInsightsByPosition } from "@/lib/utils";
import React, { createContext, useContext, useMemo, useState } from "react";

interface AppState {
  snippet: SemanticProfile | null;
  setSnippet: (snippet: SemanticProfile) => void;
  
  // Selection state
  activeInsightId: string | null; // Hovered
  selectedInsightId: string | null; // Clicked/Pinned
  setActiveInsightId: (id: string | null) => void;
  setSelectedInsightId: (id: string | null) => void;
  
  // Filters
  selectedCategories: InsightCategory[];
  toggleCategory: (category: InsightCategory) => void;
  showHighlightsOnly: boolean;
  setShowHighlightsOnly: (show: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Narrative Mode
  isNarrativeMode: boolean;
  setNarrativeMode: (active: boolean) => void;
  currentNarrativeIndex: number;
  nextNarrativeStep: () => void;
  prevNarrativeStep: () => void;
  
  // Derived
  filteredInsights: SemanticInsight[];
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [snippet, setSnippet] = useState<SemanticProfile | null>(null);
  const [activeInsightId, setActiveInsightId] = useState<string | null>(null);
  const [selectedInsightId, setSelectedInsightId] = useState<string | null>(null);
  
  const [selectedCategories, setSelectedCategories] = useState<InsightCategory[]>([]);
  const [showHighlightsOnly, setShowHighlightsOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isNarrativeMode, setNarrativeMode] = useState(false);
  
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
  
  const currentNarrativeIndex = useMemo(() => {
    if (!selectedInsightId) return -1;
    return filteredInsights.findIndex(i => i.id === selectedInsightId);
  }, [filteredInsights, selectedInsightId]);
  
  const nextNarrativeStep = () => {
    if (filteredInsights.length === 0) return;
    const nextIndex = Math.min(currentNarrativeIndex + 1, filteredInsights.length - 1);
    setSelectedInsightId(filteredInsights[nextIndex].id);
  };
  
  const prevNarrativeStep = () => {
    if (filteredInsights.length === 0) return;
    const prevIndex = Math.max(currentNarrativeIndex - 1, 0);
    setSelectedInsightId(filteredInsights[prevIndex].id);
  };
  
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
      activeInsightId,
      selectedInsightId,
      setActiveInsightId,
      setSelectedInsightId,
      selectedCategories,
      toggleCategory,
      showHighlightsOnly,
      setShowHighlightsOnly,
      searchQuery,
      setSearchQuery,
      isNarrativeMode,
      setNarrativeMode,
      currentNarrativeIndex,
      nextNarrativeStep,
      prevNarrativeStep,
      filteredInsights
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
