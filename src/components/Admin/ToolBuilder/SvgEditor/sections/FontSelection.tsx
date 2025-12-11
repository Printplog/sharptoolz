import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Font } from "@/types";
import type { UseMutationResult } from "@tanstack/react-query";

interface FontSelectionProps {
  fonts: Font[];
  selectedFontIds: string[];
  onFontSelect: (fontId: string) => void;
  onFontRemove: (fontId: string) => void;
  fontUploadMutation: UseMutationResult<any, Error, FormData, unknown>;
}

export default function FontSelection({
  fonts,
  selectedFontIds,
  onFontSelect,
  onFontRemove,
  fontUploadMutation,
}: FontSelectionProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="template-fonts" className="text-sm font-medium">
        Fonts (Optional)
      </Label>
      <div className="space-y-3">
        <Select
          value=""
          onValueChange={(value) => {
            if (value && !selectedFontIds.includes(value)) {
              onFontSelect(value);
            }
          }}
        >
          <SelectTrigger className="w-full bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0">
            <SelectValue placeholder="Select fonts used in this template" />
          </SelectTrigger>
          <SelectContent className="bg-background border border-white/10 z-[999999]">
            {fonts.length === 0 ? (
              <SelectItem value="none" disabled className="text-white/60 italic">
                No fonts available. Upload a font first.
              </SelectItem>
            ) : (
              fonts
                .filter((font) => !selectedFontIds.includes(font.id))
                .map((font) => (
                  <SelectItem
                    key={font.id}
                    value={font.id}
                    className="text-white/90 hover:bg-white/5 focus:bg-white/5 focus:text-white/80"
                  >
                    {font.name}
                  </SelectItem>
                ))
            )}
          </SelectContent>
        </Select>
        {selectedFontIds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedFontIds.map((fontId) => {
              const font = fonts.find((f) => f.id === fontId);
              return (
                <div
                  key={fontId}
                  className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-md text-sm"
                >
                  <span>{font?.name || fontId}</span>
                  <button
                    type="button"
                    onClick={() => onFontRemove(fontId)}
                    className="text-white/60 hover:text-white"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {/* Font Upload */}
        <div className="border-t border-white/10 pt-3">
          <p className="text-xs text-white/60 mb-2">Need to upload a new font?</p>
          <input
            type="file"
            accept=".ttf,.otf,.woff,.woff2"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const formData = new FormData();
                formData.append('name', file.name.replace(/\.[^/.]+$/, ''));
                formData.append('font_file', file);
                fontUploadMutation.mutate(formData);
                e.target.value = '';
              }
            }}
            className="hidden"
            id="font-upload-editor"
            disabled={fontUploadMutation.isPending}
          />
          <label
            htmlFor="font-upload-editor"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-md text-sm cursor-pointer transition-colors"
          >
            {fontUploadMutation.isPending ? 'Uploading...' : '📤 Upload Font'}
          </label>
        </div>
      </div>
      <p className="text-xs text-white/50">
        Select fonts used in your SVG template. Fonts will be embedded in previews and downloads.
      </p>
    </div>
  );
}

