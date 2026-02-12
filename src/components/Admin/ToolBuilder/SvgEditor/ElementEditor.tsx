// ElementEditor component for editing individual SVG elements
import { forwardRef, useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw, RotateCw, Move, Minus, Plus, Save, Bookmark, Trash2, Loader2 } from "lucide-react";
import type { SvgElement } from "@/lib/utils/parseSvgElements";
import { toast } from "sonner";
import IdEditor from "./IdEditor/index";
import GenRuleBuilder from "./IdEditor/GenRuleBuilder";
import { DebouncedInput, DebouncedTextarea } from "@/components/ui/debounced-inputs";
import { getFontMetrics } from "@/lib/utils/textWrapping";
import type { SvgPatch } from "@/hooks/useSvgPatch";

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
import type { TransformVariable } from "@/types";
import { CollapsiblePanel } from "./components/CollapsiblePanel";

interface VariableDropdownProps {
  category: TransformVariable['category'];
  currentValue: number;
  onApply: (val: number) => void;
  variables: TransformVariable[];
  saveMutation: any;
  deleteMutation: any;
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
          className="h-8 w-8 text-white/40 hover:text-white transition-all duration-300 hover:scale-110 active:scale-95 group shrink-0"
          title={`Save or apply ${category} variable`}
        >
          <Bookmark className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-[#0f0f12]/95 border-white/10 text-white w-64 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-widest text-white/40 font-bold px-3 py-2">
          {category.replace('translate', 'Position ')} Variables
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/5 mx-1" />

        <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
          {filteredVars.length > 0 ? (
            filteredVars.map((v) => (
              <div key={v.id} className="flex items-center px-1 group/item">
                <DropdownMenuItem
                  className="flex-1 text-xs hover:bg-white/5 cursor-pointer focus:bg-white/10 focus:text-white rounded-md transition-colors"
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
        <div className="p-3 space-y-3 bg-white/[0.02]">
          <Label className="text-[10px] text-white/50 block">Save current: <span className="text-white font-mono">{currentValue}</span></Label>
          <div className="flex gap-2">
            <Input
              placeholder="Name..."
              className="h-8 text-[11px] bg-white/5 border-white/10 focus:border-primary/50 transition-all rounded-md"
              value={variableName}
              onChange={(e) => setVariableName(e.target.value)}
            />
            <Button
              size="icon"
              variant="vibrant"
              className="h-8 w-8 shrink-0 rounded-md"
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
  onUpdate: (index: number, updates: Partial<SvgElement>) => void;
  isTextElement: (el: SvgElement) => boolean;
  isImageElement: (el: SvgElement) => boolean;
  allElements?: SvgElement[]; // All elements to extract base IDs for depends suggestions
  onLiveUpdate?: (element: SvgElement) => void;
  onPatchUpdate?: (patch: SvgPatch) => void;
}

const ElementEditor = forwardRef<HTMLDivElement, ElementEditorProps>(
  ({ element, index, onUpdate, isTextElement, isImageElement, allElements = [], onLiveUpdate, onPatchUpdate }, ref) => {
    const [localElement, setLocalElement] = useState<SvgElement>(element);
    const [isDirty, setIsDirty] = useState(false);
    const [showGenBuilder, setShowGenBuilder] = useState(false);

    // Performance: Throttling & Blob Storage
    const lastUpdate = useMemo(() => ({ current: 0 }), []); // useRef that survives renders but we use useMemo to avoid import changes if needed, actually useRef is imported above
    const updateTimeout = useMemo<{ current: ReturnType<typeof setTimeout> | null }>(() => ({ current: null }), []);
    const imageMap = useMemo(() => ({ current: {} as Record<string, string> }), []); // Stores blobUrl -> base64 mapping

    // Sync local state when the target element changes (e.g. user selects a different element)
    useEffect(() => {
      setLocalElement(element);
      setIsDirty(false);
      // Ensure specific draft override is cleared on selection change if needed, 
      // but parent handles draft state reset usually
    }, [element.id, element.innerText, index]);

    // Calculate & Save Font Metrics Ratio (for Server-Side Consistency)
    useEffect(() => {
      if (!isTextElement(localElement)) return;

      const style = localElement.attributes.style || "";
      let fontSize = parseFloat(localElement.attributes['font-size'] || "0");
      let fontFamily = localElement.attributes['font-family'] || "";

      if (!fontSize) {
        const match = style.match(/font-size:\s*([\d.]+)/);
        if (match) fontSize = parseFloat(match[1]);
      }
      if (!fontFamily) {
        const match = style.match(/font-family:\s*([^;]+)/);
        if (match) fontFamily = match[1].trim().replace(/['"]/g, "");
      }

      if (fontSize > 0) {
        // Calculate ratio using Browser Canvas (User Side Node might fail, so we save this)
        const metrics = getFontMetrics(fontSize, fontFamily || 'Arial');
        // padding used in applyWrappedText is 0.2 * fontSize
        const totalHeight = metrics.ascent + metrics.descent + (fontSize * 0.2);
        const ratio = totalHeight / fontSize;

        const ratioStr = ratio.toFixed(3);

        // Only update if different to avoid loop
        if (localElement.attributes['data-lh-ratio'] !== ratioStr) {
          setLocalElement(prev => {
            const updated = {
              ...prev,
              attributes: { ...prev.attributes, 'data-lh-ratio': ratioStr }
            };
            // We don't need to emit live update for this metadata, but we should save it.
            // Actually, we DO need to emit it so it saves.
            // But if we emit, we trigger parent update.
            // Let's use handleLocalUpdate to ensure consistency.
            // BUT handleLocalUpdate sets localElement, triggering this effect?
            // No, invalidation check `!== ratioStr` prevents loop.

            // We call the debounced live update logic? No, directly.
            // We'll mimic handleLocalUpdate but we are inside useEffect so we can't call it easily without dep cycle?
            // Actually handleLocalUpdate is stable.
            // We can just call it?
            // Let's call the setter provided by handleLocalUpdate logic.
            // Better: Call onLiveUpdate?

            // Safest: Just modify local element and let the dirty state handle save?
            // Or call onLiveUpdate directly?
            onLiveUpdate?.(updated);
            return updated;
          });
          setIsDirty(true);
        }
      }
    }, [
      // Dependencies: Re-run when font props change
      localElement.attributes['style'],
      localElement.attributes['font-family'],
      localElement.attributes['font-size'],
      isTextElement
    ]);

    const handleLocalUpdate = (updates: Partial<SvgElement>) => {
      // This part updates the local UI state
      setLocalElement(prev => {
        const updated = {
          ...prev,
          ...updates,
          attributes: { ...prev.attributes, ...(updates.attributes || {}) }
        };
        return updated;
      });
      setIsDirty(true);

      // This is the new part: create and dispatch the patch
      if (onPatchUpdate) {
        const elementId = element.id; // Use the stable ID from the original prop
        if (!elementId) return; // Don't send patches for elements without IDs

        if (updates.innerText !== undefined) {
          onPatchUpdate({ id: elementId, attribute: 'innerText', value: updates.innerText });
        }
        if (updates.id !== undefined) {
          // This is tricky. If the ID is changed, subsequent patches will fail.
          // The backend needs to handle ID changes as a special case.
          // For now, we send a patch to change the ID.
          onPatchUpdate({ id: elementId, attribute: 'id', value: updates.id });
        }
        if (updates.attributes) {
          for (const [key, value] of Object.entries(updates.attributes)) {
            onPatchUpdate({ id: elementId, attribute: key, value: value });
          }
        }
      }
    };

    // Throttled Live Update to prevent excessive parent re-renders (lag)
    useEffect(() => {
      const now = Date.now();
      const limit = 32; // ~30fps cap

      if (localElement !== element) {
        // Check if we should fire immediately or schedule
        if (now - lastUpdate.current >= limit) {
          onLiveUpdate?.(localElement);
          lastUpdate.current = now;
        } else {
          if (updateTimeout.current) clearTimeout(updateTimeout.current);
          updateTimeout.current = setTimeout(() => {
            onLiveUpdate?.(localElement);
            lastUpdate.current = Date.now();
          }, limit - (now - lastUpdate.current));
        }
      }
      return () => {
        if (updateTimeout.current) clearTimeout(updateTimeout.current);
      };
    }, [localElement, onLiveUpdate]); // Dependency on localElement triggers this effect

    const handleApply = () => {
      console.log('[ElementEditor] Apply button clicked - generating patches');

      // If the image is a blob URL, we must swap it back to Base64 for the save
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

      // CRITICAL: Generate patches when Apply is clicked
      if (onPatchUpdate && element.id) {
        console.log('[ElementEditor] Comparing changes for patches...');

        // Compare text content
        if (finalElement.innerText !== element.innerText) {
          console.log(`[ElementEditor] Text changed: "${element.innerText}" → "${finalElement.innerText}"`);
          onPatchUpdate({ id: element.id, attribute: 'innerText', value: finalElement.innerText });
        }

        // Compare ID change
        if (finalElement.id !== element.id) {
          console.log(`[ElementEditor] ID changed: "${element.id}" → "${finalElement.id}"`);
          onPatchUpdate({ id: element.id, attribute: 'id', value: finalElement.id });
        }

        // Compare all attributes (changed or new)
        Object.entries(finalElement.attributes).forEach(([key, value]) => {
          if (value !== element.attributes[key]) {
            console.log(`[ElementEditor] Attribute ${key} changed/added: "${element.attributes[key]}" → "${value}"`);
            onPatchUpdate({ id: element.id, attribute: key, value: value ?? "" });
          }
        });

        // Track removed attributes
        Object.keys(element.attributes).forEach(key => {
          if (finalElement.attributes[key] === undefined) {
            console.log(`[ElementEditor] Attribute ${key} removed`);
            onPatchUpdate({ id: element.id, attribute: key, value: "" });
          }
        });

        console.log('[ElementEditor] Patches generated successfully');
      } else {
        console.warn('[ElementEditor] No onPatchUpdate callback or element has no ID');
      }

      onUpdate(index, finalElement);
      setIsDirty(false);
      toast.success("Changes applied to SVG");
    };

    const handleDiscard = () => {
      setLocalElement(element);
      setIsDirty(false);
      toast.info("Changes discarded");
    };

    const baseId = localElement.id?.split(".")[0]?.replace(/_/g, " ") || `${localElement.tag} ${index + 1}`;

    // Check if this is a gen field
    const isGenField = localElement.id?.includes(".gen");
    const genRuleMatch = localElement.id?.match(/gen_(.+?)(?:\.|$)/);
    const currentGenRule = genRuleMatch ? genRuleMatch[1] : "";
    const MAX_GEN_RULE_PREVIEW = 40;
    const isLongGenRule = currentGenRule.length > MAX_GEN_RULE_PREVIEW;
    const previewGenRule = isLongGenRule
      ? `${currentGenRule.slice(0, MAX_GEN_RULE_PREVIEW)}...`
      : currentGenRule;
    const maxLengthMatch = localElement.id?.match(/max_(\d+)/);
    const maxLength = maxLengthMatch ? parseInt(maxLengthMatch[1]) : undefined;

    const handleGenRuleChange = (newRule: string) => {
      const parts = localElement.id?.split(".") || [];
      let replaced = false;

      const newParts = parts.map((p: string) => {
        if (p.startsWith("gen_")) {
          replaced = true;
          return `gen_${newRule}`;
        }
        return p;
      });

      if (!replaced) {
        newParts.push(`gen_${newRule}`);
      }

      handleLocalUpdate({ id: newParts.join(".") });
    };

    // Extract current field values from allElements for preview
    const currentFieldValues = useMemo(() => {
      const values: Record<string, string> = {};
      allElements.forEach((el: SvgElement) => {
        if (el.id) {
          const firstDotIndex = el.id.indexOf(".");
          if (firstDotIndex > 0) {
            const baseId = el.id.substring(0, firstDotIndex);
            // Get current text content from the element
            const currentValue = el.innerText || '';
            if (currentValue) {
              values[baseId] = currentValue;
            }
          }
        }
      });
      return values;
    }, [allElements]);

    // --- Image Upload & Annotation Detection ---
    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;

        // 1. Update the image locally
        // 1. Update the image locally using Blob URL (Instant Preview)
        const blobUrl = URL.createObjectURL(file);

        // Store base64 mapping for later save
        imageMap.current[blobUrl] = base64;

        handleLocalUpdate({
          attributes: {
            ...localElement.attributes,
            href: blobUrl,
            'xlink:href': blobUrl
          }
        });

        // 2. Run Annotation Detection (Green Line = Rotation)
        try {
          const { annotationDetector } = await import("@/lib/utils/annotationDetector");
          const analysis = await annotationDetector.loadAndAnalyzeImage(base64);

          if (analysis && analysis.rotation !== undefined && Math.abs(analysis.rotation) > 0.5) {
            const detectedRotation = analysis.rotation;

            // Auto-apply the detected rotation
            // process.nextTick is not needed here, but we want to ensure the first update processed
            setTimeout(() => {
              updateTransform('rotate', detectedRotation);
              toast.success(`Auto-aligned image using Green Line annotation (${Math.round(detectedRotation)}°)`);
            }, 100);
          }

          if (analysis && analysis.center) {
            // We could potentially set transform-origin here if needed,
            // but for now we just acknowledge the Red Dot (Center) was read.
            console.log("[Auto-Align] Red Dot Center detected at:", analysis.center);
          }

        } catch (err) {
          console.error("Annotation detection failed", err);
        }
      };
      reader.readAsDataURL(file);
    };

    // --- Transform Logic (Rotate, Scale, Translate) ---
    const getTransform = () => {
      const style = localElement.attributes.style || "";
      const transformAttr = localElement.attributes.transform || "";
      const combined = `${style} ${transformAttr}`;

      const getVal = (regex: RegExp) => {
        const match = combined.match(regex);
        return match ? parseFloat(match[1]) : null;
      };

      let rotate = getVal(/rotate\s*\(\s*(-?\d+\.?\d*)/);
      let scale = getVal(/scale\s*\(\s*(-?\d+\.?\d*)/);
      let translateX = getVal(/translate\s*\(\s*(-?\d+\.?\d*)/);
      let translateY = getVal(/translate\s*\((?:[^,]+,)?\s*(-?\d+\.?\d*)/);

      if (rotate === null && scale === null && translateX === null) {
        const matrixMatch = combined.match(/matrix\s*\(([^)]+)\)/);
        if (matrixMatch) {
          const params = matrixMatch[1].split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n));
          if (params.length === 6) {
            const [a, b, , , e, f] = params;
            translateX = e;
            translateY = f;
            scale = Math.sqrt(a * a + b * b);
            rotate = Math.atan2(b, a) * (180 / Math.PI);
          }
        }
      }

      return {
        rotate: rotate ?? 0,
        scale: scale ?? 1,
        translateX: translateX ?? 0,
        translateY: translateY ?? 0,
      };
    };

    const currentTransform = getTransform();

    const queryClient = useQueryClient();

    const { data: variables = [] } = useQuery<TransformVariable[]>({
      queryKey: ["transformVariables"],
      queryFn: getTransformVariables
    });

    const saveMutation = useMutation({
      mutationFn: createTransformVariable,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["transformVariables"] });
        toast.success("Variable saved!");
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.error || "Failed to save variable");
      }
    });

    const deleteMutation = useMutation({
      mutationFn: deleteTransformVariable,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["transformVariables"] });
        toast.success("Variable deleted");
      }
    });

