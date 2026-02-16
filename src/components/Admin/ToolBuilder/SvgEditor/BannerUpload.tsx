// BannerUpload component for uploading banner images
import { Label } from "@/components/ui/label";
import { LazyImage } from "@/components/LazyImage";

interface BannerUploadProps {
  bannerImage: string;
  onUpload: (file: File) => void;
}

export default function BannerUpload({ bannerImage, onUpload }: BannerUploadProps) {
  const handleBannerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onUpload(file);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        Banner Image
      </Label>
      <div className="relative">
        <input
          id="banner-upload"
          type="file"
          accept="image/*"
          onChange={handleBannerUpload}
          className="hidden"
          title="Upload banner image"
        />
        <label
          htmlFor="banner-upload"
          className="block w-full h-60 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-white/40 transition-colors overflow-hidden"
        >
          {bannerImage ? (
            <div className="relative w-full h-full group">
              <div className="w-full h-full overflow-auto custom-scrollbar">
                <LazyImage
                  src={bannerImage}
                  alt="Banner preview"
                  className="w-full max-w-none h-auto object-contain min-h-full"
                />
              </div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <div className="text-center text-white">
                  <div className="text-sm font-medium">Click to change banner</div>
                  <div className="text-xs opacity-80">Upload a new image</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white/60 hover:text-white/80 transition-colors">
              <div className="w-12 h-12 border-2 border-dashed border-current rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">Click to upload banner</div>
                <div className="text-xs opacity-80">Upload an image for this template</div>
              </div>
            </div>
          )}
        </label>
      </div>
    </div>
  );
}
