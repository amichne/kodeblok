import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppState } from "@/contexts/AppStateContext";
import { ScopeNode } from "@/lib/types";
import { ChevronDown, ChevronRight, FileCode, GitBranch, Box, Layers } from "lucide-react";
import { useState } from "react";

interface ScopeTreeNodeProps {
  node: ScopeNode;
  depth: number;
  onSelect: (node: ScopeNode) => void;
}

function ScopeTreeNode({ node, depth, onSelect }: ScopeTreeNodeProps) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const getIcon = () => {
    switch (node.ref.kind) {
      case "FILE": return <FileCode className="h-3.5 w-3.5 text-blue-400" />;
      case "CLASS": return <Box className="h-3.5 w-3.5 text-yellow-400" />;
      case "FUNCTION": return <GitBranch className="h-3.5 w-3.5 text-purple-400" />;
      default: return <Layers className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div className="select-none">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div 
          className="flex items-center gap-1 py-1 px-2 hover:bg-muted/50 rounded cursor-pointer group"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => onSelect(node)}
        >
          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-4 w-4 p-0 hover:bg-muted">
                {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </Button>
            </CollapsibleTrigger>
          ) : (
            <div className="w-4" />
          )}
          
          {getIcon()}
          
          <span className="text-xs font-mono ml-1 text-foreground">
            {node.ref.kind}
          </span>
          
          {node.ref.receiverType && (
            <span className="text-[10px] text-muted-foreground ml-2">
              ({node.ref.receiverType})
            </span>
          )}
          
          {node.insights.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-[10px] h-4 px-1">
              {node.insights.length}
            </Badge>
          )}
        </div>
        
        {hasChildren && (
          <CollapsibleContent>
            {node.children.map((child, i) => (
              <ScopeTreeNode 
                key={`${child.ref.scopeId}-${i}`} 
                node={child} 
                depth={depth + 1} 
                onSelect={onSelect}
              />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

export default function ScopeTree() {
  const { snippet } = useAppState();

  if (!snippet || !snippet.rootScopes || snippet.rootScopes.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
        <Layers className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">No scope information available for this snippet.</p>
      </div>
    );
  }

  const handleSelectNode = (node: ScopeNode) => {
    // Future: Highlight scope range in editor
    console.log("Selected scope:", node);
  };

  return (
    <div className="h-full flex flex-col bg-background border-l border-border">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Scope Structure
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Navigate the lexical scope hierarchy.
        </p>
      </div>
      <ScrollArea className="flex-1 p-2">
        {snippet.rootScopes.map((scope, i) => (
          <ScopeTreeNode 
            key={`${scope.ref.scopeId}-${i}`} 
            node={scope} 
            depth={0} 
            onSelect={handleSelectNode}
          />
        ))}
      </ScrollArea>
    </div>
  );
}
