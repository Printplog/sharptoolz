import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Template } from "@/types";
import { Link } from "react-router-dom";

type Props = {
  tool: Template;
};

export default function ToolCard({ tool }: Props) {
  return (
    <div className="relative h-[400px] rounded-xl overflow-hidden border border-white/20 bg-white/5 backdrop-blur-sm p-5">
      {/* SVG Preview */}
      <div
        className="absolute inset-0 p-2 pointer-events-none z-0"
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, black 60%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
        }}
      >
        {tool.svg ? (
          <div
            className="[&_svg]:max-w-full [&_svg]:h-auto [&_svg]:w-full rounded-lg overflow-hidden mask-b-to-[80%]"
            dangerouslySetInnerHTML={{ __html: tool.svg }}
            aria-label="SVG Preview"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-black/10">
            No Preview
          </div>
        )}
      </div>

      {/* Bottom Overlay Content */}
      <div className="absolute bottom-0 left-0 w-full z-10 bg-transparent p-4 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <h3 className="text-white font-semibold truncate">{tool.name}</h3>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mt-2">
          <Link to={`/admin/tools/${tool.id}`}>
            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0 text-red-500 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
