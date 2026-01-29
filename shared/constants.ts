import type { InsightCategory } from "./types";

/** Hex color values for each insight category (framework-agnostic). */
export const CATEGORY_HEX_COLORS: Record<InsightCategory, string> = {
  TYPE_INFERENCE: "#22d3ee",
  NULLABILITY: "#fb923c",
  SMART_CASTS: "#4ade80",
  SCOPING: "#c084fc",
  EXTENSIONS: "#60a5fa",
  LAMBDAS: "#facc15",
  OVERLOADS: "#f87171",
  OPERATORS: "#f472b6",
  RECEIVERS: "#818cf8",
  DELEGATION: "#2dd4bf",
  DESTRUCTURING: "#fbbf24",
};

/** Human-readable labels for each insight category. */
export const CATEGORY_LABELS: Record<InsightCategory, string> = {
  TYPE_INFERENCE: "Type Inference",
  NULLABILITY: "Nullability",
  SMART_CASTS: "Smart Casts",
  SCOPING: "Scoping",
  EXTENSIONS: "Extensions",
  LAMBDAS: "Lambdas",
  OVERLOADS: "Overloads",
  OPERATORS: "Operators",
  RECEIVERS: "Receivers",
  DELEGATION: "Delegation",
  DESTRUCTURING: "Destructuring",
};

/** Compact single-character or short icons for each category. */
export const CATEGORY_ICONS: Record<InsightCategory, string> = {
  TYPE_INFERENCE: "T",
  NULLABILITY: "?",
  SMART_CASTS: "\u2192",
  SCOPING: "{}",
  EXTENSIONS: "\u2295",
  LAMBDAS: "\u03BB",
  OVERLOADS: "#",
  OPERATORS: "\u00B1",
  RECEIVERS: "@",
  DELEGATION: "\u21E2",
  DESTRUCTURING: "( )",
};

/** Sort insights by source position (line, then column). */
export function sortInsightsByPosition<T extends { position: { from: { line: number; col: number } } }>(insights: T[]): T[] {
  return [...insights].sort((a, b) => {
    if (a.position.from.line !== b.position.from.line) {
      return a.position.from.line - b.position.from.line;
    }
    return a.position.from.col - b.position.from.col;
  });
}

/** Get a one-line summary string for a given insight's data. */
export function getInsightSummary(data: { type: string } & Record<string, unknown>): string {
  switch (data.type) {
    case "TypeInference":
      return data.inferredType as string;
    case "SmartCast":
      return `${data.originalType} \u2192 ${data.narrowedType}`;
    case "Scoping":
      return (data.scopeFunction as string) || "scope change";
    case "Extension":
      return data.functionOrProperty as string;
    case "Lambda":
      return data.returnType as string;
    case "Nullability":
      return data.nullableType as string;
    case "Overload":
      return `${data.candidateCount} candidates`;
    case "Operator":
      return `${data.operator} \u2192 ${data.resolvedFunction}()`;
    case "Receiver":
      return `${data.receiverKind}: ${data.receiverType}`;
    case "Delegation":
      return `${data.delegationKind}: ${data.propertyType}`;
    case "Destructuring":
      return `${data.variableName} \u2190 ${data.componentFunction}()`;
    default:
      return "";
  }
}
