import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useAppState } from "@/contexts/AppStateContext";
import { useTheme } from "@/contexts/ThemeContext";
import { CATEGORY_LABELS, getInsightColor } from "@/lib/utils";
import { ChevronDown, Filter, Moon, Search, Sun, Upload } from "lucide-react";
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
    setSnippet,
    filteredInsights
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
    <div className="h-12 bg-background border-b border-border flex items-center justify-between px-4 gap-4 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 font-bold text-base tracking-tight">
          <div className="w-7 h-7 bg-gradient-to-br from-purple-600 to-blue-600 rounded-md flex items-center justify-center text-white text-sm">
            K
          </div>
          <span>Kodeblok</span>
        </div>

        <div className="h-5 w-[1px] bg-border mx-1" />

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
          className="h-7 text-xs border-input bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-3 w-3 mr-1.5" />
          Import
        </Button>

        {/* Category Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs border-input bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground">
              <Filter className="h-3 w-3 mr-1.5" />
              Filter
              {selectedCategories.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                  {selectedCategories.length}
                </Badge>
              )}
              <ChevronDown className="h-3 w-3 ml-1.5 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2 bg-popover border-border" align="start">
            <div className="space-y-1">
              <div
                className={`flex items-center px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent ${selectedCategories.length === 0 ? 'bg-accent' : ''}`}
                onClick={() => {
                  // Clear all categories to show all (default state)
                  selectedCategories.forEach(c => toggleCategory(c));
                }}
              >
                <div className={`w-2.5 h-2.5 rounded-full mr-2 ${selectedCategories.length === 0 ? 'bg-foreground' : 'bg-muted-foreground'}`} />
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
                    <div className={`w-2.5 h-2.5 rounded-full mr-2 ${isSelected ? dotColor : 'bg-muted-foreground'}`} />
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
        <div className="flex items-center gap-1.5">
          <Switch
            id="highlights-mode"
            checked={showHighlightsOnly}
            onCheckedChange={setShowHighlightsOnly}
            className="data-[state=checked]:bg-purple-600 scale-90"
          />
          <label htmlFor="highlights-mode" className="text-xs text-muted-foreground cursor-pointer select-none">
            Highlights
          </label>
        </div>

        {/* Insight count */}
        <span className="text-xs text-muted-foreground ml-2">
          {filteredInsights.length} insight{filteredInsights.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative w-48">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="h-7 pl-7 bg-secondary border-input text-xs focus-visible:ring-ring"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="h-5 w-[1px] bg-border" />

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}
