import { Button } from "@/components/ui/button";
import { useAppState } from "@/contexts/AppStateContext";
import { Upload } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

export default function ImportBar() {
  const { setSnippet } = useAppState();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const json = JSON.parse(content);

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
          data-testid="import-button"
        >
          <Upload className="h-3 w-3 mr-1.5" />
          Import
        </Button>
      </div>
    </div>
  );
}
