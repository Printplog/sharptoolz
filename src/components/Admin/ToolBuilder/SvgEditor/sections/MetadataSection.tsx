import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TagInput } from "@/components/ui/tag-input";

interface MetadataSectionProps {
  name: string;
  keywords: string[];
  onNameChange: (name: string) => void;
  onKeywordsChange: (keywords: string[]) => void;
}

export default function MetadataSection({
  name,
  keywords,
  onNameChange,
  onKeywordsChange,
}: MetadataSectionProps) {
  return (
    <>
      {/* Template Name */}
      <div className="space-y-2">
        <Label htmlFor="template-name" className="text-sm font-medium">
          Template Name
        </Label>
        <Input
          id="template-name"
          placeholder="Enter template name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0"
        />
      </div>

      {/* Keywords */}
      <div className="space-y-2">
        <Label htmlFor="template-keywords" className="text-sm font-medium">
          Keywords
        </Label>
        <TagInput
          tags={keywords}
          onChange={onKeywordsChange}
          placeholder="Add a keyword and press Enter"
          className="w-full"
        />
        <p className="text-xs text-white/50">
          These tags help trigger tool-specific logic. Press Enter or comma to add keywords.
        </p>
      </div>
    </>
  );
}


