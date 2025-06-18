import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { Template } from "@/types";

export default function ToolCard({ tool }: { tool: Template }) {
  return (
    <div className=" bg-white/10 border border-white/20 rounded-xl p-4 backdrop-blur-sm flex flex-col h-[300px]">
      {/* Preview Area */}
    <div className="flex-1 flex items-center justify-center bg-primary/10 rounded-lg mb-4 overflow-hidden [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:w-full">
      {tool.svg ? (
        <div
        className="w-full h-full"
        dangerouslySetInnerHTML={{ __html: tool.svg }}
        aria-label="SVG Preview"
        />
      ) : (
        <span className="text-muted-foreground">No preview</span>
      )}
    </div>

      {/* Tool Name */}
      <h3 className="font-medium mb-4">{tool.name}</h3>

      {/* Actions */}
      <div className="flex justify-end gap-2 mt-auto pt-2">
        <Button size="sm" variant="outline" className="h-8 w-8 p-0">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-500 hover:text-red-400">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}