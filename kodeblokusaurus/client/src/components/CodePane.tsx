import { useAppState } from "@/contexts/AppStateContext";
import Editor, { Monaco } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { useCallback, useEffect, useRef, useState } from "react";
import { SemanticInsight } from "@/lib/types";
import InsightCard from "@/components/InsightCard";

export default function CodePane() {
  const {
    snippet,
    filteredInsights
  } = useAppState();

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const baseDecorationsRef = useRef<editor.IEditorDecorationsCollection | null>(null);
  const scopeDecorationsRef = useRef<editor.IEditorDecorationsCollection | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const filteredInsightsRef = useRef<SemanticInsight[]>([]);
  const activeDecorationElementRef = useRef<HTMLElement | null>(null);

  // Local hover state - lightweight, does not affect global state
  const [hoveredInsight, setHoveredInsight] = useState<SemanticInsight | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ top: number; left: number } | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    filteredInsightsRef.current = filteredInsights;
  }, [filteredInsights]);

  // Find insight at position - binary search could be used for large sets,
  // but linear scan is fine for typical insight counts
  const findInsightAtPosition = useCallback((lineNumber: number, column: number): SemanticInsight | undefined => {
    const candidates = filteredInsightsRef.current.filter(i =>
      lineNumber >= i.position.from.line &&
      lineNumber <= i.position.to.line &&
      (lineNumber > i.position.from.line || column >= i.position.from.col) &&
      (lineNumber < i.position.to.line || column <= i.position.to.col)
    );

    if (candidates.length === 0) return undefined;

    return candidates.reduce((best, current) => {
      const bestSpan = (best.position.to.line - best.position.from.line) * 1000 +
        (best.position.to.col - best.position.from.col);
      const currentSpan = (current.position.to.line - current.position.from.line) * 1000 +
        (current.position.to.col - current.position.from.col);
      return currentSpan < bestSpan ? current : best;
    });
  }, []);

  const clearHoverState = useCallback(() => {
    if (activeDecorationElementRef.current) {
      activeDecorationElementRef.current.classList.remove("insight-active");
      activeDecorationElementRef.current = null;
    }
    setHoveredInsight(null);
    setHoverPosition(null);
  }, []);

  const scheduleHoverClear = useCallback((delayMs = 200) => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = window.setTimeout(() => {
      clearHoverState();
    }, delayMs);
  }, [clearHoverState]);

  // Handle editor mount
  const handleEditorDidMount = (ed: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = ed;
    monacoRef.current = monaco;
    setEditorReady(true);

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

    // Hover handler - lightweight, local state only
    ed.onMouseMove((e) => {
      // Clear any pending hover
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }

      const position = e.target.position;

      // Clear hover if no position
      if (!position) {
        scheduleHoverClear();
        return;
      }

      const insight = findInsightAtPosition(position.lineNumber, position.column);

      if (!insight) {
        scheduleHoverClear();
        return;
      }

      setHoveredInsight(insight);

      const targetElement = e.target.element;
      if (targetElement instanceof HTMLElement) {
        const decorationElement = targetElement.closest(".insight-decoration");
        if (decorationElement instanceof HTMLElement) {
          if (activeDecorationElementRef.current && activeDecorationElementRef.current !== decorationElement) {
            activeDecorationElementRef.current.classList.remove("insight-active");
          }
          decorationElement.classList.add("insight-active");
          activeDecorationElementRef.current = decorationElement;
        }
      }

      const scrolledVisiblePosition = ed.getScrolledVisiblePosition(position);
      if (scrolledVisiblePosition) {
        const editorDomNode = ed.getDomNode();
        if (editorDomNode) {
          const rect = editorDomNode.getBoundingClientRect();
          setHoverPosition({
            top: rect.top + scrolledVisiblePosition.top + 18,
            left: rect.left + scrolledVisiblePosition.left + 16
          });
        }
      }
    });

    // Clear hover on mouse leave
    ed.onMouseLeave(() => {
      scheduleHoverClear();
    });
  };

  // Decorations for insights, including hover highlight
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !snippet) return;

    const decorations: editor.IModelDeltaDecoration[] = filteredInsights.map((insight) => ({
        range: new monacoRef.current!.Range(
          insight.position.from.line,
          insight.position.from.col,
          insight.position.to.line,
          insight.position.to.col
        ),
        options: {
          isWholeLine: false,
          inlineClassName: `insight-decoration insight-${insight.category.toLowerCase()}`
        }
      }));

    if (baseDecorationsRef.current) {
      baseDecorationsRef.current.clear();
    }
    baseDecorationsRef.current = editorRef.current.createDecorationsCollection(decorations);
  }, [editorReady, filteredInsights, snippet]);

  // Scope highlight decorations
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !snippet) return;

    if (scopeDecorationsRef.current) {
      scopeDecorationsRef.current.clear();
    }

    if (!hoveredInsight?.scopeChain || hoveredInsight.scopeChain.length === 0) return;

    const decorations: editor.IModelDeltaDecoration[] = hoveredInsight.scopeChain.map((scope) => ({
      range: new monacoRef.current!.Range(
        scope.position.from.line,
        scope.position.from.col,
        scope.position.to.line,
        scope.position.to.col
      ),
      options: {
        isWholeLine: true,
        className: `scope-decoration${scope.receiverType ? " scope-receiver" : ""}`
      }
    }));

    scopeDecorationsRef.current = editorRef.current.createDecorationsCollection(decorations);
  }, [editorReady, hoveredInsight, snippet]);

  // Clear hover when the snippet or filters change
  useEffect(() => {
    clearHoverState();
  }, [clearHoverState, filteredInsights, snippet]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="h-full w-full bg-[#1E1F22] relative" data-testid="code-pane">
      <div className="h-full w-full" data-testid="monaco-host">
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
      </div>

      {hoveredInsight && hoverPosition && (
        <div
          className="fixed z-50 pointer-events-auto"
          data-testid="hover-card"
          style={{
            top: Math.min(hoverPosition.top, window.innerHeight - 460),
            left: Math.min(hoverPosition.left, window.innerWidth - 520),
            maxWidth: "520px"
          }}
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) {
              window.clearTimeout(hoverTimeoutRef.current);
              hoverTimeoutRef.current = null;
            }
          }}
          onMouseLeave={() => scheduleHoverClear(250)}
        >
          <InsightCard insight={hoveredInsight} className="shadow-xl border-primary/20" />
        </div>
      )}
    </div>
  );
}
