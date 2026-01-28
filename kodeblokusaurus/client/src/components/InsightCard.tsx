import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { InsightData, ScopeRef, SemanticInsight } from "@/lib/types";
import { CATEGORY_LABELS, getInsightColor } from "@/lib/utils";
import { ArrowRight, FileCode, GitBranch, Info, Layers } from "lucide-react";

interface InsightCardProps {
  insight: SemanticInsight;
  className?: string;
}

export default function InsightCard({ insight, className }: InsightCardProps) {
  const colorClass = getInsightColor(insight.category);

  // Helper to render scope chain
  const renderScopeChain = () => {
    if (!insight.scopeChain || insight.scopeChain.length === 0) {
      return <span className="text-muted-foreground text-xs italic">Global Scope</span>;
    }

    return (
      <div className="space-y-2">
        {insight.scopeChain.map((scope: ScopeRef, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            {index === 0 ? (
              <FileCode className="h-3 w-3 text-muted-foreground" />
            ) : (
              <div className="flex flex-col items-center h-full">
                <div className="h-2 w-[1px] bg-border mb-1" />
                <GitBranch className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
            <span className="font-mono text-foreground bg-muted px-1.5 py-0.5 rounded">
              {scope.kind}
            </span>
            <span className="text-muted-foreground text-[10px]">
              {scope.scopeId}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const getReasonDescription = () => {
    switch (insight.category) {
      case "TYPE_INFERENCE":
        return "The compiler inferred this type based on the assignment value.";
      case "NULLABILITY":
        return "Null safety check or safe call operator usage detected.";
      case "SMART_CASTS":
        return "Variable was automatically cast to a more specific type after a check.";
      case "SCOPING":
        return "Scope function usage affects 'this' or 'it' context.";
      case "EXTENSIONS":
        return "Extension function resolved from a specific package.";
      case "LAMBDAS":
        return "Lambda parameter or return type inferred from context.";
      case "OVERLOADS":
        return "Specific function overload selected based on arguments.";
      default:
        return "Semantic insight detected by the compiler.";
    }
  };

  const renderDataFields = (data: InsightData) => {
    switch (data.type) {
      case "TypeInference":
        return (
          <>
            <TableRow className="border-b border-border hover:bg-muted/50">
              <TableCell className="font-medium text-xs py-2 text-muted-foreground w-1/3">Inferred Type</TableCell>
              <TableCell className="text-sm py-2 font-mono text-foreground font-bold text-blue-400">{data.inferredType}</TableCell>
            </TableRow>
            {data.declaredType && (
              <TableRow className="border-b border-border hover:bg-muted/50">
                <TableCell className="font-medium text-xs py-2 text-muted-foreground w-1/3">Declared Type</TableCell>
                <TableCell className="text-sm py-2 font-mono text-foreground">{data.declaredType}</TableCell>
              </TableRow>
            )}
            {data.typeArguments && data.typeArguments.length > 0 && (
              <TableRow className="border-b border-border hover:bg-muted/50">
                <TableCell className="font-medium text-xs py-2 text-muted-foreground w-1/3">Type Arguments</TableCell>
                <TableCell className="text-sm py-2 font-mono text-foreground">
                  {data.typeArguments.map(arg => <Badge key={arg} variant="outline" className="mr-1 text-[10px]">{arg}</Badge>)}
                </TableCell>
              </TableRow>
            )}
          </>
        );

      case "SmartCast":
        return (
          <>
            <TableRow className="border-b border-border hover:bg-muted/50">
              <TableCell className="font-medium text-xs py-2 text-muted-foreground w-1/3">Cast Flow</TableCell>
              <TableCell className="text-sm py-2 font-mono text-foreground flex items-center gap-2">
                <span className="text-red-400 line-through opacity-70">{data.originalType}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-green-400 font-bold">{data.narrowedType}</span>
              </TableCell>
            </TableRow>
            <TableRow className="border-b border-border hover:bg-muted/50">
              <TableCell className="font-medium text-xs py-2 text-muted-foreground w-1/3">Evidence</TableCell>
              <TableCell className="text-sm py-2 font-mono text-foreground">{data.evidenceKind}</TableCell>
            </TableRow>
          </>
        );

      case "Scoping":
        return (
          <>
            <TableRow className="border-b border-border hover:bg-muted/50">
              <TableCell className="font-medium text-xs py-2 text-muted-foreground w-1/3">Scope Function</TableCell>
              <TableCell className="text-sm py-2 font-mono text-purple-400 font-bold">{data.scopeFunction}</TableCell>
            </TableRow>
            <TableRow className="border-b border-border hover:bg-muted/50">
              <TableCell className="font-medium text-xs py-2 text-muted-foreground w-1/3">Context Change</TableCell>
              <TableCell className="text-sm py-2 font-mono text-foreground">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-[10px]">Outer:</span>
                    <span>{data.outerReceiver}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-[10px]">Inner:</span>
                    <span className="text-purple-300">{data.innerReceiver}</span>
                  </div>
                </div>
              </TableCell>
            </TableRow>
            {data.itParameterType && (
              <TableRow className="border-b border-border hover:bg-muted/50">
                <TableCell className="font-medium text-xs py-2 text-muted-foreground w-1/3">'it' Type</TableCell>
                <TableCell className="text-sm py-2 font-mono text-foreground">{data.itParameterType}</TableCell>
              </TableRow>
            )}
          </>
        );

      case "Extension":
        return (
          <>
            <TableRow className="border-b border-border hover:bg-muted/50">
              <TableCell className="font-medium text-xs py-2 text-muted-foreground w-1/3">Function</TableCell>
              <TableCell className="text-sm py-2 font-mono text-blue-400 font-bold">{data.functionOrProperty}</TableCell>
            </TableRow>
            <TableRow className="border-b border-border hover:bg-muted/50">
              <TableCell className="font-medium text-xs py-2 text-muted-foreground w-1/3">Receiver</TableCell>
              <TableCell className="text-sm py-2 font-mono text-foreground">{data.extensionReceiverType}</TableCell>
            </TableRow>
            <TableRow className="border-b border-border hover:bg-muted/50">
              <TableCell className="font-medium text-xs py-2 text-muted-foreground w-1/3">Source</TableCell>
              <TableCell className="text-sm py-2 font-mono text-muted-foreground italic">{data.resolvedFrom}</TableCell>
            </TableRow>
            {data.competingMember && (
              <TableRow className="border-b border-border hover:bg-muted/50">
                <TableCell className="font-medium text-xs py-2 text-muted-foreground w-1/3">Shadowing</TableCell>
                <TableCell className="text-sm py-2 font-mono text-yellow-400">Shadows member function</TableCell>
              </TableRow>
            )}
          </>
        );

      case "Lambda":
        return (
          <>
            <TableRow className="border-b border-border hover:bg-muted/50">
              <TableCell className="font-medium text-xs py-2 text-muted-foreground w-1/3">Return Type</TableCell>
              <TableCell className="text-sm py-2 font-mono text-foreground">{data.returnType}</TableCell>
            </TableRow>
            <TableRow className="border-b border-border hover:bg-muted/50">
              <TableCell className="font-medium text-xs py-2 text-muted-foreground w-1/3">Parameters</TableCell>
              <TableCell className="text-sm py-2 font-mono text-foreground">
                {data.parameterTypes.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-yellow-400">{p.name}</span>
                    <span className="text-muted-foreground">:</span>
                    <span>{p.type}</span>
                  </div>
                ))}
              </TableCell>
            </TableRow>
            <TableRow className="border-b border-border hover:bg-muted/50">
              <TableCell className="font-medium text-xs py-2 text-muted-foreground w-1/3">Context</TableCell>
              <TableCell className="text-sm py-2 font-mono text-muted-foreground italic">{data.inferredFromContext}</TableCell>
            </TableRow>
          </>
        );

      case "Nullability":
        return (
          <>
            <TableRow className="border-b border-border hover:bg-muted/50">
              <TableCell className="font-medium text-xs py-2 text-muted-foreground w-1/3">Type</TableCell>
              <TableCell className="text-sm py-2 font-mono text-foreground">
                {data.nullableType}
                {data.isNullable && <Badge variant="destructive" className="ml-2 text-[10px] h-4">Nullable</Badge>}
              </TableCell>
            </TableRow>
            <TableRow className="border-b border-border hover:bg-muted/50">
              <TableCell className="font-medium text-xs py-2 text-muted-foreground w-1/3">Platform Type</TableCell>
              <TableCell className="text-sm py-2 font-mono text-foreground">{data.isPlatformType ? "Yes (Java Interop)" : "No"}</TableCell>
            </TableRow>
            {data.narrowedToNonNull && (
              <TableRow className="border-b border-border hover:bg-muted/50">
                <TableCell className="font-medium text-xs py-2 text-muted-foreground w-1/3">Status</TableCell>
                <TableCell className="text-sm py-2 font-mono text-green-400">Narrowed to Non-Null</TableCell>
              </TableRow>
            )}
          </>
        );

      case "Overload":
        return (
          <>
            <TableRow className="border-b border-border hover:bg-muted/50">
              <TableCell className="font-medium text-xs py-2 text-muted-foreground w-1/3">Selected</TableCell>
              <TableCell className="text-sm py-2 font-mono text-foreground font-bold">{data.selectedSignature}</TableCell>
            </TableRow>
            <TableRow className="border-b border-border hover:bg-muted/50">
              <TableCell className="font-medium text-xs py-2 text-muted-foreground w-1/3">Candidates</TableCell>
              <TableCell className="text-sm py-2 font-mono text-foreground">
                <Badge variant="outline">{data.candidateCount} candidates</Badge>
              </TableCell>
            </TableRow>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="border-border bg-card shadow-sm">
        <div className={`h-1 w-full ${colorClass}`} />
        <CardContent className="p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className={`${colorClass.replace('bg-', 'text-')} border-current bg-transparent`}>
                  {CATEGORY_LABELS[insight.category]}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">{insight.kind}</span>
              </div>
              <h3 className="text-lg font-semibold tracking-tight">{insight.tokenText}</h3>
            </div>
          </div>

          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableBody>
                {renderDataFields(insight.data)}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50 text-sm text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <p>{getReasonDescription()}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-sm">
        <div className="p-3 border-b border-border bg-muted/30">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Layers className="h-3 w-3" />
            Scope Context
          </h4>
        </div>
        <CardContent className="p-4">
          {renderScopeChain()}
        </CardContent>
      </Card>
    </div>
  );
}
