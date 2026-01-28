import { ArrowRight, Code, FileCode, GitBranch, Info, Layers, Terminal } from "lucide-react";
import { InsightData, ScopeRef, SemanticInsight } from "../lib/types";
import { getReasonText } from "../lib/insightUtils";
import { CATEGORY_LABELS, getCategoryStyle } from "../lib/utils";

export type InsightDetailVariant = "card" | "panel";

interface InsightDetailProps {
  insight: SemanticInsight;
  variant?: InsightDetailVariant;
  className?: string;
  onPin?: () => void;
}

export default function InsightDetail({
  insight,
  variant = "card",
  className = "",
  onPin,
}: InsightDetailProps) {
  const colors = getCategoryStyle(insight.category);

  const renderScopeChain = () => {
    if (!insight.scopeChain || insight.scopeChain.length === 0) {
      return <span className="kb-muted">Global Scope</span>;
    }

    return (
      <div className="kb-scope-chain">
        {insight.scopeChain.map((scope: ScopeRef, index: number) => (
          <div key={index} className="kb-scope-chain-row">
            {index === 0 ? (
              <FileCode className="kb-icon" />
            ) : (
              <div className="kb-scope-chain-branch">
                <div className="kb-scope-chain-line" />
                <GitBranch className="kb-icon" />
              </div>
            )}
            <span className="kb-pill">{scope.kind}</span>
            {scope.receiverType && (
              <span className="kb-muted">({scope.receiverType})</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderDataFields = (data: InsightData) => {
    switch (data.type) {
      case "TypeInference":
        return (
          <>
            <tr>
              <td className="kb-table-label">Inferred Type</td>
              <td className="kb-table-value kb-accent" style={{ color: colors.accent }}>{data.inferredType}</td>
            </tr>
            {data.declaredType && (
              <tr>
                <td className="kb-table-label">Declared Type</td>
                <td className="kb-table-value">{data.declaredType}</td>
              </tr>
            )}
            {data.typeArguments && data.typeArguments.length > 0 && (
              <tr>
                <td className="kb-table-label">Type Arguments</td>
                <td className="kb-table-value">
                  <div className="kb-inline-list">
                    {data.typeArguments.map((arg) => (
                      <span key={arg} className="kb-badge kb-badge--outline">{arg}</span>
                    ))}
                  </div>
                </td>
              </tr>
            )}
          </>
        );

      case "SmartCast":
        return (
          <>
            <tr>
              <td className="kb-table-label">Cast Flow</td>
              <td className="kb-table-value">
                <span className="kb-strike">{data.originalType}</span>
                <ArrowRight className="kb-icon-inline" />
                <span className="kb-accent" style={{ color: colors.accent }}>{data.narrowedType}</span>
              </td>
            </tr>
            <tr>
              <td className="kb-table-label">Evidence</td>
              <td className="kb-table-value">{data.evidenceKind}</td>
            </tr>
          </>
        );

      case "Scoping":
        return (
          <>
            <tr>
              <td className="kb-table-label">Scope Function</td>
              <td className="kb-table-value kb-accent" style={{ color: colors.accent }}>{data.scopeFunction}</td>
            </tr>
            <tr>
              <td className="kb-table-label">Context Change</td>
              <td className="kb-table-value">
                <div className="kb-stack">
                  <div className="kb-inline">
                    <span className="kb-muted">Outer:</span>
                    <span>{data.outerReceiver || "-"}</span>
                  </div>
                  <div className="kb-inline">
                    <span className="kb-muted">Inner:</span>
                    <span>{data.innerReceiver || "-"}</span>
                  </div>
                </div>
              </td>
            </tr>
            {data.itParameterType && (
              <tr>
                <td className="kb-table-label">'it' Type</td>
                <td className="kb-table-value">{data.itParameterType}</td>
              </tr>
            )}
          </>
        );

      case "Extension":
        return (
          <>
            <tr>
              <td className="kb-table-label">Function</td>
              <td className="kb-table-value kb-accent" style={{ color: colors.accent }}>{data.functionOrProperty}</td>
            </tr>
            <tr>
              <td className="kb-table-label">Receiver</td>
              <td className="kb-table-value">{data.extensionReceiverType}</td>
            </tr>
            <tr>
              <td className="kb-table-label">Source</td>
              <td className="kb-table-value kb-muted">{data.resolvedFrom}</td>
            </tr>
            {data.competingMember && (
              <tr>
                <td className="kb-table-label">Shadowing</td>
                <td className="kb-table-value">Shadows member function</td>
              </tr>
            )}
          </>
        );

      case "Lambda":
        return (
          <>
            <tr>
              <td className="kb-table-label">Return Type</td>
              <td className="kb-table-value">{data.returnType}</td>
            </tr>
            <tr>
              <td className="kb-table-label">Parameters</td>
              <td className="kb-table-value">
                <div className="kb-stack">
                  {data.parameterTypes.map((p, i) => (
                    <div key={i} className="kb-inline">
                      <span className="kb-accent" style={{ color: colors.accent }}>{p.name || "it"}</span>
                      <span className="kb-muted">:</span>
                      <span>{p.type}</span>
                    </div>
                  ))}
                </div>
              </td>
            </tr>
            {data.inferredFromContext && (
              <tr>
                <td className="kb-table-label">Context</td>
                <td className="kb-table-value kb-muted">{data.inferredFromContext}</td>
              </tr>
            )}
            {data.samInterface && (
              <tr>
                <td className="kb-table-label">SAM Interface</td>
                <td className="kb-table-value">{data.samInterface}</td>
              </tr>
            )}
          </>
        );

      case "Nullability":
        return (
          <>
            <tr>
              <td className="kb-table-label">Type</td>
              <td className="kb-table-value">
                {data.nullableType}
                {data.isNullable && (
                  <span className="kb-badge kb-badge--destructive">Nullable</span>
                )}
              </td>
            </tr>
            <tr>
              <td className="kb-table-label">Platform Type</td>
              <td className="kb-table-value">{data.isPlatformType ? "Yes (Java Interop)" : "No"}</td>
            </tr>
            {data.narrowedToNonNull && (
              <tr>
                <td className="kb-table-label">Status</td>
                <td className="kb-table-value kb-accent" style={{ color: colors.accent }}>Narrowed to Non-Null</td>
              </tr>
            )}
          </>
        );

      case "Overload":
        return (
          <>
            <tr>
              <td className="kb-table-label">Selected</td>
              <td className="kb-table-value">{data.selectedSignature}</td>
            </tr>
            <tr>
              <td className="kb-table-label">Candidates</td>
              <td className="kb-table-value">
                <span className="kb-badge kb-badge--outline">{data.candidateCount} candidates</span>
              </td>
            </tr>
            {data.resolutionFactors && data.resolutionFactors.length > 0 && (
              <tr>
                <td className="kb-table-label">Resolution</td>
                <td className="kb-table-value">
                  <ul className="kb-list">
                    {data.resolutionFactors.map((factor, i) => (
                      <li key={i}>{factor}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            )}
            {data.defaultArgumentsUsed && data.defaultArgumentsUsed.length > 0 && (
              <tr>
                <td className="kb-table-label">Default Args</td>
                <td className="kb-table-value">
                  <div className="kb-inline-list">
                    {data.defaultArgumentsUsed.map((arg) => (
                      <span key={arg} className="kb-badge kb-badge--secondary">{arg}</span>
                    ))}
                  </div>
                </td>
              </tr>
            )}
          </>
        );

      default:
        return null;
    }
  };

  if (variant === "card") {
    return (
      <div
        className={`kb-card ${className}`}
        onClick={(event) => {
          event.stopPropagation();
          onPin?.();
        }}
      >
        <div className="kb-card-accent" style={{ backgroundColor: colors.accent }} />
        <div className="kb-card-body">
          <div className="kb-card-header">
            <div>
              <div className="kb-inline">
                <span
                  className="kb-badge kb-badge--outline"
                  style={{ color: colors.accent, borderColor: colors.border }}
                >
                  {CATEGORY_LABELS[insight.category]}
                </span>
                <span className="kb-muted">{insight.kind}</span>
              </div>
              <h3 className="kb-card-title">{insight.tokenText}</h3>
            </div>
          </div>

          <div className="kb-table-wrap">
            <table className="kb-table">
              <tbody>{renderDataFields(insight.data)}</tbody>
            </table>
          </div>

          <div className="kb-info-box">
            <Info className="kb-icon-inline" />
            <p>{getReasonText(insight)}</p>
          </div>

          <div className="kb-card-hint">Click to pin in inspector</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`kb-panel ${className}`}>
      <div className="kb-panel-header-block">
        <div className="kb-inline">
          <span
            className="kb-badge"
            style={{ color: colors.accent, borderColor: colors.border, background: colors.background }}
          >
            {CATEGORY_LABELS[insight.category]}
          </span>
          <span className={`kb-badge kb-badge--secondary`}>{insight.level}</span>
        </div>
        <div className="kb-inline kb-top-row">
          <Code className="kb-icon-inline" />
          <code className="kb-inline-code">{insight.tokenText}</code>
        </div>
        <div className="kb-muted">Ln {insight.position.from.line}, Col {insight.position.from.col}</div>
      </div>

      <section className="kb-section">
        <div className="kb-section-title">
          <Info className="kb-icon-inline" />
          <h3>Analysis</h3>
        </div>
        <div className="kb-info-panel">{getReasonText(insight)}</div>
      </section>

      <section className="kb-section">
        <div className="kb-section-title">
          <Terminal className="kb-icon-inline" />
          <h3>Details</h3>
        </div>
        <div className="kb-table-wrap">
          <table className="kb-table">
            <tbody>{renderDataFields(insight.data)}</tbody>
          </table>
        </div>
      </section>

      <section className="kb-section">
        <div className="kb-section-title">
          <Layers className="kb-icon-inline" />
          <h3>Scope Context</h3>
        </div>
        <div className="kb-scope-panel">{renderScopeChain()}</div>
      </section>
    </div>
  );
}
