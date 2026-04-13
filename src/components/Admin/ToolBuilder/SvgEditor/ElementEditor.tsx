// ElementEditor component for editing individual SVG elements
import { forwardRef, useEffect, useState, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Save, Bookmark, Trash2, Loader2, Wand2, Upload, X, ImageIcon } from "lucide-react";
import type { SvgElement } from "@/lib/utils/parseSvgElements";
import { toast } from "sonner";
import IdEditor from "./IdEditor/index";
import GenRuleBuilder from "./IdEditor/GenRuleBuilder";
import { DebouncedInput, DebouncedTextarea } from "@/components/ui/debounced-inputs";
import { validateSvgId } from "@/lib/utils/svgIdValidator";


import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTransformVariables,
  createTransformVariable,
  deleteTransformVariable
} from "@/api/apiEndpoints";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import type { TransformVariable, SvgPatch } from "@/types";
import { CollapsiblePanel } from "./components/CollapsiblePanel";

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
          className="h-8 w-8 text-white/40 hover:text-white transition-all duration-300"
          title={`Save or apply ${category} variable`}
        >
          <Bookmark className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-[#0f0f12]/95 border-white/10 text-white w-64 shadow-2xl backdrop-blur-xl">
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
                  className="h-7 w-7 text-white/10 hover:text-red-400 opacity-0 group-hover/item:opacity-100 transition-all"
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
              className="h-8 w-8 shrink-0"
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

interface ElementEditorProps {
  element: SvgElement;
  index: number;
  onUpdate: (index: number, updates: Partial<SvgElement>, undoable?: boolean) => void;
  isTextElement: (el: SvgElement) => boolean;
  isImageElement: (el: SvgElement) => boolean;
  allElements?: SvgElement[];
  onPatchUpdate?: (patch: SvgPatch) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

const ElementEditor = forwardRef<HTMLDivElement, ElementEditorProps>(
  ({ element, index, onUpdate, isTextElement, isImageElement, allElements = [], onPatchUpdate, onDirtyChange }, ref) => {
    const [localElement, setLocalElement] = useState<SvgElement>(element);
    const [isDirty, setIsDirty] = useState(false);
    const [showGenBuilder, setShowGenBuilder] = useState(false);

    // Sync localElement when the element prop changes (e.g., selection changes)
    useEffect(() => {
       if (!isDirty) {
         setLocalElement(element);
       }
    }, [element, isDirty]);

    const imageMap = useRef<Record<string, string>>({});

    // Cleanup Blob URLs on unmount to prevent memory leaks
    useEffect(() => {
      return () => {
        Object.keys(imageMap.current).forEach((blobUrl) => {
          try {
            URL.revokeObjectURL(blobUrl);
          } catch (e) {
            console.warn('Failed to revoke Blob URL:', blobUrl);
          }
        });
        imageMap.current = {};
      };
    }, []);

    // Use a ref to track the last committed internalId to detect selection changes accurately
    const prevId = useRef<string | null>(element.internalId || null);

    useEffect(() => {
      // If we switched to a DIFFERENT element, clear the draft
      if (element.internalId !== prevId.current) {
        setIsDirty(false);
        onDirtyChange?.(false);
        prevId.current = element.internalId || null;
      }
    }, [element.internalId]);

    // Robust Transformation Parser
    const getTransform = () => {
      const style = localElement.attributes.style || "";
      const transformAttr = localElement.attributes.transform || "";
      const combined = `${style} ${transformAttr}`.replace(/,/g, ' '); // Replace commas with spaces for easier parsing

      const getVal = (regex: RegExp) => {
        const match = combined.match(regex);
        return match ? parseFloat(match[1]) : null;
      };

      const rotate = getVal(/rotate\s*\(\s*(-?\d+\.?\d*)/);
      const scale = getVal(/scale\s*\(\s*(-?\d+\.?\d*)/);

      // Improved translate parsing
      const transMatch = combined.match(/translate\s*\(\s*(-?\d+\.?\d*)\s*(-?\d+\.?\d*|)/);
      let translateX = 0;
      let translateY = 0;
      if (transMatch) {
        translateX = parseFloat(transMatch[1]);
        translateY = transMatch[2] ? parseFloat(transMatch[2]) : 0;
      }

      return {
        rotate: rotate ?? 0,
        scale: scale ?? 1,
        translateX: translateX,
        translateY: translateY,
      };
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const currentTransform = useMemo(() => getTransform(), [localElement.attributes.style, localElement.attributes.transform]);

    const handleLocalUpdate = (updates: Partial<SvgElement>) => {
      const updated = {
        ...localElement,
        ...updates,
        attributes: { ...localElement.attributes, ...(updates.attributes || {}) }
      };
      setLocalElement(updated);
      if (!isDirty) {
        setIsDirty(true);
        onDirtyChange?.(true);
      }
    };

    const handleApply = () => {
      console.log('[ElementEditor] Apply button clicked - finalizing state');
      const finalElement = { ...localElement };
      const href = finalElement.attributes.href;

      if (href && typeof href === 'string' && href.startsWith('blob:')) {
        const originalBase64 = imageMap.current[href];
        if (originalBase64) {
          finalElement.attributes = {
            ...finalElement.attributes,
            href: originalBase64,
            'xlink:href': originalBase64
          };
        }
      }

      // Generate patches for backend
      if (onPatchUpdate && element.internalId) {
        const patchId = element.id || element.originalId;
        if (!patchId) {
          console.error('[ElementEditor] Cannot generate patch: element has no ID!', element);
          return;
        }

        if (finalElement.innerText !== element.innerText) {
          onPatchUpdate({ id: patchId, attribute: 'innerText', value: finalElement.innerText });
        }
        if (finalElement.id !== element.id) {
          onPatchUpdate({ id: patchId, attribute: 'id', value: finalElement.id });
        }
        Object.entries(finalElement.attributes).forEach(([key, value]) => {
          if (value !== element.attributes[key]) {
            onPatchUpdate({ id: patchId, attribute: key, value });
          }
        });
      }

      onUpdate(index, finalElement, true); // Final update with UNDO enabled
      setIsDirty(false);
      onDirtyChange?.(false);
      toast.success("Changes finalized");
    };

    const handleDiscard = () => {
      setLocalElement(element);
      setIsDirty(false);
      onDirtyChange?.(false);
      toast.info("Changes discarded");
    };

    const baseId = localElement.id?.split(".")[0]?.replace(/_/g, " ") || `${localElement.tag} ${index + 1}`;
    const isGenField = localElement.id?.includes(".gen");
    const genRuleMatch = localElement.id?.match(/gen_(.+?)(?:\.|$)/);
    const currentGenRule = genRuleMatch ? genRuleMatch[1] : "";
    const previewGenRule = currentGenRule.length > 40 ? `${currentGenRule.slice(0, 40)}...` : currentGenRule;
    const maxLengthMatch = localElement.id?.match(/max_(\d+)/);
    const maxLength = maxLengthMatch ? parseInt(maxLengthMatch[1]) : undefined;
    const isUploadField = localElement.id?.includes(".upload");
    const currentImageUrl = localElement.attributes.href || localElement.attributes['xlink:href'] || "";

    const handleGenRuleChange = (newRule: string) => {
      const parts = localElement.id?.split(".") || [];
      
      // We want to keep track_/hide_ at the end correctly if they exist.
      // So let's strip out 'gen' and 'gen_...' first.
      const cleanParts = parts.filter((p: string) => p !== "gen" && !p.startsWith("gen_"));
      
      // Determine where to insert the new gen_ rule
      // It should ideally go before any tracking_id, track_, link_, grayscale_ or mode modifiers 
      // to maintain DSL valid grammar.
      let insertIndex = cleanParts.length;
      const lateModifiers = ["tracking_id", "track_", "link_", "grayscale", "hide_", "mode"];
      
      for (let i = 0; i < cleanParts.length; i++) {
        if (lateModifiers.some(mod => cleanParts[i].startsWith(mod))) {
          insertIndex = i;
          break;
        }
      }
      
      // Insert the new rule at the correct grammatical index
      cleanParts.splice(insertIndex, 0, `gen_${newRule}`);
      
      handleLocalUpdate({ id: cleanParts.join(".") });
    };

    const currentFieldValues = useMemo(() => {
      const values: Record<string, string> = {};
      allElements.forEach((el: SvgElement) => {
        if (el.id) {
          const base = el.id.split(".")[0];
          if (el.innerText) values[base] = el.innerText;
        }
      });
      return values;
    }, [allElements]);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const blobUrl = URL.createObjectURL(file);
        imageMap.current[blobUrl] = base64;
        handleLocalUpdate({ attributes: { ...localElement.attributes, href: blobUrl, 'xlink:href': blobUrl } });
      };
      reader.readAsDataURL(file);
    };

    const queryClient = useQueryClient();
    const { data: variables = [] } = useQuery<TransformVariable[]>({
      queryKey: ["transformVariables"],
      queryFn: getTransformVariables
    });

    const saveVariableMutation = useMutation({
      mutationFn: createTransformVariable,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["transformVariables"] });
        toast.success("Variable saved!");
      }
    });

    const deleteVariableMutation = useMutation({
      mutationFn: deleteTransformVariable,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["transformVariables"] });
        toast.success("Variable deleted");
      }
    });

    const updateTransform = (key: 'rotate' | 'scale' | 'translateX' | 'translateY', value: number) => {
      const newTransform = { ...currentTransform, [key]: value };

      // Generate Normalized SVG Transform components (NO 'deg', NO 'px')
      const components: string[] = [];

      if (newTransform.translateX !== 0 || newTransform.translateY !== 0) {
        components.push(`translate(${newTransform.translateX} ${newTransform.translateY})`);
      }

      if (newTransform.rotate !== 0) {
        // We use a simple rotate(angle) here because we complement it with
        // transform-origin: center in the CSS style. This provides the best
        // "rotate itself" (spin-in-place) behavior for interactive editing.
        components.push(`rotate(${newTransform.rotate})`);
      }

      if (newTransform.scale !== 1) {
        components.push(`scale(${newTransform.scale})`);
      }

      const tStr = components.join(' ');

      // Keep CSS for things like transform-origin for preview, but MOVE actual transform to attribute
      let newStyle = localElement.attributes.style || "";
      if (!newStyle.includes("transform-box")) newStyle = `transform-box: fill-box; ${newStyle}`;
      if (!newStyle.includes("transform-origin")) newStyle = `transform-origin: center; ${newStyle}`;

      // Strip transform from style to avoid double-application if browser supports both
      newStyle = newStyle.replace(/transform:[^;]+;?/g, '').trim();

      handleLocalUpdate({
        attributes: {
          ...localElement.attributes,
          style: newStyle.replace(/;;/g, ";"),
          transform: tStr
        }
      });
    };

    return (
      <div ref={ref} className="space-y-4">
        {isDirty && (
          <div className="sticky top-0 z-50 flex items-center justify-between p-1.5 px-3 bg-[#0a0a0c]/60 backdrop-blur-md border border-white/5 rounded-full -mx-1">
            <div className="flex items-center gap-2 ml-1">
              <div className="w-1 h-1 rounded-full bg-primary/60" />
              <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Draft Mode</span>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="h-7 text-[10px] text-white/30 px-3 rounded-full" onClick={handleDiscard}>Discard</Button>
              <Button 
                size="sm" 
                variant="vibrant" 
                className="h-7 text-[10px] px-5 font-bold rounded-full" 
                onClick={handleApply}
                disabled={!validateSvgId(localElement.id || "").valid}
              >
                Apply
              </Button>
            </div>
          </div>
        )}

        <div className="text-sm font-medium text-white/80 capitalize">{baseId}</div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">ID</Label>
          <IdEditor
            value={localElement.id || ""}
            onChange={(newId) => handleLocalUpdate({ id: newId })}
            placeholder="Search IDs..."
            allElements={allElements}
          />
        </div>

        {isGenField && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Generation Rule</Label>
            <div className="flex gap-2">
              <Input value={previewGenRule} readOnly className="bg-white/5 text-white/60 font-mono text-xs border-white/20 focus-visible:ring-0" />
              <GenRuleBuilder
                value={currentGenRule}
                onChange={handleGenRuleChange}
                allElements={allElements}
                maxLength={maxLength}
                open={showGenBuilder}
                onOpenChange={setShowGenBuilder}
                currentFieldValues={currentFieldValues}
                defaultTextContent={localElement.innerText || ""}
                trigger={
                  <Button variant="outline" className="shrink-0 bg-white/5 border-white/20 hover:bg-white/10 gap-2">
                    <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-xs">Builder</span>
                  </Button>
                }
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-sm font-medium">Helper Text</Label>
          <DebouncedTextarea
            value={localElement.attributes['data-helper'] || ""}
            onChange={(val) => handleLocalUpdate({ attributes: { ...localElement.attributes, 'data-helper': String(val) } })}
            rows={2}
            className="bg-white/10 text-sm border-white/20 focus-visible:ring-0 focus-visible:border-white/40"
          />
        </div>

        {isTextElement(localElement) && (
          <div className="space-y-4 border-t border-white/5 pt-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Text Content</Label>
              <DebouncedTextarea
                value={localElement.innerText || ""}
                onChange={(val) => handleLocalUpdate({ innerText: String(val) })}
                rows={6}
                className="bg-white/10 text-sm font-mono border-white/20 focus-visible:ring-0 focus-visible:border-white/40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold text-white/60">Auto-Wrap Width</Label>
              <DebouncedInput
                type="number"
                value={localElement.attributes['data-max-width'] || ""}
                onChange={(val) => handleLocalUpdate({ attributes: { ...localElement.attributes, 'data-max-width': String(val) } })}
                className="bg-white/10 h-8 border-white/20 focus-visible:ring-0 focus-visible:border-white/40"
              />
            </div>
          </div>
        )}

        {(isImageElement(localElement) || isUploadField) && (
          <div className="space-y-3 border-t border-white/5 pt-4">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Upload className="w-3.5 h-3.5 text-primary" />
              Upload Image
            </Label>
            
            <div className="group relative">
              {currentImageUrl ? (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/10 transition-all group-hover:border-white/20">
                  <img 
                    src={currentImageUrl} 
                    alt="Preview" 
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button 
                      variant="glass" 
                      size="sm" 
                      onClick={() => document.getElementById(`image-upload-${index}`)?.click()}
                      className="h-8 text-[10px] font-bold"
                    >
                      <ImageIcon className="w-3 h-3 mr-2" />
                      Replace
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleLocalUpdate({ attributes: { ...localElement.attributes, href: "", 'xlink:href': "" } })}
                      className="h-8 w-8 text-white/50 hover:text-red-400 hover:bg-red-400/10"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => document.getElementById(`image-upload-${index}`)?.click()}
                  className="w-full aspect-video rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all flex flex-col items-center justify-center gap-2 group"
                >
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5 text-white/40" />
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Click to upload</div>
                </button>
              )}
              
              <input 
                id={`image-upload-${index}`}
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                className="hidden" 
              />
            </div>
            
            <p className="text-[10px] text-white/20 italic">
              Supports JPG, PNG, SGV. Max 5MB recommended.
            </p>
          </div>
        )}

        {!isGenField && (
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
                    <Button variant="glass" size="icon" className="h-8 w-8" onClick={() => updateTransform(t.key as 'rotate' | 'scale' | 'translateX' | 'translateY', (currentTransform as Record<string, number>)[t.key] - (t.step || 1))}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <DebouncedInput
                      type="number"
                      value={(currentTransform as Record<string, number>)[t.key]}
                      step={t.step || 1}
                      onChange={(val) => updateTransform(t.key as 'rotate' | 'scale' | 'translateX' | 'translateY', parseFloat(String(val)) || 0)}
                      className="h-8 bg-white/5 text-xs text-center border-white/20 focus-visible:ring-0 focus-visible:border-white/40"
                    />
                    <Button variant="glass" size="icon" className="h-8 w-8" onClick={() => updateTransform(t.key as 'rotate' | 'scale' | 'translateX' | 'translateY', (currentTransform as Record<string, number>)[t.key] + (t.step || 1))}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CollapsiblePanel>
        )}
      </div>
    );
  }
);

ElementEditor.displayName = "ElementEditor";
export default ElementEditor;
