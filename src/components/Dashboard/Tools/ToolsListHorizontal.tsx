import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTemplates } from "@/api/apiEndpoints";
import IsLoading from "@/components/IsLoading";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ToolsListHorizontal() {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { data: tools = [], isLoading } = useQuery({
    queryKey: ["tools", "hot"],
    queryFn: () => getTemplates(true), // always fetch hot tools
    staleTime: 5 * 60 * 1000, // 5 minutes - hot tools don't change often
  });

  const hotTools = tools?.filter((tool) => tool.hot); // just in case
  const placeholders = Array.from({ length: 4 - hotTools.slice(0, 4).length })

  const handlePreview = (banner?: string) => {
    if (!banner) return;
    setPreviewImage(banner);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {hotTools?.map((tool) => (
        <div
          key={tool.id}
          className="relative h-[400px] rounded-xl overflow-hidden border border-white/20 bg-white/5 backdrop-blur-sm p-4"
        >
          {/* Banner Preview */}
          <button
            type="button"
            className="absolute inset-0 p-2 z-0 text-left"
            onClick={() => handlePreview(tool.banner)}
            style={{
              WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
              maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
            }}
          >
            {tool.banner ? (
              <div className="mask-b-to-[80%] h-full bg-white rounded-lg overflow-hidden">
                <img
                  src={tool.banner}
                  alt={`${tool.name} banner`}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-black/10">
                No Preview
              </div>
            )}
          </button>

          {/* Bottom Overlay */}
          <div className="absolute bottom-0 left-0 w-full z-10 bg-transparent p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <h3 className="text-white font-semibold truncate">{tool.name}</h3>
              <span className="text-xs text-white/80 bg-white/10 px-2 py-1 rounded-full capitalize">
                Hot Tool 🔥
              </span>
            </div>

            <Link to={`/all-tools/${tool.id}`} className="w-full mt-2">
              <button className="w-full px-4 py-2 rounded-md bg-primary text-background font-medium hover:bg-primary/90 transition">
                Use Tool
              </button>
            </Link>
          </div>
        </div>
      ))}

      {placeholders.map((_, index) => (
        <div
          key={`placeholder-${index}`}
          className="relative h-[400px] rounded-xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm p-2 w-full"
        >
          <Skeleton className="w-full h-full bg-white/5" />
        </div>
      ))}

      {isLoading && <IsLoading />}
      
      {/* All Tools Button */}
      <div className="col-span-full flex justify-center mt-8">
        <Link to="/all-tools">
          <button className="bg-white/10 hover:bg-white/15 border border-white/20 text-white flex gap-2 items-center px-8 font-bold py-3 rounded-full shadow-xl shadow-white/10 cursor-pointer group hover:scale-[1.05] transition-all duration-500">
            All Tools
            <ArrowRight className="group-hover:translate-x-[5px] transition-all duration-500" />
          </button>
        </Link>
      </div>

      <Dialog
        open={!!previewImage}
        onOpenChange={(open) => {
          if (!open) setPreviewImage(null);
        }}
      >
        <DialogContent className="max-w-4xl bg-black border border-white/20 max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white">
              Template Preview
            </DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="w-full overflow-auto flex-1 min-h-0 custom-scrollbar">
              <img
                src={previewImage}
                alt="Template preview"
                className="h-full w-auto object-contain rounded-lg border border-white/10"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
