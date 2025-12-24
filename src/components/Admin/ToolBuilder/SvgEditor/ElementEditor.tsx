// ElementEditor component for editing individual SVG elements
import { forwardRef, useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw, RotateCw, Move, Minus, Plus } from "lucide-react";
import type { SvgElement } from "@/lib/utils/parseSvgElements";
import { toast } from "sonner";
import IdEditor from "./IdEditor/index";
import GenRuleBuilder from "./IdEditor/GenRuleBuilder";
import { DebouncedInput, DebouncedTextarea } from "@/components/ui/debounced-inputs";
import { useRef } from "react";
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
import { Save, Bookmark, Trash2, Loader2 } from "lucide-react";
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
}

const ElementEditor = forwardRef<HTMLDivElement, ElementEditorProps>(
  ({ element, index, onUpdate, isTextElement, isImageElement, allElements = [] }, ref) => {
    const [showGenBuilder, setShowGenBuilder] = useState(false);
    const lastUpdateRef = useRef<number>(0);
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Throttled update for frequent events (like sliders)
    // Ensures updates happen at most every 32ms (approx 30fps) but guarantees trailing update
    const throttledUpdate = (idx: number, updates: Partial<SvgElement>) => {
      const now = Date.now();
      const timeSinceLast = now - lastUpdateRef.current;
      const LIMIT = 32;

      if (timeSinceLast >= LIMIT) {
        if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
        onUpdate(idx, updates);
        lastUpdateRef.current = now;
      } else {
        // Schedule trailing update
        if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = setTimeout(() => {
           onUpdate(idx, updates);
           lastUpdateRef.current = Date.now();
        }, LIMIT - timeSinceLast);
      }
    };

    useEffect(() => {
      const id = element.id || "";
      const parts = id.split(".");

      // Focus ID editor if this element was just selected (optional UX)
      // We can use a ref for this if we want to be fancy.

      // If we have "... .gen .gen_XXX ..." collapse to "... .gen_XXX ..."
      if (parts.length >= 3 && parts[1] === "gen" && parts[2].startsWith("gen_")) {
        const normalizedParts = [parts[0], ...parts.slice(2)];
        const normalizedId = normalizedParts.join(".");

        if (normalizedId !== id) {
          onUpdate(index, { id: normalizedId });
        }
      }
    }, [element.id, index, onUpdate]);

    const baseId = element.id?.split(".")[0]?.replace(/_/g, " ") || `${element.tag} ${index + 1}`;
    
    // Check if this is a gen field
    const isGenField = element.id?.includes(".gen");
    const genRuleMatch = element.id?.match(/gen_(.+?)(?:\.|$)/);
    const currentGenRule = genRuleMatch ? genRuleMatch[1] : "";
    const MAX_GEN_RULE_PREVIEW = 40;
    const isLongGenRule = currentGenRule.length > MAX_GEN_RULE_PREVIEW;
    const previewGenRule = isLongGenRule
      ? `${currentGenRule.slice(0, MAX_GEN_RULE_PREVIEW)}...`
      : currentGenRule;
    const maxLengthMatch = element.id?.match(/max_(\d+)/);
    const maxLength = maxLengthMatch ? parseInt(maxLengthMatch[1]) : undefined;
    
    const handleGenRuleChange = (newRule: string) => {
      // Only touch the gen_ part of the ID, leave all other extensions (like max_) intact
      const parts = element.id?.split(".") || [];
      let replaced = false;

      const newParts = parts.map((p: string) => {
        if (p.startsWith("gen_")) {
          replaced = true;
          return `gen_${newRule}`;
        }
        return p;
      });

      // If there was no existing gen_ rule, append it as a new extension
      if (!replaced) {
        newParts.push(`gen_${newRule}`);
      }

      onUpdate(index, { id: newParts.join(".") });
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
        
        // 1. Update the image normally
        onUpdate(index, { 
          attributes: { 
            ...element.attributes, 
            href: base64,
            'xlink:href': base64 
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
    // --- Transform Logic (Rotate, Scale, Translate) ---
    const getTransform = () => {
      const style = element.attributes.style || "";
      const transformAttr = element.attributes.transform || "";
      const combined = `${style} ${transformAttr}`; // Check both for maximum discovery

      // 1. Try explicit functional notation first (translate, rotate, scale)
      const getVal = (regex: RegExp) => {
        const match = combined.match(regex);
        return match ? parseFloat(match[1]) : null;
      };

      let rotate = getVal(/rotate\s*\(\s*(-?\d+\.?\d*)/);
      let scale = getVal(/scale\s*\(\s*(-?\d+\.?\d*)/);
      let translateX = getVal(/translate\s*\(\s*(-?\d+\.?\d*)/); // Capture 1st arg
      // Fix regex to be less strict about closing parenthesis and handle units implicitly by parseFloat
      let translateY = getVal(/translate\s*\([^,]+,\s*(-?\d+\.?\d*)/); // Capture 2nd arg

      // 2. Fallback to matrix decomposition if explicit values are missing
      // matrix(a, b, c, d, e, f)
      if (rotate === null && scale === null && translateX === null) {
         const matrixMatch = combined.match(/matrix\s*\(([^)]+)\)/);
         if (matrixMatch) {
            const params = matrixMatch[1].split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n));
            if (params.length === 6) {
               const [a, b, , , e, f] = params;
               // Decompose
               translateX = e;
               translateY = f;
               // Scale = length of column vector (a, b)
               scale = Math.sqrt(a*a + b*b);
               // Rotation = atan2(b, a) in degrees
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
        setVariableName("");
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

    const updateTransform = (key: 'rotate' | 'scale' | 'translateX' | 'translateY', value: number, useThrottle = false) => {
      const newTransform = { ...currentTransform, [key]: value };
      
      let newStyle = element.attributes.style || "";
      
      // Ensure transform-box and origin are set for predictable transforms
      if (!newStyle.includes("transform-box")) newStyle = `transform-box: fill-box; ${newStyle}`;
      if (!newStyle.includes("transform-origin")) newStyle = `transform-origin: center; ${newStyle}`;

      // Construct transform string
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

      const updateFn = useThrottle ? throttledUpdate : onUpdate;
      
      updateFn(index, {
        attributes: {
          ...element.attributes,
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
        <div className="text-sm font-medium text-white/80 capitalize">
          {baseId}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            ID
          </Label>
          <IdEditor
            value={element.id || ""}
            onChange={(newId) => onUpdate(index, { id: newId })}
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
              defaultTextContent={element.innerText || ""}
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
            value={element.attributes['data-helper'] || ""}
            onChange={(value: string) => onUpdate(index, { 
              attributes: { ...element.attributes, 'data-helper': value }
            })}
            rows={2}
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0 text-sm"
          />
        </div>

        {isTextElement(element) && (
          <div className="space-y-2">
            <Label htmlFor={`text-${index}`} className="text-sm font-medium">
              Text Content
            </Label>
            <DebouncedTextarea
              id={`text-${index}`}
              placeholder="Enter text content"
              value={element.innerText || ""}
              onChange={(value: string) => onUpdate(index, { innerText: value })}
              rows={3} 
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0"
            />
          </div>
        )}

        {isImageElement(element) && (
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
                  onUpdate(index, {
                    attributes: {
                      ...element.attributes,
                      style: (element.attributes.style || "").replace(/transform:[^;]+;?/, "").replace(/transform-box:[^;]+;?/, "").replace(/transform-origin:[^;]+;?/, "").replace(/;;/g, ";"),
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
                  <Input
                      type="number"
                      value={currentTransform.translateX || 0}
                      onChange={(e) => updateTransform('translateX', parseFloat(e.target.value) || 0)}
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
                  <Input
                      type="number"
                      value={currentTransform.translateY || 0}
                      onChange={(e) => updateTransform('translateY', parseFloat(e.target.value) || 0)}
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
                    <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={currentTransform.scale}
                        onChange={(e) => updateTransform('scale', parseFloat(e.target.value) || 1)}
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
                  onValueChange={(vals) => updateTransform('scale', vals[0], true)}
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
                      <Input
                        type="number"
                        value={Math.round(currentTransform.rotate)}
                        onChange={(e) => updateTransform('rotate', parseFloat(e.target.value) || 0)}
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
                    onValueChange={(vals) => updateTransform('rotate', vals[0], true)}
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
            <span className="text-xs text-white/60">{Math.round((parseFloat(element.attributes.opacity || "1") * 100))}%</span>
          </div>
          <Slider
            value={[parseFloat(element.attributes.opacity || "1")]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(vals) => {
                const newValue = vals[0];
                throttledUpdate(index, {
                    attributes: { ...element.attributes, opacity: newValue.toString() }
                });
            }}
          />
        </div>

        {/* Color & Style Attributes */}
        {!isTextElement(element) && !isImageElement(element) && (
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="grid grid-cols-2 gap-3">
              {/* Specialized Color Inputs */}
              {['fill', 'stroke'].map(attr => {
                 if (element.attributes[attr] === undefined) return null;
                 
                 const value = element.attributes[attr] || "";
                 // Check if value is potentially a color (hex, rgb, named) - simple heuristic
                 // If it's a url(...) (gradient/pattern), we still show the input but maybe disable the picker preview?
                 const isGradient = value.startsWith("url(");
                                 return (
                  <div key={attr} className="space-y-1">
                     <Label className="text-xs text-white/60 capitalize">{attr}</Label>
                     <div className="flex gap-2 items-center">
                        <div className="relative w-8 h-8 rounded border border-white/20 overflow-hidden shrink-0 bg-white/5 bg-[url('/checker.png')] bg-[length:8px_8px]">
                           {/* Show actual color/gradient if possible */}
                           <div 
                              className="absolute inset-0 w-full h-full" 
                              style={{ background: value }} 
                           />
                           
                           {/* Native color picker - only works well for simple colors, but we allow it to write Hex values */}
                           {!isGradient && (
                             <input 
                                type="color" 
                                value={/^#[0-9A-F]{6}$/i.test(value) ? value : "#000000"}
                                onChange={(e) => onUpdate(index, { 
                                  attributes: { ...element.attributes, [attr]: e.target.value } 
                                })}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                title="Pick a color"
                             />
                           )}
                        </div>
                        <DebouncedInput 
                           value={value} 
                           onChange={(val: string | number) => onUpdate(index, { 
                              attributes: { ...element.attributes, [attr]: String(val) } 
                           })}
                           className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0 text-xs h-8"
                           placeholder="none"
                        />
                     </div>
                  </div>
                 );
              })}

              {/* Other Common Attributes */}
              {['stroke-width', 'font-size', 'font-family', 'letter-spacing'].map(attr => (
                element.attributes[attr] !== undefined && (
                  <div key={attr} className="space-y-1">
                    <Label className="text-xs text-white/60 capitalize">
                      {attr.replace('-', ' ')}
                    </Label>
                    <DebouncedInput
                      value={element.attributes[attr] || ""}
                      onChange={(val: string | number) => onUpdate(index, { 
                        attributes: { ...element.attributes, [attr]: String(val) }
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
