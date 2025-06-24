import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTemplates } from "@/api/apiEndpoints";
import { Link, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";

export interface Template {
  id?: string;
  name: string;
  svg: string;
  type: "tool";
  created_at: string;
  updated_at: string;
}

export default function ToolsList() {
  const [tools, setTools] = useState<Template[]>([]);
  const [query, setQuery] = useState("");
  const pathname = useLocation().pathname

  const { data, isLoading } = useQuery({
    queryKey: ["tools"],
    queryFn: getTemplates,
  });

  useEffect(() => {
    // Simulate an API call
    const fetchTools = async () => {
      setTools(data as Template[]);
      console.log(data);
    };
    fetchTools();
  }, [data]);

  const filteredTools = tools?.filter((tool) =>
    tool.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <div className="space-y-5 flex justify-center">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 bg-black/20 px-3 py-5 sm:p-5 md:p-10 w-full max-w-3xl rounded-xl">
          <Input
            type="text"
            placeholder="Search tools..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="px-4 py-2 h-fit w-full rounded-md border border-gray-30"
          />
          <button
            className="px-4 py-2 rounded-md bg-primary text-background font-semibold hover:bg-primary/90 transition"
            type="button"
          >
            Search
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {filteredTools?.map((tool) => (
          <div
            key={tool.id}
            className="relative flex flex-col items-center p-3 bg-black/10 border border-white/10 rounded-xl shadow hover:shadow-lg transition"
          >
            <div
              className="w-full h-40 flex justify-center rounded-md items-center overflow-hidden [&_svg]:w-full [&_svg]:h-auto"
              dangerouslySetInnerHTML={{ __html: tool.svg }}
            />
            <h3 className="mt-4 text-center text-lg font-medium">
              {tool.name} tool
            </h3>
            <Link to={`/${ pathname.split("/").pop() === "tools" ? "tools" : "all-tools"}/${tool.id}`} className="mt-4 w-full">
              <button className="w-full justify-self-end px-4 py-2 bg-primary text-background font-medium rounded-md hover:bg-primary/90 transition">
                Use Tool
              </button>
            </Link>
          </div>
        ))}

        {filteredTools?.length === 0 && (
          <p className="col-span-full text-center text-gray-500">
            No tools found.
          </p>
        )}
        {isLoading && (
          <div className="col-span-full flex justify-center items-center py-10">
            <svg
              className="animate-spin h-8 w-8 text-lime-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            <span className="ml-3 text-lime-400 font-medium">
              Loading tools...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
