import CodePane from "@/components/CodePane";
import ImportBar from "@/components/ImportBar";
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
    <div className="h-screen w-screen bg-background text-foreground overflow-hidden flex flex-col">
      <ImportBar />
      <div className="flex-1 min-h-0">
        <CodePane />
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