    const updateTransform = (key: 'rotate' | 'scale' | 'translateX' | 'translateY', value: number) => {
      const newTransform = { ...currentTransform, [key]: value };

      let newStyle = localElement.attributes.style || "";

      if (!newStyle.includes("transform-box")) newStyle = `transform-box: fill-box; ${newStyle}`;
      if (!newStyle.includes("transform-origin")) newStyle = `transform-origin: center; ${newStyle}`;

      const transformString = [
        newTransform.translateX || newTransform.translateY ? `translate(${newTransform.translateX}px, ${newTransform.translateY}px)` : '',
        newTransform.rotate ? `rotate(${newTransform.rotate}deg)` : '',
        newTransform.scale !== 1 ? `scale(${newTransform.scale})` : ''
      ].filter(Boolean).join(' ');

      if (newStyle.includes("transform:")) {
        newStyle = newStyle.replace(/transform:[^;]+/, `transform: ${transformString}`);
      } else {
        newStyle = `${newStyle}; transform: ${transformString}`;
      }

      if (!transformString) {
        newStyle = newStyle.replace(/transform:[^;]+;?/, '');
      }

      newStyle = newStyle.replace(/;;/g, ";");

      handleLocalUpdate({
        attributes: {
          ...localElement.attributes,
          style: newStyle,
          transform: ""
        }
      });
    };

