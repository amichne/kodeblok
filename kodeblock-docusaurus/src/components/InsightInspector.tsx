import { MousePointerClick, Sparkles } from "lucide-react";
import { SemanticInsight } from "../lib/types";
import InsightDetail from "./InsightDetail";

interface InsightInspectorProps {
  pinnedInsight?: SemanticInsight;
  availableCount: number;
}

export default function InsightInspector({ pinnedInsight, availableCount }: InsightInspectorProps) {
  if (!pinnedInsight) {
    return (
      <div className="kb-inspector-empty">
        <div className="kb-empty-icon">
          <MousePointerClick className="kb-icon" />
        </div>
        <h3>No Insight Selected</h3>
        <p>Click a highlighted token in the code or pin a hover card to see detail here.</p>
        {availableCount > 0 && (
          <div className="kb-empty-meta">
            <Sparkles className="kb-icon-inline" />
            <span>{availableCount} insight{availableCount !== 1 ? "s" : ""} available</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="kb-inspector-scroll">
      <InsightDetail insight={pinnedInsight} variant="panel" />
    </div>
  );
}
