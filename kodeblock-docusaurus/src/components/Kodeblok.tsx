import type { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { getInsightAtPosition } from "../lib/insightUtils";
import { SemanticInsight, SemanticProfile } from "../lib/types";
import { getCategorySlug, sortInsightsByPosition } from "../lib/utils";
import InsightDetail from "./InsightDetail";

interface KodeblokProps {
  snippet: SemanticProfile | null;
  className?: string;
  height?: number | string;
}

export default function Kodeblok({
  snippet,
  className,
  height = 420,
}: KodeblokProps) {
  const [MonacoEditor, setMonacoEditor] = useState<ComponentType<any> | null>(null);

  useEffect(() => {
    let mounted = true;
    if (typeof window !== "undefined") {
      import("@monaco-editor/react").then((mod) => {
        if (mounted) {
          setMonacoEditor(() => mod.default);
        }
      });
    }
    return () => {
      mounted = false;
    };
  }, []);

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<editor.IEditorDecorationsCollection | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);
  const activeDecorationElementRef = useRef<HTMLElement | null>(null);

  const [hoveredInsight, setHoveredInsight] = useState<SemanticInsight | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ top: number; left: number } | null>(null);

  const filteredInsights = useMemo(() => {
    if (!snippet) return [];
    return sortInsightsByPosition(snippet.insights || []);
  }, [snippet]);

  const filteredInsightsRef = useRef(filteredInsights);
  useEffect(() => {
    filteredInsightsRef.current = filteredInsights;
  }, [filteredInsights]);

  const clearActiveDecoration = useCallback(() => {
    if (activeDecorationElementRef.current) {
      activeDecorationElementRef.current.classList.remove("insight-active");
      activeDecorationElementRef.current = null;
    }
  }, []);

  const clearHoverState = useCallback(() => {
    clearActiveDecoration();
    setHoveredInsight(null);
    setHoverPosition(null);
  }, [clearActiveDecoration]);

  const scheduleHoverClear = useCallback((delayMs = 200) => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = window.setTimeout(() => {
      clearHoverState();
    }, delayMs);
  }, [clearHoverState]);

  const defineTheme = useCallback((monaco: Monaco) => {
    monaco.editor.defineTheme("kodeblok-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "CC7832", fontStyle: "bold" },
        { token: "type", foreground: "A9B7C6" },
        { token: "type.identifier", foreground: "A9B7C6" },
        { token: "string", foreground: "6A8759" },
        { token: "string.escape", foreground: "CC7832" },
        { token: "number", foreground: "6897BB" },
        { token: "comment", foreground: "808080", fontStyle: "italic" },
        { token: "annotation", foreground: "BBB529" },
        { token: "constant", foreground: "9876AA" },
        { token: "variable", foreground: "A9B7C6" },
        { token: "function", foreground: "FFC66D" },
        { token: "parameter", foreground: "A9B7C6" },
      ],
      colors: {
        "editor.background": "#1E1F22",
        "editor.foreground": "#A9B7C6",
        "editor.lineHighlightBackground": "#2B2D30",
        "editor.selectionBackground": "#214283",
        "editorLineNumber.foreground": "#4E5157",
        "editorLineNumber.activeForeground": "#A9B7C6",
        "editorGutter.background": "#1E1F22",
        "editorCursor.foreground": "#A9B7C6",
        "editor.inactiveSelectionBackground": "#214283AA",
        "editorBracketMatch.background": "#3B514D",
        "editorBracketMatch.border": "#3B514D",
        "editorIndentGuide.background": "#2B2D30",
        "editorIndentGuide.activeBackground": "#4E5157",
      },
    });
    monaco.editor.setTheme("kodeblok-dark");
  }, []);

  const handleEditorDidMount = useCallback((
    editorInstance: editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    editorRef.current = editorInstance;
    monacoRef.current = monaco;

    defineTheme(monaco);

    editorInstance.onMouseMove((event) => {
      const position = event.target.position;

      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }

      if (!position) {
        scheduleHoverClear();
        return;
      }

      const insight = getInsightAtPosition(
        filteredInsightsRef.current,
        position.lineNumber,
        position.column
      );

      if (!insight) {
        scheduleHoverClear();
        return;
      }

      setHoveredInsight(insight);

      const targetElement = event.target.element;
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

      const coords = editorInstance.getScrolledVisiblePosition(position);
      const editorDomNode = editorInstance.getDomNode();
      if (coords && editorDomNode) {
        const rect = editorDomNode.getBoundingClientRect();
        setHoverPosition({
          top: rect.top + coords.top + 18,
          left: rect.left + coords.left + 16,
        });
      }
    });

    editorInstance.onMouseLeave(() => {
      scheduleHoverClear();
    });
  }, [defineTheme, scheduleHoverClear]);

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !snippet) return;

    const monaco = monacoRef.current;
    const decorations: editor.IModelDeltaDecoration[] = filteredInsights.map((insight) => ({
      range: new monaco.Range(
        insight.position.from.line,
        insight.position.from.col,
        insight.position.to.line,
        insight.position.to.col
      ),
      options: {
        isWholeLine: false,
        inlineClassName: `insight-decoration insight-${getCategorySlug(insight.category)}`,
        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
      },
    }));

    if (decorationsRef.current) {
      decorationsRef.current.clear();
    }
    decorationsRef.current = editorRef.current.createDecorationsCollection(decorations);
  }, [filteredInsights, snippet]);

  useEffect(() => {
    clearHoverState();
  }, [clearHoverState, snippet]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const editorFallback = (
    <pre className="kb-fallback">
      {snippet?.code || "// Loading..."}
    </pre>
  );

  const resolvedHeight = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={`kb-codepane ${className || ""}`.trim()}
      style={{ height: resolvedHeight }}
    >
      <div className="kb-editor">
        {MonacoEditor ? (
          <MonacoEditor
            height="100%"
            defaultLanguage="kotlin"
            value={snippet?.code || "// Loading..."}
            onMount={handleEditorDidMount}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
              fontLigatures: true,
              lineNumbers: "on",
              renderLineHighlight: "all",
              contextmenu: false,
              padding: { top: 16, bottom: 16 },
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              glyphMargin: false,
              folding: false,
              lineDecorationsWidth: 0,
              renderWhitespace: "none",
              scrollbar: {
                vertical: "visible",
                horizontal: "visible",
                useShadows: false,
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10,
              },
            }}
          />
        ) : (
          editorFallback
        )}
      </div>

      {hoveredInsight && hoverPosition && (
        <div
          className="kb-hover-card"
          style={{
            top: Math.min(hoverPosition.top, window.innerHeight - 420),
            left: Math.min(hoverPosition.left, window.innerWidth - 420),
          }}
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) {
              window.clearTimeout(hoverTimeoutRef.current);
              hoverTimeoutRef.current = null;
            }
          }}
          onMouseLeave={() => scheduleHoverClear(250)}
        >
          <InsightDetail
            insight={hoveredInsight}
            variant="card"
            className="kb-hover-card-inner"
          />
        </div>
      )}
    </div>
  );
}
