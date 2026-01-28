import CodePane from "@/components/CodePane";
import InsightsList from "@/components/InsightsList";
import InsightDetails from "@/components/InsightDetails";
import TopBar from "@/components/TopBar";
import { AppStateProvider, useAppState } from "@/contexts/AppStateContext";
import { SAMPLE_SNIPPET } from "@/lib/sampleData";
import { useEffect } from "react";

function KodeblokApp() {
  const { setSnippet } = useAppState();

  // Load sample data on mount
  useEffect(() => {
    setSnippet(SAMPLE_SNIPPET);
  }, [setSnippet]);

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Top Bar */}
      <TopBar />

      {/* Main Content - Single Pane Vertical Layout */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Code Viewer - Takes majority of space */}
        <div className="flex-1 min-h-0 border-b border-border">
          <CodePane />
        </div>

        {/* Insights List - Fixed height, scrollable */}
        <div className="h-48 border-b border-border bg-background overflow-hidden shrink-0">
          <div className="h-full flex flex-col">
            <div className="px-3 py-1.5 border-b border-border bg-secondary/50 shrink-0">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Insights
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              <InsightsList />
            </div>
          </div>
        </div>

        {/* Details Panel - Collapsible */}
        <InsightDetails />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <AppStateProvider>
      <KodeblokApp />
    </AppStateProvider>
  );
}
