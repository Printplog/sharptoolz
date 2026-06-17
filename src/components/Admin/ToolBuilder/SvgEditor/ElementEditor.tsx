// ElementEditor component for editing individual SVG elements
import { forwardRef, useEffect, useState, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import type { SvgElement } from "@/lib/utils/parseSvgElements";
import { toast } from "sonner";
import IdEditor from "./IdEditor/index";
import GenRuleBuilder from "./IdEditor/GenRuleBuilder";
import QRCodeBuilder from "./IdEditor/QRCodeBuilder";
import { DebouncedTextarea } from "@/components/ui/debounced-inputs";
import { validateSvgId } from "@/lib/utils/svgIdValidator";
import { DEFAULT_SYMBOLOGY, getSymbology, SYMBOLOGIES } from "@/lib/utils/barcodeSymbologies";
import { readBarcodeFromId, writeBarcodeToId } from "@/lib/utils/barcodeId";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTransformVariables,
  createTransformVariable,
  deleteTransformVariable
} from "@/api/apiEndpoints";
import type { TransformVariable, SvgPatch } from "@/types";

// Import modular sub-components and hooks with exact-UI preservation
import { BarcodeSettings } from "./ElementEditor/BarcodeSettings";
import { TextSettings } from "./ElementEditor/TextSettings";
import { ImageUploadSettings } from "./ElementEditor/ImageUploadSettings";
import { TransformSettings } from "./ElementEditor/TransformSettings";
import { useElementTransform } from "./ElementEditor/useElementTransform";

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
          } catch {
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
    }, [element.internalId, onDirtyChange]);

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

    // Use Custom Hook for Coordinates parsing and updating
    const { currentTransform, updateTransform } = useElementTransform(localElement, handleLocalUpdate, allElements);

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

    const currentId = localElement.id || "";
    const baseId = currentId.split(".")[0]?.replace(/_/g, " ") || `${localElement.tag} ${index + 1}`;
    const isQrField = currentId.includes(".qrcode");
    const isBarcodeField = currentId.includes(".barcode");
    const isGenField = (currentId.includes(".gen") || isQrField) && !isBarcodeField;
    const barcodeCarrier = isBarcodeField ? readBarcodeFromId(currentId) : null;
    const currentSymbology = barcodeCarrier?.symbology || DEFAULT_SYMBOLOGY;
    const currentBarcodeRule = barcodeCarrier ? (barcodeCarrier.isAuto ? "AUTO:" : "") + barcodeCarrier.rule : "";
    const previewBarcodeRule = currentBarcodeRule.length > 40 ? `${currentBarcodeRule.slice(0, 40)}...` : currentBarcodeRule;
    const currentSymbologyCategory = getSymbology(currentSymbology)?.category ?? "Linear";
    
    const genRuleMatch = currentId.match(/(?:gen_|qrcode_)(.*?)(?=\.track_|\.tracking_id|\.link_|\.grayscale|\.hide_|\.mode|$)/);
    const currentGenRule = genRuleMatch ? genRuleMatch[1] : "";
    const previewGenRule = currentGenRule.length > 40 ? `${currentGenRule.slice(0, 40)}...` : currentGenRule;
    const maxLengthMatch = currentId.match(/max_(\d+)/);
    const maxLength = maxLengthMatch ? parseInt(maxLengthMatch[1]) : undefined;
    const isUploadField = currentId.includes(".upload");
    const currentImageUrl = localElement.attributes.href || localElement.attributes['xlink:href'] || "";

    const handleGenRuleChange = (newRule: string) => {
      const currentId = localElement.id || "";
      const isBarcode = currentId.includes(".barcode");
      const isQr = !isBarcode && (currentId.includes(".qrcode") || localElement.tag === "image");
      const rulePrefix = isQr ? "qrcode_" : "gen_";
      const basePrefix = isQr ? "qrcode" : "gen";

      let prefixPart = currentId;
      let suffixPart = "";

      const lateModifiers = [".track_", ".tracking_id", ".link_", ".grayscale", ".hide_", ".mode"];
      let lateModIndex = -1;
      for (const mod of lateModifiers) {
        const idx = currentId.indexOf(mod);
        if (idx !== -1 && (lateModIndex === -1 || idx < lateModIndex)) {
          lateModIndex = idx;
        }
      }

      if (lateModIndex !== -1) {
        prefixPart = currentId.substring(0, lateModIndex);
        suffixPart = currentId.substring(lateModIndex);
      }

      const typeIndex = prefixPart.indexOf(`.${basePrefix}`);
      if (typeIndex !== -1) {
        prefixPart = prefixPart.substring(0, typeIndex);
      }

      const newId = `${prefixPart}.${rulePrefix}${newRule}${suffixPart}`;
      handleLocalUpdate({ id: newId });
    };

    const handleBarcodeCategoryChange = (cat: string) => {
      const first = SYMBOLOGIES.find((s) => s.category === cat);
      if (first && first.bcid !== currentSymbology) {
        handleLocalUpdate({ id: writeBarcodeToId(localElement.id || "", { symbology: first.bcid }) });
      }
    };

    const handleSymbologyChange = (newSym: string) => {
      handleLocalUpdate({ id: writeBarcodeToId(localElement.id || "", { symbology: newSym }) });
    };

    const handleBarcodeContentRuleChange = (newRule: string) => {
      let isAuto = false;
      let rule = newRule;
      if (rule.startsWith("AUTO:")) {
        isAuto = true;
        rule = rule.slice(5);
      }
      handleLocalUpdate({ id: writeBarcodeToId(localElement.id || "", { rule, isAuto }) });
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
            <Label className="text-sm font-medium">
              {localElement.id?.includes(".qrcode") ? "QR Content Rule" : "Generation Rule"}
            </Label>
            <div className="flex gap-2">
              <Input value={previewGenRule} readOnly className="bg-white/5 text-white/60 font-mono text-xs border-white/20 focus-visible:ring-0" />
              {localElement.id?.includes(".qrcode") ? (
                <QRCodeBuilder
                  value={currentGenRule}
                  onChange={handleGenRuleChange}
                  allElements={allElements}
                  maxLength={maxLength}
                  open={showGenBuilder}
                  onOpenChange={setShowGenBuilder}
                  currentFieldValues={currentFieldValues}
                  trigger={
                    <Button variant="outline" className="shrink-0 bg-white/5 border-white/20 hover:bg-white/10 gap-2 rounded-full">
                      <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-xs">QR Builder</span>
                    </Button>
                  }
                />
              ) : (
                <GenRuleBuilder
                  value={currentGenRule}
                  onChange={handleGenRuleChange}
                  allElements={allElements}
                  maxLength={maxLength}
                  open={showGenBuilder}
                  onOpenChange={setShowGenBuilder}
                  currentFieldValues={currentFieldValues}
                  defaultTextContent={localElement.innerText || ""}
                  isQr={false}
                  trigger={
                    <Button variant="outline" className="shrink-0 bg-white/5 border-white/20 hover:bg-white/10 gap-2 rounded-full">
                      <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-xs">Builder</span>
                    </Button>
                  }
                />
              )}
            </div>
          </div>
        )}

        {isBarcodeField && (
          <BarcodeSettings
            currentSymbologyCategory={currentSymbologyCategory}
            handleBarcodeCategoryChange={handleBarcodeCategoryChange}
            currentSymbology={currentSymbology}
            handleSymbologyChange={handleSymbologyChange}
            previewBarcodeRule={previewBarcodeRule}
            currentBarcodeRule={currentBarcodeRule}
            handleBarcodeContentRuleChange={handleBarcodeContentRuleChange}
            allElements={allElements}
            maxLength={maxLength}
            showGenBuilder={showGenBuilder}
            setShowGenBuilder={setShowGenBuilder}
            currentFieldValues={currentFieldValues}
            localElement={localElement}
          />
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

        <TextSettings
          localElement={localElement}
          handleLocalUpdate={handleLocalUpdate}
          isTextElement={isTextElement}
        />

        <ImageUploadSettings
          localElement={localElement}
          isUploadField={isUploadField}
          currentImageUrl={currentImageUrl}
          index={index}
          handleImageUpload={handleImageUpload}
          handleLocalUpdate={handleLocalUpdate}
          isImageElement={isImageElement}
        />

        {(!isGenField || isQrField) && (
          <TransformSettings
            index={index}
            currentTransform={currentTransform}
            updateTransform={updateTransform}
            variables={variables}
            saveVariableMutation={saveVariableMutation}
            deleteVariableMutation={deleteVariableMutation}
          />
        )}
      </div>
    );
  }
);

ElementEditor.displayName = "ElementEditor";
export default ElementEditor;
