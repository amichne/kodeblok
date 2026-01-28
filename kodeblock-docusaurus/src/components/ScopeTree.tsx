import { Box, Braces, ChevronDown, ChevronRight, CircleDot, FileCode, GitBranch, Layers } from "lucide-react";
import { useState } from "react";
import { ScopeNode } from "../lib/types";

interface ScopeTreeNodeProps {
  node: ScopeNode;
  depth: number;
  onSelectInsight: (insightId: string) => void;
}

function ScopeTreeNode({ node, depth, onSelectInsight }: ScopeTreeNodeProps) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const getIcon = () => {
    switch (node.ref.kind) {
      case "FILE":
        return <FileCode className="kb-icon-inline kb-icon-blue" />;
      case "CLASS":
        return <Box className="kb-icon-inline kb-icon-yellow" />;
      case "FUNCTION":
        return <GitBranch className="kb-icon-inline kb-icon-purple" />;
      case "LAMBDA":
        return <Braces className="kb-icon-inline kb-icon-green" />;
      case "SCOPE_FUNCTION":
        return <CircleDot className="kb-icon-inline kb-icon-cyan" />;
      default:
        return <Layers className="kb-icon-inline kb-icon-muted" />;
    }
  };

  const handleClick = () => {
    if (node.insights.length > 0) {
      onSelectInsight(node.insights[0]);
    }
  };

  return (
    <div className="kb-scope-node">
      <div
        className="kb-scope-row"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        {hasChildren ? (
          <button
            type="button"
            className="kb-scope-toggle"
            onClick={(event) => {
              event.stopPropagation();
              setIsOpen(!isOpen);
            }}
            aria-label={isOpen ? "Collapse scope" : "Expand scope"}
          >
            {isOpen ? <ChevronDown className="kb-icon-inline" /> : <ChevronRight className="kb-icon-inline" />}
          </button>
        ) : (
          <span className="kb-scope-spacer" />
        )}

        {getIcon()}
        <span className="kb-scope-kind">{node.ref.kind}</span>

        {node.ref.receiverType && (
          <span className="kb-scope-meta">({node.ref.receiverType})</span>
        )}

        {node.insights.length > 0 && (
          <span className="kb-badge kb-badge--secondary kb-scope-count">
            {node.insights.length}
          </span>
        )}
      </div>

      {hasChildren && isOpen && (
        <div className="kb-scope-children">
          {node.children.map((child, i) => (
            <ScopeTreeNode
              key={`${child.ref.scopeId}-${i}`}
              node={child}
              depth={depth + 1}
              onSelectInsight={onSelectInsight}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ScopeTreeProps {
  rootScopes?: ScopeNode[] | null;
  onSelectInsight: (insightId: string) => void;
}

export default function ScopeTree({ rootScopes, onSelectInsight }: ScopeTreeProps) {
  if (!rootScopes || rootScopes.length === 0) {
    return (
      <div className="kb-scope-empty">
        <Layers className="kb-icon" />
        <p>No Scope Information</p>
        <span>This snippet does not include scope hierarchy data.</span>
      </div>
    );
  }

  return (
    <div className="kb-scope-scroll">
      <div className="kb-scope-header">
        <h3>
          <Layers className="kb-icon-inline" />
          Scope Structure
        </h3>
        <p>Navigate the lexical scope hierarchy.</p>
      </div>
      <div className="kb-scope-tree">
        {rootScopes.map((scope, i) => (
          <ScopeTreeNode
            key={`${scope.ref.scopeId}-${i}`}
            node={scope}
            depth={0}
            onSelectInsight={onSelectInsight}
          />
        ))}
      </div>
    </div>
  );
}
