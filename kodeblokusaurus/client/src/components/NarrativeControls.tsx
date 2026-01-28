import { Button } from "@/components/ui/button";
import { useAppState } from "@/contexts/AppStateContext";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";

export default function NarrativeControls() {
  const { 
    isNarrativeMode, 
    currentNarrativeIndex, 
    filteredInsights, 
    nextNarrativeStep, 
    prevNarrativeStep 
  } = useAppState();

  // Keyboard shortcuts
  useEffect(() => {
    if (!isNarrativeMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'j') {
        nextNarrativeStep();
      } else if (e.key === 'k') {
        prevNarrativeStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNarrativeMode, nextNarrativeStep, prevNarrativeStep]);

  if (!isNarrativeMode) return null;

  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-[#2B2D30] border border-[#4E5157] rounded-full shadow-xl px-4 py-2 flex items-center gap-4 z-50 animate-in fade-in slide-in-from-bottom-4">
      <div className="text-xs font-medium text-gray-400 mr-2">
        <span className="text-white">{currentNarrativeIndex + 1}</span> / {filteredInsights.length}
      </div>
      
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-full hover:bg-[#3C3F41]"
          onClick={prevNarrativeStep}
          disabled={currentNarrativeIndex <= 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="text-[10px] text-gray-500 font-mono px-1">K / J</div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-full hover:bg-[#3C3F41]"
          onClick={nextNarrativeStep}
          disabled={currentNarrativeIndex >= filteredInsights.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
