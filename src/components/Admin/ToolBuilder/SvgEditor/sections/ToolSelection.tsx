import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tool } from "@/types";

interface ToolSelectionProps {
  tools: Tool[];
  selectedTool: string;
  onToolChange: (toolId: string) => void;
}

export default function ToolSelection({
  tools,
  selectedTool,
  onToolChange,
}: ToolSelectionProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="tool-select" className="text-sm font-medium">
        Tool
      </Label>
      <Select value={selectedTool || "none"} onValueChange={(value) => onToolChange(value === "none" ? "" : value)}>
        <SelectTrigger className="w-full bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0">
          <SelectValue placeholder="Select a tool (optional)" />
        </SelectTrigger>
        <SelectContent className="bg-background border border-white/10 ">
          <SelectItem value="none" className="text-white/90 focus:bg-white/5 focus:text-white/80">
            <span className="text-white/60 italic">No tool</span>
          </SelectItem>
          {tools.map((tool) => (
            <SelectItem key={tool.id} value={tool.id} className="text-white/90 hover:bg-white/5 focus:bg-white/5 focus:text-white/80">
              <div className="flex items-center gap-2">
                <span>{tool.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedTool && (
        <div className="text-xs text-white/60">
          Selected: {tools.find(tool => tool.id === selectedTool)?.name}
        </div>
      )}
    </div>
  );
}


