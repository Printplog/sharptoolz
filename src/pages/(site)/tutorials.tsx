import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SectionPadding from "@/layouts/SectionPadding";
import { ArrowRightIcon } from "lucide-react";

export default function Tutorials() {
  return (
    <SectionPadding>
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold pb-4 border-b border-white/10">
          Tutorials for all tools
        </h1>
        <Select defaultValue="1">
          <SelectTrigger className="w-fit min-w-[100px] bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Select tool" className="text-white/80" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Tool 1</SelectItem>
            <SelectItem value="2">Tool 2</SelectItem>
            <SelectItem value="3">Tool 3</SelectItem>
          </SelectContent>
        </Select>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="bg-white/5 border border-white/10 rounded-lg p-1 relative"
            >
              <div className="h-60 w-full bg-white/5 border border-white/10 rounded-lg"></div>
              <p className="text-sm text-white/80 px-3 py-5">
                How to use tool {index + 1}
              </p>
              <button className="px-4 py-2 cursor-pointer text-xs rounded-full bg-primary/5 text-primary border border-primary/10 absolute top-3 right-3 flex items-center gap-1">
                <span>Watch</span>
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </SectionPadding>
  );
}
