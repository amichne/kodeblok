import { useAppState } from "@/contexts/AppStateContext";
import { CATEGORY_LABELS } from "@/lib/utils";
import Editor, { Monaco } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { useEffect, useRef, useState, useCallback } from "react";
import { SemanticInsight } from "@/lib/types";

interface HoverInfo {
  insight: SemanticInsight;
  top: number;
  left: number;
}

export default function CodePane() {
  const {
    snippet,
    filteredInsights,
    selectedInsightId,
    setSelectedInsightId
  } = useAppState();

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsCollectionRef = useRef<editor.IEditorDecorationsCollection | null>(null);

  // Local hover state - lightweight, does not affect global state
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);

  // Find insight at position - binary search could be used for large sets,
  // but linear scan is fine for typical insight counts
  const findInsightAtPosition = useCallback((lineNumber: number, column: number): SemanticInsight | undefined => {
    return filteredInsights.find(i =>
      lineNumber >= i.position.from.line &&
      lineNumber <= i.position.to.line &&
      (lineNumber > i.position.from.line || column >= i.position.from.col) &&
      (lineNumber < i.position.to.line || column <= i.position.to.col)
    );
  }, [filteredInsights]);

  // Handle editor mount
  const handleEditorDidMount = (ed: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = ed;
    monacoRef.current = monaco;

    // Define custom JetBrains Dark theme
    monaco.editor.defineTheme("jetbrains-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "CC7832" },
        { token: "type", foreground: "A9B7C6" },
        { token: "string", foreground: "6A8759" },
        { token: "number", foreground: "6897BB" },
        { token: "comment", foreground: "808080" },
      ],
      colors: {
        "editor.background": "#1E1F22",
        "editor.lineHighlightBackground": "#2B2D30",
        "editorLineNumber.foreground": "#4E5157",
        "editorGutter.background": "#1E1F22",
      }
    });

    monaco.editor.setTheme("jetbrains-dark");

    // Click handler - primary interaction for selection
    ed.onMouseDown((e) => {
      if (e.target.type === monaco.editor.MouseTargetType.CONTENT_TEXT) {
        const position = e.target.position;
        if (!position) return;

        const insight = findInsightAtPosition(position.lineNumber, position.column);
        if (insight) {
          setSelectedInsightId(insight.id);
        }
      }
    });

    // Hover handler - lightweight, local state only
    ed.onMouseMove((e) => {
      // Clear any pending hover
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }

      const position = e.target.position;

      // Clear hover if not over text or no position
      if (!position || e.target.type !== monaco.editor.MouseTargetType.CONTENT_TEXT) {
        setHoverInfo(null);
        return;
      }

      // Small delay to avoid excessive updates while moving
      hoverTimeoutRef.current = window.setTimeout(() => {
        const insight = findInsightAtPosition(position.lineNumber, position.column);

        if (insight) {
          const scrolledVisiblePosition = ed.getScrolledVisiblePosition(position);
          if (scrolledVisiblePosition) {
            const editorDomNode = ed.getDomNode();
            if (editorDomNode) {
              const rect = editorDomNode.getBoundingClientRect();
              setHoverInfo({
                insight,
                top: rect.top + scrolledVisiblePosition.top + 25,
                left: rect.left + scrolledVisiblePosition.left + 10
              });
            }
          }
        } else {
          setHoverInfo(null);
        }
      }, 50);
    });

    // Clear hover on mouse leave
    ed.onMouseLeave(() => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      setHoverInfo(null);
    });
  };

  // Update decorations when insights or selection change
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !snippet) return;

    const decorations: editor.IModelDeltaDecoration[] = filteredInsights.map(insight => {
      const isSelected = selectedInsightId === insight.id;

      let className = `insight-decoration insight-${insight.category.toLowerCase()}`;
      if (isSelected) className += " insight-selected";

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
          inlineClassName: isSelected ? "insight-text-selected" : undefined
        }
      };
    });

    if (decorationsCollectionRef.current) {
      decorationsCollectionRef.current.clear();
    }
    decorationsCollectionRef.current = editorRef.current.createDecorationsCollection(decorations);

  }, [filteredInsights, selectedInsightId, snippet]);

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="h-full w-full bg-[#1E1F22] relative">
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

      {/* Lightweight Hover Tooltip */}
      {hoverInfo && (
        <div
          className="fixed z-50 pointer-events-none bg-popover border border-border rounded-md shadow-lg px-2 py-1.5 max-w-xs"
          style={{
            top: hoverInfo.top,
            left: hoverInfo.left,
          }}
        >
          <div className="flex items-center gap-2 text-xs">
            <span className={`font-medium text-${getCategoryColor(hoverInfo.insight.category)}`}>
              {CATEGORY_LABELS[hoverInfo.insight.category]}
            </span>
            <span className="text-muted-foreground">{hoverInfo.insight.kind}</span>
          </div>
          <div className="font-mono text-sm text-foreground mt-0.5">
            {hoverInfo.insight.tokenText}
          </div>
        </div>
      )}
    </div>
  );
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    TYPE_INFERENCE: "cyan-400",
    NULLABILITY: "orange-400",
    SMART_CASTS: "green-400",
    SCOPING: "purple-400",
    EXTENSIONS: "blue-400",
    LAMBDAS: "yellow-400",
    OVERLOADS: "red-400",
  };
  return colors[category] || "gray-400";
}