    return (
      <div
        ref={ref}
        className="space-y-4"
      >
        {isDirty && (
          <div className="sticky top-0 z-50 flex items-center justify-between p-1.5 px-3 bg-[#0a0a0c]/60 backdrop-blur-md border border-white/5 rounded-full -mx-1 animate-in slide-in-from-top duration-500">
            <div className="flex items-center gap-2 ml-1">
              <div className="w-1 h-1 rounded-full bg-primary/60" />
              <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Draft Mode</span>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="h-7 text-[10px] text-white/30 hover:text-white px-3 rounded-full" onClick={handleDiscard}>
                Discard
              </Button>
              <Button size="sm" variant="vibrant" className="h-7 text-[10px] px-5 font-bold rounded-full border-0 shadow-none" onClick={handleApply}>
                Apply
              </Button>
            </div>
          </div>
        )}

        <div className="text-sm font-medium text-white/80 capitalize">
          {baseId}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            ID
          </Label>
          <IdEditor
            value={localElement.id || ""}
            onChange={(newId) => handleLocalUpdate({ id: newId })}
            placeholder="Start typing base ID (e.g. tracking_id)"
            allElements={allElements}
          />
        </div>

        {/* Generation Rule Builder */}
        {isGenField && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-white/80">
              Generation Rule
            </Label>
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
                <Input
                  value={previewGenRule}
                  readOnly
                  title={isLongGenRule ? currentGenRule : undefined}
                  placeholder="No generation rule set - click to build"
                  className="bg-white/5 border-white/20 text-white/60 cursor-pointer"
                />
              }
            />
          </div>
        )}

        {/* Helper Text */}
        <div className="space-y-2">
          <Label htmlFor={`helper-${index}`} className="text-sm font-medium text-white/80">
            Helper Text
            <span className="text-xs text-white/50 ml-2">(Optional)</span>
          </Label>
          <DebouncedTextarea
            id={`helper-${index}`}
            placeholder="Add helpful instructions..."
            value={localElement.attributes['data-helper'] || ""}
            onChange={(value: string) => handleLocalUpdate({
              attributes: { ...localElement.attributes, 'data-helper': value }
            })}
            rows={2}
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0 text-sm"
          />
        </div>

        {isTextElement(localElement) && (
          <div className="space-y-4 border-t border-white/5 pt-4">
            <div className="space-y-2">
              <Label htmlFor={`text-${index}`} className="text-sm font-medium">
                Text Content
              </Label>
              <DebouncedTextarea
                value={localElement.innerText || ""}
                onChange={(value: string) => handleLocalUpdate({ innerText: value })}
                placeholder="Enter text content"
                rows={6}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0 text-sm font-mono leading-relaxed"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs text-white/60 uppercase font-bold tracking-wider">Auto-Wrap Width</Label>
                <span className="text-xs text-white/40">{localElement.attributes['data-max-width'] ? `${localElement.attributes['data-max-width']}px` : 'Off'}</span>
              </div>
              <div className="flex gap-2">
                <DebouncedInput
                  type="number"
                  min={0}
                  placeholder="Set max width in px (e.g. 300)"
                  value={localElement.attributes['data-max-width'] || ""}
                  debounce={150}
                  onChange={(val) => handleLocalUpdate({
                    attributes: { ...localElement.attributes, 'data-max-width': String(val) }
                  })}
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-500 outline-0 text-xs h-8 font-mono"
                />
                {localElement.attributes['data-max-width'] && (
                  <Button
                    variant="glass"
                    size="icon"
                    className="h-8 w-8 text-white/40 hover:text-red-400"
                    onClick={() => handleLocalUpdate({
                      attributes: { ...localElement.attributes, 'data-max-width': "" }
                    })}
                    title="Clear wrapping limit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
              <p className="text-[10px] text-white/30 leading-tight">
                If set, text will automatically wrap to new lines when it exceeds this width.
              </p>
            </div>

          </div>
        )}

        {isImageElement(localElement) && (
          <div className="space-y-2">
            <Label htmlFor={`image-${index}`} className="text-sm font-medium">
              Image (Base64)
            </Label>
            <div className="space-y-2">
              <input
                title="Upload Image"
                id={`image-${index}`}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-white/10 file:text-white hover:file:bg-white/20"
              />
            </div>
          </div>
        )}

        {/* Transform Controls */}
        {!isGenField && (
          <CollapsiblePanel
            id={`transform-${index}`}
            title="Transformations"
            defaultOpen={false}
            className="bg-transparent border-0 p-0"
          >
            <div className="space-y-6 pt-0">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] uppercase tracking-widest text-primary/80 font-bold flex items-center gap-2">
                  <Move className="w-3.5 h-3.5" />
                  Actions
                </Label>

                <Button
                  variant="glass"
                  size="sm"
                  className="h-7 px-3 text-[10px] text-white/50 hover:text-white transition-all uppercase tracking-wider font-bold"
                  onClick={() => {
                    handleLocalUpdate({
                      attributes: {
                        ...localElement.attributes,
                        style: (localElement.attributes.style || "").replace(/transform:[^;]+;?/, "").replace(/transform-box:[^;]+;?/, "").replace(/transform-origin:[^;]+;?/, "").replace(/;;/g, ";"),
                        transform: ""
                      }
                    });
                  }}
                >
                  <RotateCcw className="w-3 h-3 mr-2" />
                  Reset All
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-8 bg-white/[0.03] p-5 rounded-2xl border border-white/5 shadow-inner">
                {/* Position X */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Pos X (px)</Label>
                    <VariableDropdown
                      category="translateX"
                      currentValue={currentTransform.translateX}
                      onApply={(val) => updateTransform('translateX', val)}
                      variables={variables}
                      saveMutation={saveMutation}
                      deleteMutation={deleteMutation}
                    />
                  </div>
                  <div className="flex items-center gap-2 group">
                    <Button
                      variant="glass" size="icon"
                      className="h-8 w-8 shrink-0 rounded-lg group-hover:border-primary/20 transition-all"
                      onClick={() => updateTransform('translateX', (currentTransform.translateX || 0) - 1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <DebouncedInput
                      type="number"
                      value={currentTransform.translateX}
                      debounce={150}
                      onChange={(val) => updateTransform('translateX', parseFloat(String(val)) || 0)}
                      className="h-9 bg-white/5 border-white/10 text-xs text-center px-1 font-mono focus:border-primary/50 transition-all rounded-lg"
                    />
                    <Button
                      variant="glass" size="icon"
                      className="h-8 w-8 shrink-0 rounded-lg group-hover:border-primary/20 transition-all"
                      onClick={() => updateTransform('translateX', (currentTransform.translateX || 0) + 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Position Y */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Pos Y (px)</Label>
                    <VariableDropdown
                      category="translateY"
                      currentValue={currentTransform.translateY}
                      onApply={(val) => updateTransform('translateY', val)}
                      variables={variables}
                      saveMutation={saveMutation}
                      deleteMutation={deleteMutation}
                    />
                  </div>
                  <div className="flex items-center gap-2 group">
                    <Button
                      variant="glass" size="icon"
                      className="h-8 w-8 shrink-0 rounded-lg group-hover:border-primary/20 transition-all"
                      onClick={() => updateTransform('translateY', (currentTransform.translateY || 0) - 1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <DebouncedInput
                      type="number"
                      value={currentTransform.translateY}
                      debounce={150}
                      onChange={(val) => updateTransform('translateY', parseFloat(String(val)) || 0)}
                      className="h-9 bg-white/5 border-white/10 text-xs text-center px-1 font-mono focus:border-primary/50 transition-all rounded-lg"
                    />
                    <Button
                      variant="glass" size="icon"
                      className="h-8 w-8 shrink-0 rounded-lg group-hover:border-primary/20 transition-all"
                      onClick={() => updateTransform('translateY', (currentTransform.translateY || 0) + 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Scale */}
                <div className="col-span-2 space-y-4 pt-4 border-t border-white/5">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Scale (Ratio)</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="glass" size="icon" className="h-8 w-8 shrink-0 rounded-lg"
                        onClick={() => {
                          const newScale = Math.max(0.1, (currentTransform.scale || 1) - 0.1);
                          updateTransform('scale', Math.round(newScale * 10) / 10);
                        }}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <DebouncedInput
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={currentTransform.scale}
                        debounce={150}
                        onChange={(val) => updateTransform('scale', parseFloat(String(val)) || 1)}
                        className="h-8 w-20 bg-white/5 border-white/10 text-xs text-center px-1 font-mono focus:border-primary/50 transition-all rounded-lg"
                      />
                      <Button
                        variant="glass" size="icon" className="h-8 w-8 shrink-0 rounded-lg"
                        onClick={() => {
                          const newScale = (currentTransform.scale || 1) + 0.1;
                          updateTransform('scale', Math.round(newScale * 10) / 10);
                        }}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <VariableDropdown
                        category="scale"
                        currentValue={currentTransform.scale}
                        onApply={(val) => updateTransform('scale', val)}
                        variables={variables}
                        saveMutation={saveMutation}
                        deleteMutation={deleteMutation}
                      />
                    </div>
                  </div>
                  <Slider
                    value={[currentTransform.scale]}
                    min={0.1}
                    max={3}
                    step={0.1}
                    onValueChange={(vals) => updateTransform('scale', vals[0])}
                    className="py-1 cursor-pointer"
                  />
                </div>

                {/* Rotation */}
                <div className="col-span-2 space-y-4 pt-4 border-t border-white/5">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Rotation (Degrees)</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="glass" size="icon" className="h-8 w-8 shrink-0 rounded-lg"
                        onClick={() => updateTransform('rotate', (currentTransform.rotate || 0) - 1)}
                      >
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                      <DebouncedInput
                        type="number"
                        value={Math.round(currentTransform.rotate)}
                        debounce={150}
                        onChange={(val) => updateTransform('rotate', parseFloat(String(val)) || 0)}
                        className="h-8 w-20 bg-white/5 border-white/10 text-xs text-center px-1 font-mono focus:border-primary/50 transition-all rounded-lg"
                      />
                      <Button
                        variant="glass" size="icon" className="h-8 w-8 shrink-0 rounded-lg"
                        onClick={() => updateTransform('rotate', (currentTransform.rotate || 0) + 1)}
                      >
                        <RotateCw className="w-3 h-3" />
                      </Button>
                      <VariableDropdown
                        category="rotate"
                        currentValue={currentTransform.rotate}
                        onApply={(val) => updateTransform('rotate', val)}
                        variables={variables}
                        saveMutation={saveMutation}
                        deleteMutation={deleteMutation}
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 items-center pl-1">
                    <Button
                      variant="glass"
                      size="sm"
                      className="h-8 px-3 text-[10px] text-white/40 hover:text-white rounded-lg transition-all"
                      onClick={() => updateTransform('rotate', (currentTransform.rotate || 0) - 45)}
                    >
                      -45°
                    </Button>
                    <Slider
                      value={[currentTransform.rotate]}
                      min={-180}
                      max={180}
                      step={1}
                      onValueChange={(vals) => updateTransform('rotate', vals[0])}
                      className="flex-1 py-1 cursor-pointer"
                    />
                    <Button
                      variant="glass"
                      size="sm"
                      className="h-8 px-3 text-[10px] text-white/40 hover:text-white rounded-lg transition-all"
                      onClick={() => updateTransform('rotate', (currentTransform.rotate || 0) + 45)}
                    >
                      +45°
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CollapsiblePanel>
        )}

        {/* Opacity Control - For all elements */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Opacity</Label>
            <span className="text-xs text-white/60">{Math.round((parseFloat(localElement.attributes.opacity || "1") * 100))}%</span>
          </div>
          <Slider
            value={[parseFloat(localElement.attributes.opacity || "1")]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(vals) => {
              const newValue = vals[0];
              handleLocalUpdate({
                attributes: { ...localElement.attributes, opacity: newValue.toString() }
              });
            }}
          />
        </div>

        {/* Color & Style Attributes */}
        {!isTextElement(localElement) && !isImageElement(localElement) && (
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="grid grid-cols-2 gap-3">
              {/* Specialized Color Inputs */}
              {['fill', 'stroke'].map(attr => {
                if (localElement.attributes[attr] === undefined) return null;

                const value = localElement.attributes[attr] || "";
                const isGradient = value.startsWith("url(");
                return (
                  <div key={attr} className="space-y-1">
                    <Label className="text-xs text-white/60 capitalize">{attr}</Label>
                    <div className="flex gap-2 items-center">
                      <div className="relative w-8 h-8 rounded border border-white/20 overflow-hidden shrink-0 bg-white/5 bg-[url('/checker.png')] bg-[length:8px_8px]">
                        <div
                          className="absolute inset-0 w-full h-full"
                          style={{ background: value }}
                        />

                        {!isGradient && (
                          <input
                            type="color"
                            value={/^#[0-9A-F]{6}$/i.test(value) ? value : "#000000"}
                            onChange={(e) => handleLocalUpdate({
                              attributes: { ...localElement.attributes, [attr]: e.target.value }
                            })}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            title="Pick a color"
                          />
                        )}
                      </div>
                      <DebouncedInput
                        value={value}
                        onChange={(val: string | number) => handleLocalUpdate({
                          attributes: { ...localElement.attributes, [attr]: String(val) }
                        })}
                        className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0 text-xs h-8"
                        placeholder="none"
                      />
                    </div>
                  </div>
                );
              })}

              {/* Other Common Attributes */}
              {['stroke-width', 'font-size', 'font-family', 'letter-spacing', 'x', 'y', 'cx', 'cy', 'r', 'width', 'height', 'rx', 'ry', 'd'].map(attr => (
                localElement.attributes[attr] !== undefined && (
                  <div key={attr} className="space-y-1">
                    <Label className="text-xs text-white/60 capitalize">
                      {attr.replace('-', ' ')}
                    </Label>
                    <DebouncedInput
                      value={localElement.attributes[attr] || ""}
                      onChange={(val: string | number) => handleLocalUpdate({
                        attributes: { ...localElement.attributes, [attr]: String(val) }
                      })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0 text-xs h-8"
                    />
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

ElementEditor.displayName = "ElementEditor";

export default ElementEditor;
