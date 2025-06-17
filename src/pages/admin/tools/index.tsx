import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import doc from "@/assets/docs/shipping.svg"
import { Link } from "react-router-dom";

export default function Tools() {
  // Dummy tools data
  const tools = [
    { id: 1, name: "Invoice Generator" },
    { id: 2, name: "Resume Builder" },
    { id: 3, name: "Meeting Notes Template" },
    { id: 4, name: "Project Proposal Generator" },
    { id: 5, name: "Business Plan Template" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Your Tools</h1>
        <Link to="?dialog=toolBuilder" className=" button">
          <Plus className="h-4 w-4" />
          New Tool
        </Link>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Card key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  );
}

function Card({ tool }: { tool: { id: number; name: string } }) {
  return (
    <div className=" bg-white/10 border border-white/20 rounded-xl p-4 backdrop-blur-sm flex flex-col h-[300px]">
      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center bg-primary/10 rounded-lg mb-4 overflow-hidden">
        <img src={doc} alt="doc-prview" className="w-full h-full object-cover object-top" />
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