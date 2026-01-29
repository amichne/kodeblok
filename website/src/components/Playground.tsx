import React, { useState, useRef, useEffect, useCallback } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import type { SemanticProfile, SemanticInsight, InsightCategory } from '@shared/types';
import { CATEGORY_HEX_COLORS as CATEGORY_COLORS, CATEGORY_LABELS, getInsightSummary } from '@shared/constants';
import { SAMPLE_SNIPPET } from '@shared/sampleData';

function getCategoryClass(category: InsightCategory): string {
  return category.toLowerCase().replace('_', '-');
}

export default function Playground(): JSX.Element {
  const [snippet, setSnippet] = useState<SemanticProfile>(SAMPLE_SNIPPET);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<editor.IEditorDecorationsCollection | null>(null);

  const selectedInsight = snippet.insights.find((i) => i.id === selectedId);

  const findInsightAtPosition = useCallback(
    (lineNumber: number, column: number): SemanticInsight | undefined => {
      return snippet.insights.find(
        (i) =>
          lineNumber >= i.position.from.line &&
          lineNumber <= i.position.to.line &&
          (lineNumber > i.position.from.line || column >= i.position.from.col) &&
          (lineNumber < i.position.to.line || column <= i.position.to.col)
      );
    },
    [snippet.insights]
  );

  const handleEditorDidMount = (ed: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = ed;
    monacoRef.current = monaco;

    monaco.editor.defineTheme('kodeblok-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'CC7832' },
        { token: 'type', foreground: 'A9B7C6' },
        { token: 'string', foreground: '6A8759' },
        { token: 'number', foreground: '6897BB' },
        { token: 'comment', foreground: '808080' },
      ],
      colors: {
        'editor.background': '#1E1F22',
        'editor.lineHighlightBackground': '#2B2D30',
        'editorLineNumber.foreground': '#4E5157',
        'editorGutter.background': '#1E1F22',
      },
    });
    monaco.editor.setTheme('kodeblok-dark');

    ed.onMouseDown((e) => {
      if (e.target.type === monaco.editor.MouseTargetType.CONTENT_TEXT) {
        const position = e.target.position;
        if (!position) return;
        const insight = findInsightAtPosition(position.lineNumber, position.column);
        if (insight) {
          setSelectedId(insight.id);
        }
      }
    });
  };

  // Update decorations when insights or selection changes
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const decorations: editor.IModelDeltaDecoration[] = snippet.insights.map((insight) => {
      const isSelected = selectedId === insight.id;
      let className = `insight-decoration insight-${insight.category.toLowerCase()}`;
      if (isSelected) className += ' insight-selected';

      return {
        range: new monacoRef.current!.Range(
          insight.position.from.line,
          insight.position.from.col,
          insight.position.to.line,
          insight.position.to.col
        ),
        options: {
          isWholeLine: false,
          className,
        },
      };
    });

    if (decorationsRef.current) {
      decorationsRef.current.clear();
    }
    decorationsRef.current = editorRef.current.createDecorationsCollection(decorations);
  }, [snippet.insights, selectedId]);

  // Scroll to selected insight in editor
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !selectedId) return;

    const insight = snippet.insights.find((i) => i.id === selectedId);
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
  }, [selectedId, snippet.insights]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const json = JSON.parse(content);

        if (!json.snippetId || !json.code || !Array.isArray(json.insights)) {
          throw new Error('Invalid SemanticProfile format');
        }

        setSnippet(json);
        setSelectedId(null);
      } catch (err) {
        console.error('Failed to parse JSON', err);
        alert('Failed to load snippet: Invalid JSON format');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleLoadSample = () => {
    setSnippet(SAMPLE_SNIPPET);
    setSelectedId(null);
  };

  const renderDetails = () => {
    if (!selectedInsight) {
      return (
        <div style={{ padding: '1rem', color: 'var(--ifm-color-secondary)' }}>
          Click on an insight in the code or list to view details
        </div>
      );
    }

    const { data } = selectedInsight;

    return (
      <div className="details-content">
        <div className="detail-field">
          <span className="detail-label">Token</span>
          <code className="detail-value">{selectedInsight.tokenText}</code>
        </div>
        <div className="detail-field">
          <span className="detail-label">Category</span>
          <span className="detail-value" style={{ color: CATEGORY_COLORS[selectedInsight.category] }}>
            {CATEGORY_LABELS[selectedInsight.category]}
          </span>
        </div>
        <div className="detail-field">
          <span className="detail-label">Kind</span>
          <span className="detail-value">{selectedInsight.kind}</span>
        </div>
        <div className="detail-field">
          <span className="detail-label">Position</span>
          <span className="detail-value">
            Ln {selectedInsight.position.from.line}, Col {selectedInsight.position.from.col}
          </span>
        </div>

        {data.type === 'TypeInference' && (
          <div className="detail-field">
            <span className="detail-label">Inferred Type</span>
            <code className="detail-value" style={{ color: '#60a5fa' }}>
              {data.inferredType}
            </code>
          </div>
        )}

        {data.type === 'Nullability' && (
          <>
            <div className="detail-field">
              <span className="detail-label">Type</span>
              <code className="detail-value">{data.nullableType}</code>
            </div>
            <div className="detail-field">
              <span className="detail-label">Nullable</span>
              <span className="detail-value">{data.isNullable ? 'Yes' : 'No'}</span>
            </div>
          </>
        )}

        {data.type === 'Scoping' && (
          <>
            <div className="detail-field">
              <span className="detail-label">Scope Function</span>
              <code className="detail-value" style={{ color: '#c084fc' }}>
                {data.scopeFunction}
              </code>
            </div>
            {data.innerReceiver && (
              <div className="detail-field">
                <span className="detail-label">Inner Receiver</span>
                <code className="detail-value">{data.innerReceiver}</code>
              </div>
            )}
          </>
        )}

        {data.type === 'Lambda' && (
          <>
            <div className="detail-field">
              <span className="detail-label">Return Type</span>
              <code className="detail-value">{data.returnType}</code>
            </div>
            {data.parameterTypes.length > 0 && (
              <div className="detail-field">
                <span className="detail-label">Parameters</span>
                <code className="detail-value">
                  {data.parameterTypes.map((p) => `${p.name}: ${p.type}`).join(', ')}
                </code>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="playground-container">
      <div className="playground-header">
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".json"
          onChange={handleFileUpload}
        />
        <button className="upload-button" onClick={() => fileInputRef.current?.click()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17,8 12,3 7,8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload JSON
        </button>
        <button
          className="upload-button"
          style={{ background: 'var(--ifm-color-secondary-dark)' }}
          onClick={handleLoadSample}
        >
          Load Sample
        </button>
        <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--ifm-color-secondary)' }}>
          {snippet.insights.length} insight{snippet.insights.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="playground-main">
        <div className="playground-editor">
          <Editor
            height="100%"
            defaultLanguage="kotlin"
            value={snippet.code}
            onMount={handleEditorDidMount}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              lineNumbers: 'on',
              renderLineHighlight: 'all',
              contextmenu: false,
              padding: { top: 16, bottom: 16 },
            }}
          />
        </div>

        <div className="playground-insights">
          <div
            style={{
              padding: '0.5rem 1rem',
              borderBottom: '1px solid var(--ifm-toc-border-color)',
              fontWeight: 500,
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--ifm-color-secondary)',
            }}
          >
            Insights
          </div>
          <ul className="insight-list">
            {snippet.insights.map((insight) => (
              <li
                key={insight.id}
                className={`insight-item ${selectedId === insight.id ? 'selected' : ''}`}
                onClick={() => setSelectedId(insight.id)}
              >
                <span className={`insight-dot ${getCategoryClass(insight.category)}`} />
                <span className="insight-token">{insight.tokenText}</span>
                <span className="insight-summary">{getInsightSummary(insight.data)}</span>
                <span className="insight-meta" style={{ marginLeft: 'auto' }}>
                  Ln {insight.position.from.line}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="playground-details">
          <div className="details-header" onClick={() => setDetailsExpanded(!detailsExpanded)}>
            <span style={{ fontWeight: 500 }}>
              Details
              {selectedInsight && (
                <span
                  style={{
                    marginLeft: '0.5rem',
                    color: CATEGORY_COLORS[selectedInsight.category],
                    fontSize: '0.85rem',
                  }}
                >
                  {CATEGORY_LABELS[selectedInsight.category]}
                </span>
              )}
            </span>
            <span>{detailsExpanded ? '▼' : '▲'}</span>
          </div>
          {detailsExpanded && renderDetails()}
        </div>
      </div>
    </div>
  );
}
