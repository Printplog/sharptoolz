import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ToolSelector() {
  const tools = [ "All tools","Hammer", "Screwdriver", "Wrench", "Pliers", "Drill"];
  return (
    <div>
      <Select>
        <SelectTrigger className="bg-white/5 border-white/10 data-[placeholder]:text-white cursor-pointer">
          <SelectValue placeholder="--Select Tool--" />
        </SelectTrigger>
        <SelectContent>
          {tools.map((tool) => (
            <SelectItem key={tool} value={tool}>
              {tool}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
