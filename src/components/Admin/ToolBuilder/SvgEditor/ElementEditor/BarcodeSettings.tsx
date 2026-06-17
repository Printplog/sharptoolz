import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SYMBOLOGIES, SYMBOLOGY_CATEGORIES } from "@/lib/utils/barcodeSymbologies";
import QRCodeBuilder from "../IdEditor/QRCodeBuilder";
import type { SvgElement } from "@/lib/utils/parseSvgElements";

interface BarcodeSettingsProps {
  currentSymbologyCategory: string;
  handleBarcodeCategoryChange: (cat: string) => void;
  currentSymbology: string;
  handleSymbologyChange: (sym: string) => void;
  previewBarcodeRule: string;
  currentBarcodeRule: string;
  handleBarcodeContentRuleChange: (rule: string) => void;
  allElements: SvgElement[];
  maxLength?: number;
  showGenBuilder: boolean;
  setShowGenBuilder: (open: boolean) => void;
  currentFieldValues: Record<string, string>;
  localElement: SvgElement;
}

export const BarcodeSettings = ({
  currentSymbologyCategory,
  handleBarcodeCategoryChange,
  currentSymbology,
  handleSymbologyChange,
  previewBarcodeRule,
  currentBarcodeRule,
  handleBarcodeContentRuleChange,
  allElements,
  maxLength,
  showGenBuilder,
  setShowGenBuilder,
  currentFieldValues,
  localElement,
}: BarcodeSettingsProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Barcode Symbology</Label>
        <div className="grid grid-cols-2 gap-2">
          {/* Main type (category) — choose this first */}
          <Select value={currentSymbologyCategory} onValueChange={handleBarcodeCategoryChange}>
            <SelectTrigger className="w-full bg-white/10 border-white/20 text-white text-sm h-9">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-black/95 border-white/20 text-white">
              {SYMBOLOGY_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat} className="text-sm">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Sub-type (specific symbology) within the chosen category */}
          <Select value={currentSymbology} onValueChange={handleSymbologyChange}>
            <SelectTrigger className="w-full bg-white/10 border-white/20 text-white text-sm h-9">
              <SelectValue placeholder="Symbology" />
            </SelectTrigger>
            <SelectContent className="bg-black/95 border-white/20 text-white max-h-64">
              {SYMBOLOGIES.filter((s) => s.category === currentSymbologyCategory).map((s) => (
                <SelectItem key={s.bcid} value={s.bcid} className="text-sm">
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-[11px] text-white/40">
          Stored as <span className="font-mono text-white/60">.barcode_({currentSymbology})</span>. Content comes from the element text, the user, or the rule below.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Barcode Content (optional)</Label>
        <div className="flex gap-2">
          <Input
            value={previewBarcodeRule}
            readOnly
            placeholder="Static text, or build rows…"
            className="bg-white/5 text-white/60 font-mono text-xs border-white/20 focus-visible:ring-0"
          />
          <QRCodeBuilder
            value={currentBarcodeRule}
            onChange={handleBarcodeContentRuleChange}
            allElements={allElements}
            maxLength={maxLength}
            open={showGenBuilder}
            onOpenChange={setShowGenBuilder}
            currentFieldValues={currentFieldValues}
            defaultTextContent={localElement.innerText || ""}
            barcodeSymbology={currentSymbology}
            trigger={
              <Button
                variant="outline"
                className="shrink-0 bg-white/5 border-white/20 hover:bg-white/10 gap-2 rounded-full"
              >
                <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs">Builder</span>
              </Button>
            }
          />
        </div>
        <p className="text-[11px] text-white/40">
          Add rows — each becomes a new line in the barcode (great for 2D codes like PDF417 / Data Matrix). Leave empty to use the element's text or let the user type it.
        </p>
      </div>
    </>
  );
};
