import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  maxTags?: number;
  commonKeywords?: string[];
}

export function TagInput({
  tags,
  onChange,
  placeholder = "Add a keyword and press Enter",
  className,
  maxTags,
  commonKeywords = ["vertical-split-download", "horizontal-split-download", "escort", "trackable"],
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("");

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue.trim());
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      removeTag(tags.length - 1);
    }
  };

  const addTag = (tag: string) => {
    if (!tag) return;
    
    // Check max tags limit
    if (maxTags && tags.length >= maxTags) {
      return;
    }
    
    // Prevent duplicates
    if (tags.includes(tag)) {
      setInputValue("");
      return;
    }
    
    onChange([...tags, tag]);
    setInputValue("");
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleInputBlur = () => {
    // Add tag when input loses focus if there's text
    if (inputValue.trim()) {
      addTag(inputValue.trim());
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "flex flex-wrap gap-2 min-h-[2.5rem] w-full rounded-md border border-white/10 bg-white/5 px-3 py-2",
          "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
          "transition-colors"
        )}
      >
        {/* Tags */}
        {tags.map((tag, index) => (
          <div
            key={index}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 text-white text-sm font-medium border border-white/10"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="ml-0.5 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-colors p-0.5"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3 text-white/70" />
            </button>
          </div>
        ))}
        
        {/* Input */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onBlur={handleInputBlur}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent border-0 outline-none text-white placeholder:text-gray-400 text-sm"
        />
      </div>
      
      {/* Common Keywords */}
      {commonKeywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-white/60 self-center">Quick add:</span>
          {commonKeywords.map((keyword) => {
            const isAdded = tags.includes(keyword);
            return (
              <button
                key={keyword}
                type="button"
                onClick={() => !isAdded && addTag(keyword)}
                disabled={isAdded}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
                  isAdded
                    ? "bg-white/5 text-white/40 border-white/5 cursor-not-allowed"
                    : "bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer"
                )}
              >
                {keyword}
              </button>
            );
          })}
        </div>
      )}
      
      {/* Helper text */}
      {maxTags && (
        <p className="text-xs text-white/60">
          {tags.length} / {maxTags} keywords
        </p>
      )}
      {!maxTags && tags.length > 0 && (
        <p className="text-xs text-white/60">
          {tags.length} keyword{tags.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

