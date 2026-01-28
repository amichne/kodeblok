import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppState } from "@/contexts/AppStateContext";
import { InsightData, ScopeRef } from "@/lib/types";
import { CATEGORY_LABELS, getInsightColor } from "@/lib/utils";
import { ChevronDown, ChevronUp, ArrowRight, Code, GitBranch } from "lucide-react";

export default function InsightDetails() {
  const {
    filteredInsights,
    selectedInsightId,
    detailsExpanded,
    setDetailsExpanded
  } = useAppState();

  const insight = filteredInsights.find(i => i.id === selectedInsightId);

  // Header with toggle - always visible
  const header = (
    <div
      className="flex items-center justify-between px-4 py-2 bg-secondary border-t border-border cursor-pointer select-none"
      onClick={() => setDetailsExpanded(!detailsExpanded)}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <span>Details</span>
        {insight && (
          <Badge variant="outline" className={`${getInsightColor(insight.category)} text-xs`}>
            {CATEGORY_LABELS[insight.category]}
          </Badge>
        )}
        {!insight && <span className="text-muted-foreground text-xs">(no selection)</span>}
      </div>
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
        {detailsExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </Button>
    </div>
  );

  if (!detailsExpanded) {
    return header;
  }

  if (!insight) {
    return (
      <>
        {header}
        <div className="px-4 py-6 text-center text-muted-foreground text-sm border-t border-border bg-background">
          Click on an insight in the code or list to view details
        </div>
      </>
    );
  }

  const renderScopeChain = () => {
    if (!insight.scopeChain || insight.scopeChain.length === 0) {
      return <span className="text-muted-foreground text-xs italic">Global Scope</span>;
    }

    return (
      <div className="flex items-center gap-1 flex-wrap">
        {insight.scopeChain.map((scope: ScopeRef, index: number) => (
          <span key={index} className="flex items-center gap-1">
            {index > 0 && <span className="text-muted-foreground">/</span>}
            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
              {scope.kind}
            </span>
          </span>
        ))}
      </div>
    );
  };

  const renderDataFields = (data: InsightData) => {
    const Field = ({ label, value, highlight, color }: { label: string; value: React.ReactNode; highlight?: boolean; color?: string }) => (
      <div className="flex items-start gap-3 py-1.5">
        <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
        <span className={`font-mono text-sm ${color ? color : highlight ? 'text-blue-400 font-semibold' : 'text-foreground'}`}>
          {value}
        </span>
      </div>
    );

    switch (data.type) {
      case "TypeInference":
        return (
          <>
            <Field label="Inferred Type" value={data.inferredType} highlight />
            {data.declaredType && <Field label="Declared Type" value={data.declaredType} />}
            {data.typeArguments && data.typeArguments.length > 0 && (
              <Field label="Type Args" value={data.typeArguments.join(", ")} />
            )}
          </>
        );

      case "SmartCast":
        return (
          <>
            <Field
              label="Cast"
              value={
                <span className="flex items-center gap-2">
                  <span className="text-red-400 line-through opacity-70">{data.originalType}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-green-400 font-bold">{data.narrowedType}</span>
                </span>
              }
            />
            <Field label="Evidence" value={data.evidenceKind} />
          </>
        );

      case "Scoping":
        return (
          <>
            <Field label="Scope Fn" value={data.scopeFunction} highlight />
            {data.outerReceiver && <Field label="Outer" value={data.outerReceiver} />}
            {data.innerReceiver && <Field label="Inner" value={<span className="text-purple-300">{data.innerReceiver}</span>} />}
            {data.itParameterType && <Field label="'it' Type" value={data.itParameterType} />}
          </>
        );

      case "Extension":
        return (
          <>
            <Field label="Function" value={data.functionOrProperty} highlight />
            <Field label="Receiver" value={data.extensionReceiverType} />
            <Field label="Source" value={<span className="text-muted-foreground italic">{data.resolvedFrom}</span>} />
            {data.competingMember && <Field label="Note" value={<span className="text-yellow-400">Shadows member</span>} />}
          </>
        );

      case "Lambda":
        return (
          <>
            <Field label="Return Type" value={data.returnType} highlight />
            {data.parameterTypes.length > 0 && (
              <Field
                label="Parameters"
                value={data.parameterTypes.map((p, i) => (
                  <span key={i} className="mr-2">
                    <span className="text-yellow-400">{p.name}</span>: {p.type}
                  </span>
                ))}
              />
            )}
            {data.inferredFromContext && <Field label="Context" value={<span className="text-muted-foreground italic">{data.inferredFromContext}</span>} />}
          </>
        );

      case "Nullability":
        return (
          <>
            <Field
              label="Type"
              value={
                <span>
                  {data.nullableType}
                  {data.isNullable && <Badge variant="destructive" className="ml-2 text-[10px] h-4">Nullable</Badge>}
                </span>
              }
              highlight
            />
            {data.isPlatformType && <Field label="Platform" value="Java Interop" />}
            {data.narrowedToNonNull && <Field label="Status" value={<span className="text-green-400">Narrowed to Non-Null</span>} />}
          </>
        );

      case "Overload":
        return (
          <>
            <Field label="Selected" value={data.selectedSignature} highlight />
            <Field label="Candidates" value={`${data.candidateCount} matches`} />
            {data.resolutionFactors.length > 0 && (
              <Field label="Factors" value={data.resolutionFactors.join(", ")} />
            )}
          </>
        );

      // NEW: Operator resolution
      case "Operator":
        return (
          <>
            <Field
              label="Operator"
              value={
                <span className="flex items-center gap-2">
                  <code className="px-2 py-0.5 bg-pink-500/20 rounded text-pink-400 font-bold">{data.operator}</code>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-pink-300">{data.resolvedFunction}()</span>
                </span>
              }
            />
            <Field label="Receiver" value={data.receiverType} color="text-pink-400" />
            {data.parameterTypes.length > 0 && (
              <Field label="Parameters" value={data.parameterTypes.join(", ")} />
            )}
            <Field label="Returns" value={data.returnType} highlight />
            <Field label="Defined in" value={<span className="text-muted-foreground italic">{data.declaringClass}</span>} />
            {data.isInfix && <Field label="Style" value={<Badge variant="outline" className="text-xs">infix</Badge>} />}
          </>
        );

      // NEW: Receiver resolution
      case "Receiver":
        return (
          <>
            <Field
              label="Receiver"
              value={
                <span className="flex items-center gap-2">
                  <span className="text-indigo-400 font-semibold">{data.receiverType}</span>
                  <Badge variant="outline" className="text-xs text-indigo-300">{data.receiverKind}</Badge>
                </span>
              }
            />
            {data.label && <Field label="Label" value={<code className="text-indigo-300">this@{data.label}</code>} />}
            <Field label="Scope Depth" value={`${data.scopeDepth} level${data.scopeDepth !== 1 ? 's' : ''} up`} />
            {data.alternativeReceivers.length > 0 && (
              <Field
                label="Alternatives"
                value={
                  <span className="text-muted-foreground">
                    {data.alternativeReceivers.map((r, i) => (
                      <span key={i} className="mr-2 line-through opacity-60">{r}</span>
                    ))}
                  </span>
                }
              />
            )}
          </>
        );

      // NEW: Delegation
      case "Delegation":
        return (
          <>
            <Field
              label="Kind"
              value={
                <Badge variant="outline" className="text-teal-400 border-teal-400/30">
                  {data.delegationKind}
                </Badge>
              }
            />
            <Field label="Property Type" value={data.propertyType} highlight />
            <Field label="Delegate Type" value={data.delegateType} color="text-teal-400" />
            {data.delegateExpression && (
              <Field label="Expression" value={<code className="text-xs">{data.delegateExpression}</code>} />
            )}
            <Field
              label="Generates"
              value={
                <span className="flex gap-1">
                  {(data.accessorGenerated === "getter" || data.accessorGenerated === "both") && (
                    <Badge variant="secondary" className="text-xs">get</Badge>
                  )}
                  {(data.accessorGenerated === "setter" || data.accessorGenerated === "both") && (
                    <Badge variant="secondary" className="text-xs">set</Badge>
                  )}
                </span>
              }
            />
            {data.interfaceDelegatedTo && (
              <Field label="Delegates to" value={<span className="text-teal-300">{data.interfaceDelegatedTo}</span>} />
            )}
          </>
        );

      // NEW: Destructuring
      case "Destructuring":
        return (
          <>
            <Field
              label="Variable"
              value={<span className="text-amber-400 font-semibold">{data.variableName}</span>}
            />
            <Field label="Source Type" value={data.sourceType} />
            <Field
              label="Component"
              value={
                <span className="flex items-center gap-2">
                  <code className="text-amber-300">{data.componentFunction}()</code>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-amber-400">{data.componentType}</span>
                </span>
              }
            />
            <Field label="Index" value={`#${data.componentIndex}`} />
            {data.isDataClass && (
              <Field label="Source" value={<Badge variant="outline" className="text-xs text-amber-300">data class</Badge>} />
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {header}
      <div className="bg-background border-t border-border">
        <ScrollArea className="max-h-64">
          <div className="p-4 space-y-4">
            {/* Token and Position */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-muted-foreground" />
                <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded font-semibold">
                  {insight.tokenText}
                </code>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                Ln {insight.position.from.line}, Col {insight.position.from.col}
              </span>
            </div>

            {/* Data Fields */}
            <div className="border-t border-border pt-3">
              {renderDataFields(insight.data)}
            </div>

            {/* Scope Chain */}
            <div className="border-t border-border pt-3">
              <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                <GitBranch className="h-3 w-3" />
                <span>Scope</span>
              </div>
              {renderScopeChain()}
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
