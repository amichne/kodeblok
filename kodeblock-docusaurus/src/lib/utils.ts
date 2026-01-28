import { InsightCategory, SemanticInsight } from "./types";

export const CATEGORY_LABELS: Record<InsightCategory, string> = {
  TYPE_INFERENCE: "Type Inference",
  NULLABILITY: "Nullability",
  SMART_CASTS: "Smart Casts",
  SCOPING: "Scoping",
  EXTENSIONS: "Extensions",
  LAMBDAS: "Lambdas",
  OVERLOADS: "Overloads",
};

export interface CategoryStyle {
  accent: string;
  border: string;
  background: string;
}

export const CATEGORY_STYLES: Record<InsightCategory, CategoryStyle> = {
  TYPE_INFERENCE: { accent: "#22d3ee", border: "rgba(34, 211, 238, 0.35)", background: "rgba(34, 211, 238, 0.12)" },
  NULLABILITY: { accent: "#fb923c", border: "rgba(251, 146, 60, 0.35)", background: "rgba(251, 146, 60, 0.12)" },
  SMART_CASTS: { accent: "#4ade80", border: "rgba(74, 222, 128, 0.35)", background: "rgba(74, 222, 128, 0.12)" },
  SCOPING: { accent: "#c084fc", border: "rgba(192, 132, 252, 0.35)", background: "rgba(192, 132, 252, 0.12)" },
  EXTENSIONS: { accent: "#60a5fa", border: "rgba(96, 165, 250, 0.35)", background: "rgba(96, 165, 250, 0.12)" },
  LAMBDAS: { accent: "#facc15", border: "rgba(250, 204, 21, 0.35)", background: "rgba(250, 204, 21, 0.12)" },
  OVERLOADS: { accent: "#f87171", border: "rgba(248, 113, 113, 0.35)", background: "rgba(248, 113, 113, 0.12)" },
};

const FALLBACK_STYLE: CategoryStyle = {
  accent: "#9ca3af",
  border: "rgba(156, 163, 175, 0.35)",
  background: "rgba(156, 163, 175, 0.12)",
};

export function getCategoryStyle(category: InsightCategory): CategoryStyle {
  return CATEGORY_STYLES[category] || FALLBACK_STYLE;
}

export function getCategorySlug(category: InsightCategory): string {
  return category.toLowerCase();
}

export function sortInsightsByPosition(insights: SemanticInsight[]) {
  return [...insights].sort((a, b) => {
    if (a.position.from.line !== b.position.from.line) {
      return a.position.from.line - b.position.from.line;
    }
    return a.position.from.col - b.position.from.col;
  });
}
