import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTemplates } from "@/api/apiEndpoints";
import { Link, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import IsLoading from "@/components/IsLoading";
import type { Template } from "@/types";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface Props {
  hot?: boolean;
}

export default function ToolsList({ hot }: Props) {
  const [tools, setTools] = useState<Template[]>([]);
  const [query, setQuery] = useState("");
  const pathname = useLocation().pathname;

  const { data, isLoading } = useQuery({
    queryKey: ["tools", `${hot && "hot"}`],
    queryFn: () => getTemplates(hot),
  });

  useEffect(() => {
    if (data) setTools(data);
  }, [data]);

  const filteredTools = tools.filter((tool) =>
    tool.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-10">
      {/* Search Box */}
      {!hot && (
        <div className="flex justify-center bg-gradient-to-b  from-background to-white/5  border-white/10 px-4 py-5">
          <div className="flex flex-col sm:flex-row items-center  w-full relative">
            <Input
              type="text"
              placeholder="Search tools..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-5 py-3 h-fit border border-white/30 rounded-full"
            />
            <Button className="w-fit rounded-full  absolute right-0 top-0 bottom-0 bg-white/10 hover:bg-white/20 text-white m-1 mr-2">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Tool Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredTools.map((tool) => (
          <Link
            to={`/${pathname.includes("all-tools") ? "all-tools" : "tools"}/${
              tool.id
            }`}
            key={tool.id}
            className="relative h-[400px] rounded-xl overflow-hidden border border-white/20 bg-white/5 backdrop-blur-sm p-5"
          >
            {/* Banner Preview */}
            <div
              className="absolute inset-0 p-2 pointer-events-none z-0"
              style={{
                WebkitMaskImage:
                  "linear-gradient(to bottom, black 60%, transparent 100%)",
                maskImage:
                  "linear-gradient(to bottom, black 60%, transparent 100%)",
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
            </div>

            {/* Bottom Overlay */}
            <div className="absolute bottom-0 left-0 w-full z-10 bg-transparent p-4 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <h3 className="text-white font-semibold truncate">
                  {tool.name}
                </h3>
                <span className="text-xs text-white/80 bg-white/10 px-2 py-1 rounded-full capitalize">
                  {tool?.hot ? "Hot Tool 🔥" : "Tool"}
                </span>
              </div>

              <Link
                to={`/${
                  pathname.includes("all-tools") ? "all-tools" : "tools"
                }/${tool.id}`}
                className="w-full mt-2"
              >
                <button className="w-full px-4 py-2 rounded-md bg-primary text-background font-medium hover:bg-primary/90 transition">
                  Use Tool
                </button>
              </Link>
            </div>
          </Link>
        ))}

        {/* No Match */}
        {filteredTools.length === 0 && !isLoading && (
          <p className="col-span-full text-center text-gray-500">
            No tools found.
          </p>
        )}
      </div>
      {isLoading && <IsLoading />}
    </div>
  );
}
