import CodePane from "@/components/CodePane";
import InsightInspector from "@/components/InsightInspector";
import ScopeTree from "@/components/ScopeTree";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NarrativeControls from "@/components/NarrativeControls";
import Timeline from "@/components/Timeline";
import TopBar from "@/components/TopBar";
import { AppStateProvider, useAppState } from "@/contexts/AppStateContext";
import { SAMPLE_SNIPPET } from "@/lib/sampleData";
import { useEffect } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

function KodeblokApp() {
  const { setSnippet } = useAppState();

  // Load sample data on mount
  useEffect(() => {
    setSnippet(SAMPLE_SNIPPET);
  }, [setSnippet]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#1E1F22] text-foreground overflow-hidden">
      <TopBar />
      
      <div className="flex-1 relative overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={65} minSize={30}>
            <CodePane />
          </ResizablePanel>
          
          <ResizableHandle className="bg-[#2B2D30] w-[1px]" />
                  <ResizablePanel defaultSize={30} minSize={20}>
              <Tabs defaultValue="insights" className="h-full flex flex-col">
                <div className="border-b border-border px-4 bg-background">
                  <TabsList className="w-full justify-start h-9 bg-transparent p-0">
                    <TabsTrigger 
                      value="insights" 
                      className="h-9 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 text-xs"
                    >
                      Insights
                    </TabsTrigger>
                    <TabsTrigger 
                      value="scopes" 
                      className="h-9 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 text-xs"
                    >
                      Scope Tree
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="insights" className="flex-1 m-0 h-full overflow-hidden data-[state=inactive]:hidden">
                  <InsightInspector />
                </TabsContent>
                <TabsContent value="scopes" className="flex-1 m-0 h-full overflow-hidden data-[state=inactive]:hidden">
                  <ScopeTree />
                </TabsContent>
              </Tabs>
            </ResizablePanel>        </ResizablePanelGroup>
        
        <NarrativeControls />
      </div>
      
      <Timeline />
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
