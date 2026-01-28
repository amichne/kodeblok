import { Layers, Pin } from "lucide-react";
import type { Monaco } from "@monaco-editor/react";
import type { editor, languages, IRange } from "monaco-editor";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { getInsightAtPosition, shouldShowInlayHint } from "../lib/insightUtils";
import { SemanticInsight, SemanticProfile } from "../lib/types";
import { getCategorySlug, sortInsightsByPosition } from "../lib/utils";
import InsightDetail from "./InsightDetail";
import InsightInspector from "./InsightInspector";
import ScopeTree from "./ScopeTree";

interface CodePaneProps {
  snippet: SemanticProfile | null;
  className?: string;
  showInlayHints?: boolean;
  defaultPanel?: "insights" | "scope" | null;
  initialPinnedInsightId?: string | null;
  onPinnedInsightChange?: (id: string | null) => void;
}

type PanelMode = "insights" | "scope";

export default function CodePane({
  snippet,
  className,
  showInlayHints = true,
  defaultPanel = null,
  initialPinnedInsightId = null,
  onPinnedInsightChange,
}: CodePaneProps) {
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
  const decorationsCollectionRef = useRef<editor.IEditorDecorationsCollection | null>(null);
  const inlayHintsProviderRef = useRef<{ dispose: () => void } | null>(null);

  const [activeInsightId, setActiveInsightId] = useState<string | null>(null);
  const [pinnedInsightId, setPinnedInsightId] = useState<string | null>(initialPinnedInsightId);

  const [panelOpen, setPanelOpen] = useState(Boolean(defaultPanel || initialPinnedInsightId));
  const [panelMode, setPanelMode] = useState<PanelMode>(defaultPanel || "insights");

  const filteredInsights = useMemo(() => {
    if (!snippet) return [];
    return sortInsightsByPosition(snippet.insights || []);
  }, [snippet]);

  const insightsByLine = useMemo(() => {
    const map = new Map<number, SemanticInsight[]>();
    for (const insight of filteredInsights) {
      const line = insight.position.from.line;
      const existing = map.get(line) || [];
      existing.push(insight);
      map.set(line, existing);
    }
    return map;
  }, [filteredInsights]);

  const filteredInsightsRef = useRef(filteredInsights);
  const insightsByLineRef = useRef(insightsByLine);

  useEffect(() => {
    filteredInsightsRef.current = filteredInsights;
  }, [filteredInsights]);

  useEffect(() => {
    insightsByLineRef.current = insightsByLine;
  }, [insightsByLine]);

  useEffect(() => {
    if (!pinnedInsightId) return;
    const exists = filteredInsights.some((insight) => insight.id === pinnedInsightId);
    if (!exists) {
      setPinnedInsightId(null);
      onPinnedInsightChange?.(null);
    }
  }, [filteredInsights, pinnedInsightId, onPinnedInsightChange]);

  const pinnedInsight = useMemo(() => {
    if (!pinnedInsightId) return undefined;
    return filteredInsights.find((insight) => insight.id === pinnedInsightId);
  }, [filteredInsights, pinnedInsightId]);

  const [hoverPosition, setHoverPosition] = useState<{ top: number; left: number } | null>(null);
  const [hoveredInsight, setHoveredInsight] = useState<SemanticInsight | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);
  const currentHoveredIdRef = useRef<string | null>(null);

  const clearHoverState = useCallback(() => {
    currentHoveredIdRef.current = null;
    setActiveInsightId(null);
    setHoveredInsight(null);
    setHoverPosition(null);
  }, []);

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
        "editorGhostText.foreground": "#6E7681",
        "editorInlayHint.background": "#00000000",
        "editorInlayHint.foreground": "#6E7681",
        "editorInlayHint.typeForeground": "#6897BB",
        "editorInlayHint.typeBackground": "#00000000",
      },
    });
    monaco.editor.setTheme("kodeblok-dark");
  }, []);

  const registerInlayHints = useCallback((monaco: Monaco) => {
    if (inlayHintsProviderRef.current) {
      inlayHintsProviderRef.current.dispose();
    }

    if (!showInlayHints) return;

    const provider = monaco.languages.registerInlayHintsProvider("kotlin", {
      provideInlayHints: (_model: editor.ITextModel, _range: IRange) => {
        const hints: languages.InlayHint[] = filteredInsightsRef.current
          .filter(shouldShowInlayHint)
          .map((insight) => {
            const data = insight.data;
            if (data.type !== "TypeInference") return null;

            return {
              position: {
                lineNumber: insight.position.to.line,
                column: insight.position.to.col + 1,
              },
              label: `: ${data.inferredType}`,
              kind: monaco.languages.InlayHintKind.Type,
              paddingLeft: true,
              paddingRight: false,
            } as languages.InlayHint;
          })
          .filter((hint): hint is languages.InlayHint => hint !== null);

        return { hints, dispose: () => {} };
      },
    });

    inlayHintsProviderRef.current = provider;
  }, [showInlayHints]);

  const handleEditorDidMount = useCallback((
    editorInstance: editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    editorRef.current = editorInstance;
    monacoRef.current = monaco;

    defineTheme(monaco);
    registerInlayHints(monaco);

    editorInstance.onMouseMove((event) => {
      const position = event.target.position;

      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }

      let insight: SemanticInsight | undefined;
      if (position) {
        insight = getInsightAtPosition(
          filteredInsightsRef.current,
          position.lineNumber,
          position.column
        );
      }

      if (insight) {
        currentHoveredIdRef.current = insight.id;
        setActiveInsightId(insight.id);
        setHoveredInsight(insight);

        const endPos = {
          lineNumber: insight.position.to.line,
          column: insight.position.to.col + 1,
        };
        const endCoords = editorInstance.getScrolledVisiblePosition(endPos);
        const editorDomNode = editorInstance.getDomNode();

        if (endCoords && editorDomNode) {
          const rect = editorDomNode.getBoundingClientRect();
          setHoverPosition({
            top: rect.top + endCoords.top,
            left: rect.left + endCoords.left + 20,
          });
        }
      } else if (currentHoveredIdRef.current) {
        hoverTimeoutRef.current = window.setTimeout(() => {
          currentHoveredIdRef.current = null;
          setActiveInsightId(null);
          setHoveredInsight(null);
          setHoverPosition(null);
        }, 500);
      }
    });

    editorInstance.onMouseDown((event) => {
      if (event.target.type === monaco.editor.MouseTargetType.CONTENT_TEXT) {
        const position = event.target.position;
        if (!position) return;

        const insight = getInsightAtPosition(
          filteredInsightsRef.current,
          position.lineNumber,
          position.column
        );

        if (insight) {
          setPinnedInsightId(insight.id);
          onPinnedInsightChange?.(insight.id);
          setPanelMode("insights");
          setPanelOpen(true);
        }
      } else if (event.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
        const lineNumber = event.target.position?.lineNumber;
        if (lineNumber) {
          const lineInsights = insightsByLineRef.current.get(lineNumber);
          if (lineInsights && lineInsights.length > 0) {
            setPinnedInsightId(lineInsights[0].id);
            onPinnedInsightChange?.(lineInsights[0].id);
            setPanelMode("insights");
            setPanelOpen(true);
          }
        }
      }
    });

    editorInstance.onMouseLeave(() => {
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current);
      }
      hoverTimeoutRef.current = window.setTimeout(() => {
        currentHoveredIdRef.current = null;
        setActiveInsightId(null);
        setHoveredInsight(null);
        setHoverPosition(null);
      }, 500);
    });
  }, [defineTheme, registerInlayHints, onPinnedInsightChange]);

  useEffect(() => {
    if (monacoRef.current) {
      registerInlayHints(monacoRef.current);
    }
  }, [registerInlayHints]);

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !snippet) return;

    const monaco = monacoRef.current;
    const decorations: editor.IModelDeltaDecoration[] = [];

    filteredInsights.forEach((insight) => {
      const isSelected = pinnedInsightId === insight.id;
      const isActive = activeInsightId === insight.id;

      let className = `insight-decoration insight-${getCategorySlug(insight.category)}`;
      if (isSelected) className += " insight-selected";
      if (isActive && !isSelected) className += " insight-active";

      decorations.push({
        range: new monaco.Range(
          insight.position.from.line,
          insight.position.from.col,
          insight.position.to.line,
          insight.position.to.col
        ),
        options: {
          isWholeLine: false,
          className,
          inlineClassName: isSelected ? "insight-text-selected" : undefined,
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      });
    });

    insightsByLine.forEach((insights, line) => {
      const primaryInsight = insights.find((i) => i.level === "HIGHLIGHTS") || insights[0];
      const dotClass = `gutter-dot-${getCategorySlug(primaryInsight.category)}`;

      decorations.push({
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          glyphMarginClassName: `gutter-badge ${dotClass}`,
          glyphMarginHoverMessage: {
            value: `**${insights.length} insight${insights.length > 1 ? "s" : ""}** on this line\n\nClick to select`,
          },
        },
      });
    });

    if (decorationsCollectionRef.current) {
      decorationsCollectionRef.current.clear();
    }
    decorationsCollectionRef.current = editorRef.current.createDecorationsCollection(decorations);
  }, [filteredInsights, insightsByLine, activeInsightId, pinnedInsightId, snippet]);

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !pinnedInsightId) return;

    const insight = filteredInsights.find((i) => i.id === pinnedInsightId);
    if (insight) {
      editorRef.current.revealRangeInCenter(
        new monacoRef.current.Range(
          insight.position.from.line,
          insight.position.from.col,
          insight.position.to.line,
          insight.position.to.col
        ),
        monacoRef.current.editor.ScrollType.Smooth
      );
    }
  }, [pinnedInsightId, filteredInsights]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current);
      }
      if (inlayHintsProviderRef.current) {
        inlayHintsProviderRef.current.dispose();
      }
    };
  }, []);

  const handleHoverCardMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  const handleHoverCardMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = window.setTimeout(() => {
      clearHoverState();
    }, 300);
  }, [clearHoverState]);

  const handleHoverCardClick = useCallback(() => {
    if (hoveredInsight) {
      setPinnedInsightId(hoveredInsight.id);
      onPinnedInsightChange?.(hoveredInsight.id);
      setHoveredInsight(null);
      setHoverPosition(null);
      setPanelMode("insights");
      setPanelOpen(true);
    }
  }, [hoveredInsight, onPinnedInsightChange]);

  const togglePanel = (mode: PanelMode) => {
    if (panelOpen && panelMode === mode) {
      setPanelOpen(false);
    } else {
      setPanelMode(mode);
      setPanelOpen(true);
    }
  };

  const handleScopeSelect = (insightId: string) => {
    setPinnedInsightId(insightId);
    onPinnedInsightChange?.(insightId);
    setPanelMode("insights");
    setPanelOpen(true);
  };

  const editorFallback = (
    <pre className="kb-fallback">
      {snippet?.code || "// Loading..."}
    </pre>
  );

  return (
    <div className={`kb-codepane ${panelOpen ? "kb-panel-open" : ""} ${className || ""}`.trim()}>
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
              glyphMargin: true,
              folding: true,
              lineDecorationsWidth: 8,
              renderWhitespace: "none",
              scrollbar: {
                vertical: "visible",
                horizontal: "visible",
                useShadows: false,
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10,
              },
              inlayHints: {
                enabled: showInlayHints ? "on" : "off",
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
              },
            }}
          />
        ) : (
          editorFallback
        )}
      </div>

      <div className="kb-toolbar">
        <button
          type="button"
          className={`kb-toolbar-button ${panelOpen && panelMode === "insights" ? "kb-toolbar-button--active" : ""}`}
          onClick={() => togglePanel("insights")}
          aria-label="Toggle insights panel"
        >
          <Pin className="kb-icon-inline" />
        </button>
        <button
          type="button"
          className={`kb-toolbar-button ${panelOpen && panelMode === "scope" ? "kb-toolbar-button--active" : ""}`}
          onClick={() => togglePanel("scope")}
          aria-label="Toggle scope panel"
        >
          <Layers className="kb-icon-inline" />
        </button>
      </div>

      <div className={`kb-sidepanel ${panelOpen ? "kb-sidepanel--open" : ""}`}>
        <div className="kb-panel-tabs">
          <button
            type="button"
            className={`kb-tab ${panelMode === "insights" ? "kb-tab--active" : ""}`}
            onClick={() => setPanelMode("insights")}
          >
            Insights
          </button>
          <button
            type="button"
            className={`kb-tab ${panelMode === "scope" ? "kb-tab--active" : ""}`}
            onClick={() => setPanelMode("scope")}
          >
            Scope
          </button>
          <button
            type="button"
            className="kb-panel-close"
            onClick={() => setPanelOpen(false)}
            aria-label="Close panel"
          >
            x
          </button>
        </div>
        <div className="kb-panel-body">
          {panelMode === "insights" ? (
            <InsightInspector pinnedInsight={pinnedInsight} availableCount={filteredInsights.length} />
          ) : (
            <ScopeTree rootScopes={snippet?.rootScopes} onSelectInsight={handleScopeSelect} />
          )}
        </div>
      </div>

      {hoveredInsight && hoverPosition && (
        <div
          className="kb-hover-card"
          style={{
            top: Math.min(hoverPosition.top, window.innerHeight - 400),
            left: Math.min(hoverPosition.left, window.innerWidth - 420),
          }}
          onMouseEnter={handleHoverCardMouseEnter}
          onMouseLeave={handleHoverCardMouseLeave}
        >
          <InsightDetail
            insight={hoveredInsight}
            variant="card"
            className="kb-hover-card-inner"
            onPin={handleHoverCardClick}
          />
        </div>
      )}
    </div>
  );
}
