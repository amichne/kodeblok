import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAppState } from "@/contexts/AppStateContext";
import { getInsightColor } from "@/lib/utils";
import { useEffect, useRef } from "react";

export default function Timeline() {
  const { 
    snippet, 
    filteredInsights, 
    activeInsightId, 
    selectedInsightId,
    setActiveInsightId,
    setSelectedInsightId
  } = useAppState();
  
  const containerRef = useRef<HTMLDivElement>(null);

  if (!snippet) return null;

  // Calculate total lines for scaling
  const totalLines = snippet.code.split('\n').length;

  return (
    <div className="h-12 bg-[#1E1F22] border-t border-[#2B2D30] flex items-center px-4 relative overflow-hidden" ref={containerRef}>
      <div className="absolute inset-x-0 h-[1px] bg-[#2B2D30] top-1/2 -translate-y-1/2" />
      
      <div className="relative w-full h-full">
        {filteredInsights.map((insight) => {
          // Calculate position percentage based on line number
          const percent = (insight.position.from.line / totalLines) * 100;
          const isSelected = selectedInsightId === insight.id;
          const isActive = activeInsightId === insight.id;
          const colorClass = getInsightColor(insight.category);
          
          // Extract just the bg color part for the dot
          const bgClass = colorClass.split(' ').find(c => c.startsWith('bg-'))?.replace('/10', '') || 'bg-gray-400';
          const borderClass = colorClass.split(' ').find(c => c.startsWith('border-'))?.replace('/30', '') || 'border-gray-400';
          
          return (
            <Tooltip key={insight.id}>
              <TooltipTrigger asChild>
                <button
                  className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border transition-all duration-200 z-10
                    ${bgClass} ${borderClass}
                    ${isSelected ? 'scale-150 ring-2 ring-white z-20' : ''}
                    ${isActive && !isSelected ? 'scale-125 z-20' : ''}
                  `}
                  style={{ left: `${percent}%` }}
                  onMouseEnter={() => setActiveInsightId(insight.id)}
                  onMouseLeave={() => setActiveInsightId(null)}
                  onClick={() => setSelectedInsightId(insight.id)}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-[#2B2D30] border-[#4E5157] text-foreground">
                <p className="font-bold text-xs">{insight.kind}</p>
                <p className="text-[10px] text-muted-foreground">Line {insight.position.from.line}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
