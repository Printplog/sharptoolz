import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { DebouncedInput } from "@/components/ui/debounced-inputs";
import { CollapsiblePanel } from "../components/CollapsiblePanel";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Bookmark, Trash2, Loader2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import type { TransformVariable } from "@/types";

interface VariableDropdownProps {
  category: TransformVariable['category'];
  currentValue: number;
  onApply: (val: number) => void;
  variables: TransformVariable[];
  saveMutation: { mutate: (data: Partial<TransformVariable>) => void; isPending: boolean };
  deleteMutation: { mutate: (id: number) => void; isPending: boolean };
}

const VariableDropdown = ({
  category,
  currentValue,
  onApply,
  variables,
  saveMutation,
  deleteMutation
}: VariableDropdownProps) => {
  const [variableName, setVariableName] = useState("");
  const filteredVars = variables.filter(v => v.category === category);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="glass"
          size="icon"
          className="h-8 w-8 text-white/40 hover:text-white transition-all duration-300 rounded-full"
          title={`Save or apply ${category} variable`}
        >
          <Bookmark className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-[#0f0f12]/95 border-white/10 text-white w-64 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in duration-200">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-widest text-white/40 font-bold px-3 py-2">
          {category.replace('translate', 'Position ')} Variables
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/5 mx-1" />

        <div className="max-h-[200px] overflow-y-auto">
          {filteredVars.length > 0 ? (
            filteredVars.map((v) => (
              <div key={v.id} className="flex items-center px-1 group/item">
                <DropdownMenuItem
                  className="flex-1 text-xs hover:bg-white/5 cursor-pointer rounded-md"
                  onClick={() => {
                    onApply(v.value);
                    toast.success(`Applied ${v.name}: ${v.value}`);
                  }}
                >
                  <span className="truncate flex-1 font-medium">{v.name}</span>
                  <span className="text-[10px] text-white/30 ml-2 font-mono">
                    {v.value}{category === 'rotate' ? '°' : category === 'scale' ? 'x' : 'px'}
                  </span>
                </DropdownMenuItem>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white/10 hover:text-red-400 opacity-0 group-hover/item:opacity-100 transition-all rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMutation.mutate(v.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))
          ) : (
            <div className="px-2 py-6 text-[10px] text-white/30 text-center italic">No {category} variables yet</div>
          )}
        </div>

        <DropdownMenuSeparator className="bg-white/5 mx-1" />
        <div className="p-3 space-y-3 bg-white/2">
          <Label className="text-[10px] text-white/50 block">Save current: <span className="text-white font-mono">{currentValue}</span></Label>
          <div className="flex gap-2">
            <Input
              placeholder="Name..."
              className="h-8 text-[11px] bg-white/5 border-white/10 focus-visible:ring-0 focus-visible:border-white/30"
              value={variableName}
              onChange={(e) => setVariableName(e.target.value)}
            />
            <Button
              size="icon"
              variant="vibrant"
              className="h-8 w-8 shrink-0 rounded-full"
              disabled={!variableName || saveMutation.isPending}
              onClick={() => {
                saveMutation.mutate({
                  name: variableName,
                  category: category,
                  value: currentValue
                });
                setVariableName("");
              }}
            >
              {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface TransformSettingsProps {
  index: number;
  currentTransform: { rotate: number; scale: number; translateX: number; translateY: number };
  updateTransform: (key: 'rotate' | 'scale' | 'translateX' | 'translateY', value: number) => void;
  variables: TransformVariable[];
  saveVariableMutation: { mutate: (data: Partial<TransformVariable>) => void; isPending: boolean };
  deleteVariableMutation: { mutate: (id: number) => void; isPending: boolean };
}

export const TransformSettings = ({
  index,
  currentTransform,
  updateTransform,
  variables,
  saveVariableMutation,
  deleteVariableMutation,
}: TransformSettingsProps) => {
  return (
    <CollapsiblePanel id={`transform-${index}`} title="Transformations" defaultOpen={false}>
      <div className="space-y-6 bg-white/3 p-4 rounded-xl border border-white/5">
        {[
          { key: 'rotate', label: 'Rotate' },
          { key: 'translateX', label: 'Pos X' },
          { key: 'translateY', label: 'Pos Y' },
          { key: 'scale', label: 'Scale', step: 0.1 }
        ].map((t) => (
          <div key={t.key} className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] uppercase font-bold text-white/40">{t.label}</Label>
              <VariableDropdown
                category={t.key as TransformVariable['category']}
                currentValue={(currentTransform as Record<string, number>)[t.key]}
                onApply={(val) => updateTransform(t.key as 'rotate' | 'scale' | 'translateX' | 'translateY', val)}
                variables={variables}
                saveMutation={saveVariableMutation}
                deleteMutation={deleteVariableMutation}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="glass"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() =>
                  updateTransform(
                    t.key as "rotate" | "scale" | "translateX" | "translateY",
                    (currentTransform as Record<string, number>)[t.key] - (t.step || 1)
                  )
                }
              >
                <Minus className="w-3 h-3" />
              </Button>
              <DebouncedInput
                type="number"
                value={(currentTransform as Record<string, number>)[t.key]}
                step={t.step || 1}
                onChange={(val) =>
                  updateTransform(
                    t.key as "rotate" | "scale" | "translateX" | "translateY",
                    parseFloat(String(val)) || 0
                  )
                }
                className="h-8 bg-white/5 text-xs text-center border-white/20 focus-visible:ring-0 focus-visible:border-white/40"
              />
              <Button
                variant="glass"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() =>
                  updateTransform(
                    t.key as "rotate" | "scale" | "translateX" | "translateY",
                    (currentTransform as Record<string, number>)[t.key] + (t.step || 1)
                  )
                }
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </CollapsiblePanel>
  );
};
