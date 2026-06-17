import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, X, ImageIcon } from "lucide-react";
import type { SvgElement } from "@/lib/utils/parseSvgElements";

interface ImageUploadSettingsProps {
  localElement: SvgElement;
  isUploadField: boolean;
  currentImageUrl: string;
  index: number;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleLocalUpdate: (updates: Partial<SvgElement>) => void;
  isImageElement: (el: SvgElement) => boolean;
}

export const ImageUploadSettings = ({
  localElement,
  isUploadField,
  currentImageUrl,
  index,
  handleImageUpload,
  handleLocalUpdate,
  isImageElement,
}: ImageUploadSettingsProps) => {
  if (!isImageElement(localElement) && !isUploadField) return null;

  return (
    <div className="space-y-3 border-t border-white/5 pt-4">
      <Label className="text-sm font-medium flex items-center gap-2">
        <Upload className="w-3.5 h-3.5 text-primary" />
        Upload Image
      </Label>

      <div className="group relative">
        {currentImageUrl ? (
          <div className="relative aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/10 transition-all group-hover:border-white/20">
            <img src={currentImageUrl} alt="Preview" className="w-full h-full object-contain" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                variant="glass"
                size="sm"
                onClick={() => document.getElementById(`image-upload-${index}`)?.click()}
                className="h-8 text-[10px] font-bold rounded-full"
              >
                <ImageIcon className="w-3.5 h-3.5 mr-2" />
                Replace
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  handleLocalUpdate({
                    attributes: { ...localElement.attributes, href: "", "xlink:href": "" },
                  })
                }
                className="h-8 w-8 text-white/50 hover:text-red-400 hover:bg-red-400/10 rounded-full"
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
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Click to upload
            </div>
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

      <p className="text-[10px] text-white/20 italic">Supports JPG, PNG, SGV. Max 5MB recommended.</p>
    </div>
  );
};
