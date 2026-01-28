import { InsightCategory, InsightData, SemanticInsight } from "./types";

export function getReasonText(insight: SemanticInsight): string {
  const { category, data, kind } = insight;

  switch (category) {
    case "TYPE_INFERENCE":
      if (data.type === "TypeInference") {
        if (data.declaredType) {
          return `The type ${data.inferredType} was explicitly declared and matches the inferred type.`;
        }
        if (data.typeArguments && data.typeArguments.length > 0) {
          return `The compiler inferred the type ${data.inferredType} with generic arguments based on usage context.`;
        }
        return `The compiler inferred the type ${data.inferredType} based on the assigned value.`;
      }
      return "The compiler inferred this type based on the assignment value.";

    case "NULLABILITY":
      if (data.type === "Nullability") {
        if (kind === "ELVIS_OPERATOR") {
          return "The elvis operator (?:) provides a fallback value when the left side is null, resulting in a non-null type.";
        }
        if (kind === "NULL_SAFE_CALL") {
          return "The safe call operator (?.) allows calling methods on a nullable receiver without causing a NullPointerException.";
        }
        if (kind === "NOT_NULL_ASSERTION") {
          return "The not-null assertion (!!) converts a nullable type to non-null, throwing an exception if the value is actually null.";
        }
        if (data.isPlatformType) {
          return "This is a platform type from Java interop. Kotlin cannot determine nullability from Java code, so extra caution is advised.";
        }
        if (data.narrowedToNonNull) {
          return "The type was narrowed to non-null through a null check or safe operator.";
        }
        return `This expression involves null safety handling for type ${data.nullableType}.`;
      }
      return "Null safety check or safe call operator usage detected.";

    case "SMART_CASTS":
      if (data.type === "SmartCast") {
        const evidenceText = data.evidenceKind === "Safe Call"
          ? "a safe call operator"
          : data.evidenceKind.toLowerCase();
        return `After ${evidenceText}, the compiler automatically casts from ${data.originalType} to ${data.narrowedType} in this branch.`;
      }
      return "Variable was automatically cast to a more specific type after a check.";

    case "SCOPING":
      if (data.type === "Scoping") {
        if (data.scopeFunction) {
          const funcName = data.scopeFunction;
          if (funcName === "let") {
            return `The 'let' scope function provides the receiver as 'it' parameter (${data.itParameterType}) and returns the lambda result.`;
          }
          if (funcName === "run") {
            return "The 'run' scope function changes 'this' to the receiver and returns the lambda result.";
          }
          if (funcName === "with") {
            return "The 'with' function changes 'this' to the provided object and returns the lambda result.";
          }
          if (funcName === "apply") {
            return "The 'apply' scope function changes 'this' to the receiver and returns the receiver itself.";
          }
          if (funcName === "also") {
            return "The 'also' scope function provides the receiver as 'it' and returns the receiver itself.";
          }
          return `The '${funcName}' scope function affects the context, changing receiver from ${data.outerReceiver || "none"} to ${data.innerReceiver || "implicit"}.`;
        }
        return "Scope function usage affects 'this' or 'it' context.";
      }
      return "Scope function usage affects 'this' or 'it' context.";

    case "EXTENSIONS":
      if (data.type === "Extension") {
        if (data.competingMember) {
          return `This extension ${data.functionOrProperty} on ${data.extensionReceiverType} shadows a member function with the same name. The extension was resolved from ${data.resolvedFrom}.`;
        }
        return `The extension ${data.functionOrProperty} on ${data.extensionReceiverType} was resolved from ${data.resolvedFrom}.`;
      }
      return "Extension function resolved from a specific package.";

    case "LAMBDAS":
      if (data.type === "Lambda") {
        if (kind === "IMPLICIT_THIS") {
          return `The implicit 'it' parameter refers to the single lambda parameter of type ${data.parameterTypes[0]?.type || "inferred"}.`;
        }
        if (kind === "SAM_CONVERSION") {
          return `This lambda is converted to a SAM (Single Abstract Method) interface ${data.samInterface || "from Java"}.`;
        }
        if (kind === "TRAILING_LAMBDA") {
          return "The lambda is passed as the last parameter using trailing lambda syntax.";
        }
        if (data.inferredFromContext) {
          return `Lambda types inferred from ${data.inferredFromContext}: parameters ${data.parameterTypes.map((p) => `${p.name || "_"}: ${p.type}`).join(", ")}, returns ${data.returnType}.`;
        }
        return `Lambda with parameters ${data.parameterTypes.map((p) => p.type).join(", ")} returning ${data.returnType}.`;
      }
      return "Lambda parameter or return type inferred from context.";

    case "OVERLOADS":
      if (data.type === "Overload") {
        const defaultArgs = data.defaultArgumentsUsed && data.defaultArgumentsUsed.length > 0
          ? ` Default arguments used: ${data.defaultArgumentsUsed.join(", ")}.`
          : "";
        return `Selected overload ${data.selectedSignature} from ${data.candidateCount} candidates based on: ${data.resolutionFactors.join(", ")}.${defaultArgs}`;
      }
      return "Specific function overload selected based on arguments.";

    default:
      return "Semantic insight detected by the compiler.";
  }
}

export function getInsightAtPosition(
  insights: SemanticInsight[],
  line: number,
  col: number
): SemanticInsight | undefined {
  return insights.find((insight) => {
    const { from, to } = insight.position;
    if (line < from.line || line > to.line) return false;
    if (line === from.line && col < from.col) return false;
    if (line === to.line && col > to.col) return false;
    return true;
  });
}

export function groupInsightsByLine(insights: SemanticInsight[]): Map<number, SemanticInsight[]> {
  const map = new Map<number, SemanticInsight[]>();

  for (const insight of insights) {
    const line = insight.position.from.line;
    const existing = map.get(line) || [];
    existing.push(insight);
    map.set(line, existing);
  }

  return map;
}

export function getPrimaryInsightAtLine(insights: SemanticInsight[]): SemanticInsight | undefined {
  if (insights.length === 0) return undefined;
  return insights.find((i) => i.level === "HIGHLIGHTS") || insights[0];
}

export function getInsightLabel(insight: SemanticInsight): string {
  const { data, kind } = insight;

  switch (data.type) {
    case "TypeInference":
      return data.inferredType;
    case "SmartCast":
      return `${data.originalType} -> ${data.narrowedType}`;
    case "Scoping":
      return data.scopeFunction || kind;
    case "Extension":
      return data.functionOrProperty;
    case "Lambda":
      return `(${data.parameterTypes.map((p) => p.type).join(", ")}) → ${data.returnType}`;
    case "Nullability":
      return data.narrowedToNonNull ? "non-null" : data.nullableType;
    case "Overload":
      return `${data.candidateCount} overloads`;
    default:
      return kind;
  }
}

export function shouldShowInlayHint(insight: SemanticInsight): boolean {
  if (insight.category !== "TYPE_INFERENCE") return false;
  if (insight.data.type !== "TypeInference") return false;
  return !insight.data.declaredType;
}

export function getCategoryIcon(category: InsightCategory): string {
  switch (category) {
    case "TYPE_INFERENCE": return "type";
    case "NULLABILITY": return "alert-circle";
    case "SMART_CASTS": return "arrow-right-circle";
    case "SCOPING": return "layers";
    case "EXTENSIONS": return "puzzle";
    case "LAMBDAS": return "parentheses";
    case "OVERLOADS": return "list";
    default: return "info";
  }
}
