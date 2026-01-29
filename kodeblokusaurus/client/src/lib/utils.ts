import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { InsightCategory } from "@shared/types";

export { CATEGORY_LABELS, CATEGORY_ICONS, sortInsightsByPosition } from "@shared/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Tailwind CSS class strings for each category (app-specific). */
export const CATEGORY_COLORS: Record<InsightCategory, string> = {
  TYPE_INFERENCE: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  NULLABILITY: "text-orange-400 border-orange-400/30 bg-orange-400/10",
  SMART_CASTS: "text-green-400 border-green-400/30 bg-green-400/10",
  SCOPING: "text-purple-400 border-purple-400/30 bg-purple-400/10",
  EXTENSIONS: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  LAMBDAS: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  OVERLOADS: "text-red-400 border-red-400/30 bg-red-400/10",
  OPERATORS: "text-pink-400 border-pink-400/30 bg-pink-400/10",
  RECEIVERS: "text-indigo-400 border-indigo-400/30 bg-indigo-400/10",
  DELEGATION: "text-teal-400 border-teal-400/30 bg-teal-400/10",
  DESTRUCTURING: "text-amber-400 border-amber-400/30 bg-amber-400/10",
};

export function getInsightColor(category: InsightCategory) {
  return CATEGORY_COLORS[category] || "text-gray-400 border-gray-400/30 bg-gray-400/10";
}
