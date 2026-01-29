import type { Monaco } from "@monaco-editor/react";
import type { editor, languages, IRange } from "monaco-editor";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { getInsightAtPosition, getInsightLabel, getReasonText, shouldShowInlayHint } from "../lib/insightUtils";
import { SemanticInsight, SemanticProfile } from "../lib/types";
import { getCategorySlug, sortInsightsByPosition } from "../lib/utils";

interface InsightCodeBlockProps {
  snippet: SemanticProfile | null;
  className?: string;
  showInlayHints?: boolean;
  height?: number | string;
}

export default function InsightCodeBlock({
  snippet,
  className,
  showInlayHints = false,
  height = 220,
}: InsightCodeBlockProps) {
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
  const hoverProviderRef = useRef<{ dispose: () => void } | null>(null);
  const inlayHintsProviderRef = useRef<{ dispose: () => void } | null>(null);

  const filteredInsights = useMemo(() => {
    if (!snippet) return [];
    return sortInsightsByPosition(snippet.insights || []);
  }, [snippet]);

  const filteredInsightsRef = useRef(filteredInsights);
  useEffect(() => {
    filteredInsightsRef.current = filteredInsights;
  }, [filteredInsights]);

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

  const registerHoverProvider = useCallback((monaco: Monaco) => {
    if (hoverProviderRef.current) {
      hoverProviderRef.current.dispose();
    }

    const provider = monaco.languages.registerHoverProvider("kotlin", {
      provideHover: (_model: editor.ITextModel, position: { lineNumber: number; column: number }) => {
        const insight = getInsightAtPosition(
          filteredInsightsRef.current,
          position.lineNumber,
          position.column
        );
        if (!insight) return null;

        const label = getInsightLabel(insight);
        const reason = getReasonText(insight);
        const footer = `${insight.category} • ${insight.kind}`;
        return {
          contents: [
            { value: `**${label}**` },
            { value: reason },
            { value: `_${footer}_` },
          ],
        };
      },
    });

    hoverProviderRef.current = provider;
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
    registerHoverProvider(monaco);
    registerInlayHints(monaco);
  }, [defineTheme, registerHoverProvider, registerInlayHints]);

  useEffect(() => {
    if (monacoRef.current) {
      registerInlayHints(monacoRef.current);
    }
  }, [registerInlayHints]);

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !snippet) return;

    const monaco = monacoRef.current;
    const decorations: editor.IModelDeltaDecoration[] = [];

    filteredInsights.forEach((insight: SemanticInsight) => {
      const className = `insight-decoration insight-${getCategorySlug(insight.category)}`;
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
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      });
    });

    if (decorationsCollectionRef.current) {
      decorationsCollectionRef.current.clear();
    }
    decorationsCollectionRef.current = editorRef.current.createDecorationsCollection(decorations);
  }, [filteredInsights, snippet]);

  useEffect(() => {
    return () => {
      if (hoverProviderRef.current) {
        hoverProviderRef.current.dispose();
      }
      if (inlayHintsProviderRef.current) {
        inlayHintsProviderRef.current.dispose();
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
      className={`kb-codepane kb-codeblock ${className || ""}`.trim()}
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
              renderLineHighlight: "none",
              contextmenu: false,
              padding: { top: 16, bottom: 16 },
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              glyphMargin: false,
              folding: false,
              lineDecorationsWidth: 0,
              renderWhitespace: "none",
              scrollbar: {
                vertical: "auto",
                horizontal: "auto",
                useShadows: false,
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
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
    </div>
  );
}
