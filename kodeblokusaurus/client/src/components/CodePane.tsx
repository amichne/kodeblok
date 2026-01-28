import { useAppState } from "@/contexts/AppStateContext";
import { getInsightColor } from "@/lib/utils";
import { generateHoverMarkdown } from "@/lib/markdownGenerator";
import Editor, { Monaco } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { useEffect, useRef, useState } from "react";
import InsightCard from "./InsightCard";
import { SemanticInsight } from "@/lib/types";

export default function CodePane() {
  const { 
    snippet, 
    filteredInsights, 
    activeInsightId, 
    selectedInsightId,
    setActiveInsightId,
    setSelectedInsightId
  } = useAppState();
  
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsCollectionRef = useRef<editor.IEditorDecorationsCollection | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ top: number; left: number } | null>(null);
  const [hoveredInsight, setHoveredInsight] = useState<SemanticInsight | null>(null);

  // Handle editor mount
  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Define custom theme based on JetBrains Dark
    monaco.editor.defineTheme("jetbrains-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "CC7832" }, // Orange
        { token: "type", foreground: "A9B7C6" }, // Light Grey
        { token: "string", foreground: "6A8759" }, // Green
        { token: "number", foreground: "6897BB" }, // Blue
        { token: "comment", foreground: "808080" }, // Grey
      ],
      colors: {
        "editor.background": "#1E1F22", // JetBrains Dark Background
        "editor.lineHighlightBackground": "#2B2D30",
        "editorLineNumber.foreground": "#4E5157",
        "editorGutter.background": "#1E1F22",
      }
    });
    
    monaco.editor.setTheme("jetbrains-dark");
    
    // Add event listeners
    editor.onMouseMove((e) => {
      const position = e.target.position;
      
      // Clear hover if not over text or no position
      if (!position || e.target.type !== monaco.editor.MouseTargetType.CONTENT_TEXT) {
        setActiveInsightId(null);
        setHoveredInsight(null);
        setHoverPosition(null);
        return;
      }
      
      // Find insight at this position
      const insight = filteredInsights.find(i => 
        position.lineNumber >= i.position.from.line &&
        position.lineNumber <= i.position.to.line &&
        (position.lineNumber > i.position.from.line || position.column >= i.position.from.col) &&
        (position.lineNumber < i.position.to.line || position.column <= i.position.to.col)
      );
      
      if (insight) {
        setActiveInsightId(insight.id);
        setHoveredInsight(insight);
        
        // Calculate screen coordinates for the hover card
        const scrolledVisiblePosition = editor.getScrolledVisiblePosition(position);
        if (scrolledVisiblePosition) {
          const editorDomNode = editor.getDomNode();
          if (editorDomNode) {
            const rect = editorDomNode.getBoundingClientRect();
            setHoverPosition({
              top: rect.top + scrolledVisiblePosition.top + 25, // Offset below the line
              left: rect.left + scrolledVisiblePosition.left + 10 // Offset to the right
            });
          }
        }
      } else {
        setActiveInsightId(null);
        setHoveredInsight(null);
        setHoverPosition(null);
      }
    });
    
    editor.onMouseDown((e) => {
      if (e.target.type === monaco.editor.MouseTargetType.CONTENT_TEXT) {
        const position = e.target.position;
        if (!position) return;
        
        const insight = filteredInsights.find(i => 
          position.lineNumber >= i.position.from.line &&
          position.lineNumber <= i.position.to.line &&
          (position.lineNumber > i.position.from.line || position.column >= i.position.from.col) &&
          (position.lineNumber < i.position.to.line || position.column <= i.position.to.col)
        );
        
        if (insight) {
          setSelectedInsightId(insight.id);
        }
      }
    });
  };

  // Update decorations when insights change
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !snippet) return;
    
    const decorations: editor.IModelDeltaDecoration[] = filteredInsights.map(insight => {
      const isSelected = selectedInsightId === insight.id;
      const isActive = activeInsightId === insight.id;
      
      // Map category to CSS class for color
      // We'll use inline styles via className in global CSS or just use standard classes
      // Since Monaco needs CSS classes for decorations, we'll define them in index.css
      // For now, let's use a generic class and dynamic class names
      
      let className = `insight-decoration insight-${insight.category.toLowerCase()}`;
      if (isSelected) className += " insight-selected";
      if (isActive) className += " insight-active";
      
      return {
        range: new monacoRef.current!.Range(
          insight.position.from.line,
          insight.position.from.col,
          insight.position.to.line,
          insight.position.to.col
        ),
        options: {
          isWholeLine: false,
          className: className,
          // hoverMessage: { value: generateHoverMarkdown(insight) }, // Disabled in favor of custom overlay
          inlineClassName: isSelected ? "insight-text-selected" : undefined
        }
      };
    });
    
    if (decorationsCollectionRef.current) {
      decorationsCollectionRef.current.clear();
    }
    decorationsCollectionRef.current = editorRef.current.createDecorationsCollection(decorations);
    
  }, [filteredInsights, activeInsightId, selectedInsightId, snippet]);

  // Scroll to selected insight
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !selectedInsightId) return;
    
    const insight = filteredInsights.find(i => i.id === selectedInsightId);
    if (insight) {
      editorRef.current.revealRangeInCenter(
        new monacoRef.current!.Range(
          insight.position.from.line,
          insight.position.from.col,
          insight.position.to.line,
          insight.position.to.col
        ),
        editor.ScrollType.Smooth
      );
    }
  }, [selectedInsightId, filteredInsights]);

  return (
    <div className="h-full w-full bg-[#1E1F22] border-r border-[#2B2D30]">
      <Editor
        height="100%"
        defaultLanguage="kotlin"
        value={snippet?.code || "// Loading..."}
        onMount={handleEditorDidMount}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          fontFamily: "'JetBrains Mono', monospace",
          lineNumbers: "on",
          renderLineHighlight: "all",
          contextmenu: false,
          padding: { top: 20, bottom: 20 },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          scrollbar: {
            vertical: "visible",
            horizontal: "visible",
            useShadows: false,
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10
          }
        }}
      />
      
      {/* Custom Hover Overlay */}
      {hoveredInsight && hoverPosition && (
        <div 
          className="fixed z-50 pointer-events-none"
          style={{ 
            top: hoverPosition.top, 
            left: hoverPosition.left,
            maxWidth: '450px'
          }}
        >
          <InsightCard insight={hoveredInsight} className="shadow-xl border-primary/20 pointer-events-auto" />
        </div>
      )}
    </div>
  );
}
