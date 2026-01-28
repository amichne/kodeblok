import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useAppState } from "@/contexts/AppStateContext";
import { useTheme } from "@/contexts/ThemeContext";
import { CATEGORY_LABELS, getInsightColor } from "@/lib/utils";
import { BookOpen, ChevronDown, Filter, Moon, Search, Sun, Upload } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { InsightCategory } from "@/lib/types";

export default function TopBar() {
  const { 
    selectedCategories, 
    toggleCategory, 
    showHighlightsOnly, 
    setShowHighlightsOnly,
    searchQuery,
    setSearchQuery,
    isNarrativeMode,
    setNarrativeMode,
    setSnippet
  } = useAppState();

  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const json = JSON.parse(content);
        
        // Basic validation for SemanticProfile
        if (!json.snippetId || !json.code || !Array.isArray(json.insights)) {
          throw new Error("Invalid SemanticProfile format");
        }

        setSnippet(json);
        toast.success("Snippet loaded successfully");
      } catch (error) {
        console.error("Failed to parse JSON", error);
        toast.error("Failed to load snippet: Invalid JSON format");
      }
    };
    reader.readAsText(file);
    
    // Reset input so same file can be selected again
    event.target.value = "";
  };

  return (
    <div className="h-14 bg-background border-b border-border flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-md flex items-center justify-center text-white">
            K
          </div>
          <span>Kodeblok</span>
        </div>
        
        <div className="h-6 w-[1px] bg-border mx-2" />

        {/* File Upload */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".json"
          onChange={handleFileUpload}
        />
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 border-input bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5 mr-2" />
          Import JSON
        </Button>

        {/* Category Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 border-input bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground">
              <Filter className="h-3.5 w-3.5 mr-2" />
              Categories
              {selectedCategories.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">
                  {selectedCategories.length}
                </Badge>
              )}
              <ChevronDown className="h-3.5 w-3.5 ml-2 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2 bg-popover border-border" align="start">
            <div className="space-y-1">
              <div 
                className={`flex items-center px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent ${selectedCategories.length === 0 ? 'bg-accent' : ''}`}
                onClick={() => {
                  // Clear all categories to show all (default state)
                  selectedCategories.forEach(c => toggleCategory(c));
                }}
              >
                <div className={`w-3 h-3 rounded-full mr-2 ${selectedCategories.length === 0 ? 'bg-foreground' : 'bg-muted-foreground'}`} />
                <span className={`text-sm ${selectedCategories.length === 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  All Categories
                </span>
              </div>
              
              {(Object.keys(CATEGORY_LABELS) as InsightCategory[]).map((category) => {
                const isSelected = selectedCategories.includes(category);
                const colorClass = getInsightColor(category);
                const dotColor = colorClass.split(' ').find(c => c.startsWith('text-'))?.replace('text-', 'bg-') || 'bg-gray-400';
                
                return (
                  <div 
                    key={category}
                    className={`flex items-center px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent ${isSelected ? 'bg-accent' : ''}`}
                    onClick={() => {
                      // Focus mode: if clicking a new category, clear others and select this one.
                      // If clicking the only selected category, clear it (back to All).
                      if (isSelected && selectedCategories.length === 1) {
                        toggleCategory(category); // Deselect -> All
                      } else {
                        // Clear current selection first if it's not this one
                        selectedCategories.forEach(c => {
                          if (c !== category) toggleCategory(c);
                        });
                        if (!isSelected) toggleCategory(category);
                      }
                    }}
                  >
                    <div className={`w-3 h-3 rounded-full mr-2 ${isSelected ? dotColor : 'bg-muted-foreground'}`} />
                    <span className={`text-sm ${isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {CATEGORY_LABELS[category]}
                    </span>
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Highlights Toggle */}
        <div className="flex items-center gap-2 ml-2">
          <Switch 
            id="highlights-mode" 
            checked={showHighlightsOnly}
            onCheckedChange={setShowHighlightsOnly}
            className="data-[state=checked]:bg-purple-600"
          />
          <label htmlFor="highlights-mode" className="text-xs font-medium text-muted-foreground cursor-pointer select-none">
            HIGHLIGHTS ONLY
          </label>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search insights..." 
            className="h-8 pl-9 bg-secondary border-input text-sm focus-visible:ring-ring"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="h-6 w-[1px] bg-border" />
        
        {/* Narrative Mode Toggle */}
        <Button 
          variant={isNarrativeMode ? "default" : "ghost"} 
          size="sm" 
          className={`h-8 gap-2 ${isNarrativeMode ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
          onClick={() => setNarrativeMode(!isNarrativeMode)}
        >
          <BookOpen className="h-4 w-4" />
          Narrative Mode
        </Button>

        <div className="h-6 w-[1px] bg-border" />

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
