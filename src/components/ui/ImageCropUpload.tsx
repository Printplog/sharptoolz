import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, RotateCcw, RotateCw, Check, Loader2, Zap, Sparkles, Eye, RefreshCcw } from "lucide-react";
import { annotationDetector } from "@/lib/utils/annotationDetector";
import useToolStore from "@/store/formStore";
import { removeBackground } from "@/api/apiEndpoints";
import { Client } from "@gradio/client";
import { toast } from "sonner";
import errorMessage from "@/lib/utils/errorMessage";
import "react-image-crop/dist/ReactCrop.css";
import { LazyImage } from "@/components/LazyImage";
import { getSvgElementDimensions } from "@/lib/utils/svgDimensions";

interface ImageCropUploadProps {
  fieldId: string;
  fieldName: string;
  currentValue: string;
  onImageSelect: (id: string, dataUrl: string, rotation?: number) => void;
  svgElementId?: string;
  disabled?: boolean;
  requiresGrayscale?: boolean;
  grayscaleIntensity?: number;
}

export default function ImageCropUpload({
  fieldId,
  fieldName,
  currentValue,
  onImageSelect,
  svgElementId,
  disabled = false,
  requiresGrayscale = false,
  grayscaleIntensity = 100,
}: ImageCropUploadProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [image, setImage] = useState<string | null>(() => currentValue || null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(() => currentValue || null);

  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [rotation, setRotation] = useState(0);
  const [annotationResult, setAnnotationResult] = useState<any>(null);

  // Caching for background removal
  const [cachedBgRemovedImage, setCachedBgRemovedImage] = useState<string | null>(null);
  const [cachedFreeBgRemoved, setCachedFreeBgRemoved] = useState<string | null>(null);

  // Background removal state
  const [bgRemovedImage, setBgRemovedImage] = useState<string | null>(null);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [activeTab, setActiveTab] = useState<'crop' | 'remove-bg'>('crop');
  const [showOriginal, setShowOriginal] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const { svgRaw } = useToolStore();

  const applyGrayscaleToImage = useCallback(
    (imageSrc: string): Promise<string> => {
      if (!requiresGrayscale) return Promise.resolve(imageSrc);
      const alpha = Math.max(0, Math.min(100, grayscaleIntensity ?? 100)) / 100;
      if (alpha === 0) return Promise.resolve(imageSrc);

      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) return reject(new Error("2D context failed"));
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i], g = data[i + 1], b = data[i + 2];
              const gray = 0.299 * r + 0.587 * g + 0.114 * b;
              data[i] = r + (gray - r) * alpha;
              data[i + 1] = g + (gray - g) * alpha;
              data[i + 2] = b + (gray - b) * alpha;
            }
            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          } catch (e) { reject(e); }
        };
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = imageSrc;
      });
    },
    [requiresGrayscale, grayscaleIntensity]
  );

  // Sync with store - only when dialog is closed and values actually differ
  useEffect(() => {
    if (isDialogOpen) return;

    if (currentValue && currentValue !== image) {
      if (currentValue.startsWith('data:image/') || currentValue.startsWith('blob:') || currentValue.startsWith('/')) {
        setImage(currentValue);
        setOriginalImage(currentValue);
      }
    } else if (!currentValue && image) {
      setImage(null);
      setOriginalImage(null);
    }
  }, [currentValue, isDialogOpen]); // Removed 'image' from deps to avoid self-triggers

  useEffect(() => {
    const analyze = async () => {
      if (!svgElementId || !svgRaw) return;
      try {
        const result = await annotationDetector.findAndAnalyzeDefaultImage(svgElementId, svgRaw);
        if (result) {
          setAnnotationResult(result);
        }
      } catch { /* silent */ }
    };
    analyze();
  }, [svgElementId, svgRaw]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const cropWidth = width * 0.8;
    const cropHeight = height * 0.8;

    setCrop({
      unit: "px",
      x: (width - cropWidth) / 2,
      y: (height - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight,
    });
  }, []);

  const getCroppedImg = useCallback(
    async (imageSrc: string, pixelCrop: PixelCrop): Promise<string> => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      return new Promise((resolve, reject) => {
        image.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx || !imgRef.current) return reject(new Error("Context/Ref failed"));

          const scaleX = image.width / imgRef.current.width;
          const scaleY = image.height / imgRef.current.height;

          // If we have annotation result, stretch to its content dimensions
          if (annotationResult && annotationResult.content?.width && annotationResult.content?.height) {
            canvas.width = annotationResult.content.width;
            canvas.height = annotationResult.content.height;
            ctx.drawImage(
              image,
              pixelCrop.x * scaleX,
              pixelCrop.y * scaleY,
              pixelCrop.width * scaleX,
              pixelCrop.height * scaleY,
              0,
              0,
              canvas.width,
              canvas.height
            );
          } else {
            // Fallback: Check for SVG element dimensions
            const dims = svgElementId ? getSvgElementDimensions(svgElementId) : null;
            if (dims && dims.width > 0 && dims.height > 0) {
              canvas.width = dims.width;
              canvas.height = dims.height;
              ctx.drawImage(
                image,
                pixelCrop.x * scaleX,
                pixelCrop.y * scaleY,
                pixelCrop.width * scaleX,
                pixelCrop.height * scaleY,
                0,
                0,
                canvas.width,
                canvas.height
              );
            } else {
              // Final Fallback: use the actual crop dimensions
              canvas.width = pixelCrop.width * scaleX;
              canvas.height = pixelCrop.height * scaleY;
              ctx.drawImage(
                image,
                pixelCrop.x * scaleX,
                pixelCrop.y * scaleY,
                pixelCrop.width * scaleX,
                pixelCrop.height * scaleY,
                0,
                0,
                canvas.width,
                canvas.height
              );
            }
          }
          resolve(canvas.toDataURL("image/png", 1.0));
        };
        image.src = imageSrc;
      });
    },
    [svgElementId, annotationResult]
  );

  const handlePaidBgRemoval = async () => {
    if (!originalFile) return;
    if (cachedBgRemovedImage) {
      setBgRemovedImage(cachedBgRemovedImage);
      return;
    }
    setIsRemovingBackground(true);
    try {
      const result = await removeBackground(originalFile);
      if (result.success && result.image) {
        setCachedBgRemovedImage(result.image);
        setBgRemovedImage(result.image);
        toast.success("Background removed ✨");
      }
    } catch (e) { toast.error(errorMessage(e as Error)); }
    finally { setIsRemovingBackground(false); }
  };

  const handleFreeBgRemoval = async () => {
    if (!originalFile) return;
    if (cachedFreeBgRemoved) {
      setBgRemovedImage(cachedFreeBgRemoved);
      return;
    }
    setIsRemovingBackground(true);
    try {
      const app = await Client.connect("not-lain/background-removal");
      const result = await app.predict("/image", { image: new Blob([originalFile], { type: originalFile.type }) });
      const resultData = result.data as any;
      if (resultData?.[0]?.[1]?.url) {
        const response = await fetch(resultData[0][1].url);
        const blob = await response.blob();
        const base64 = await new Promise<string>((res) => {
          const r = new FileReader();
          r.onloadend = () => res(r.result as string);
          r.readAsDataURL(blob);
        });
        setCachedFreeBgRemoved(base64);
        setBgRemovedImage(base64);
        toast.success("Background removed (Free) ✨");
      }
    } catch (e) { toast.error(errorMessage(e as Error)); }
    finally { setIsRemovingBackground(false); }
  };

  const handleConfirmCrop = async () => {
    if (!image || !completedCrop) return;
    try {
      const cropped = await getCroppedImg(image, completedCrop);
      const processed = await applyGrayscaleToImage(cropped);
      setIsDialogOpen(false);
      onImageSelect(fieldId, processed, annotationResult?.rotation || rotation);
      setOriginalImage(null);
      setOriginalFile(null);
      setCrop(undefined);
      setCompletedCrop(undefined);
      setBgRemovedImage(null);
    } catch (e) { console.error(e); }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setOriginalFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setOriginalImage(dataUrl);
        setImage(dataUrl);
        setRotation(0);
        setBgRemovedImage(null);
        setActiveTab('crop');
        setIsDialogOpen(true);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    disabled: disabled || isDialogOpen,
    multiple: false,
  });

  return (
    <div className="space-y-2 w-full">
      {fieldName && (
        <label htmlFor={fieldId} className="text-sm font-medium text-white">
          {fieldName}
        </label>
      )}

      <div className="relative">
        <div
          {...getRootProps()}
          className={`block w-full h-40 border-2 border-dashed rounded-lg transition-colors overflow-hidden ${disabled
            ? "border-white/10 bg-white/5 cursor-not-allowed opacity-50"
            : isDragActive
              ? "border-primary/50 bg-primary/5 cursor-pointer"
              : "border-white/20 cursor-pointer hover:border-white/40"
            }`}
        >
          <input {...getInputProps()} />
          {!currentValue ? (
            <div className="flex flex-col items-center justify-center h-full text-white/60 hover:text-white/80 transition-colors">
              <div className="w-12 h-12 border-2 border-dashed border-current rounded-full flex items-center justify-center mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">{isDragActive ? "Drop here" : "Click to add image"}</div>
                <div className="text-xs opacity-80">Upload or drag your image here</div>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full group">
              <div className="w-full h-full overflow-auto custom-scrollbar">
                <LazyImage src={currentValue} alt={fieldName} className="w-full max-w-none h-auto object-contain min-h-full" />
              </div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <div className="text-center text-white">
                  <div className="text-sm font-medium">Click to change image</div>
                  <div className="text-xs opacity-80">Upload a new image</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {currentValue && (
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); setIsDialogOpen(true); }}
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              disabled={disabled}
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Adjust
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onImageSelect(fieldId, ""); }}
              className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
              disabled={disabled}
            >
              Remove
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] h-[90vh] flex flex-col bg-[#0f1620] border-white/10 p-0 rounded-[2.5rem] shadow-2xl overflow-hidden">
          <DialogHeader className="p-6 pb-2 border-b border-white/5 flex-shrink-0">
            <DialogTitle className="text-xl font-fancy font-black text-white italic uppercase tracking-tighter">Adjust <span className="text-primary">Image</span></DialogTitle>
          </DialogHeader>

          {image && (
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="flex-1 flex flex-col min-h-0">
              <div className="px-6 py-4 flex-shrink-0">
                <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl h-auto flex items-center w-fit">
                  <TabsTrigger value="crop" className="rounded-lg px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white/70 data-[state=active]:bg-primary data-[state=active]:text-black">Crop & Frame</TabsTrigger>
                  <TabsTrigger value="remove-bg" className="rounded-lg px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white/70 data-[state=active]:bg-primary data-[state=active]:text-black">Bg Removal</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="crop" className="flex-1 overflow-y-auto px-6 pb-24 custom-scrollbar outline-none">
                <div className="space-y-6">
                  {/* Controls Header */}
                  <div className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/10 rounded-2xl shadow-inner">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <RotateCcw className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Adjust Image</span>
                        <span className="text-[9px] font-medium text-white/40">Drag to crop • Rotate to level</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => setRotation(r => r - 90)} variant="outline" size="sm" className="h-10 w-10 p-0 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl transition-all">
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => setRotation(r => r + 90)} variant="outline" size="sm" className="h-10 w-10 p-0 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl transition-all">
                        <RotateCw className="h-4 w-4" />
                      </Button>
                      <div className="w-[1px] h-10 bg-white/10 mx-1" />
                      <Button
                        onClick={() => {
                          setRotation(0);
                          setCrop(undefined);
                          if (imgRef.current) onImageLoad({ currentTarget: imgRef.current } as any);
                        }}
                        variant="outline"
                        size="sm"
                        className="h-10 px-4 bg-white/5 border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 rounded-xl"
                      >
                        <RefreshCcw className="h-3.5 w-3.5 mr-2" />
                        Reset
                      </Button>
                    </div>
                  </div>

                  {/* Cropper Area */}
                  <div className="bg-black/40 border border-white/5 rounded-3xl p-8 flex items-center justify-center min-h-[450px] relative overflow-hidden group shadow-2xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,79,24,0.05)_0%,transparent_70%)] pointer-events-none" />

                    <ReactCrop
                      crop={crop}
                      onChange={c => setCrop(c)}
                      onComplete={c => setCompletedCrop(c)}
                      keepSelection
                      className="max-w-full"
                    >
                      <img
                        ref={imgRef}
                        alt="Crop Preview"
                        src={image}
                        className="max-w-full h-auto rounded-lg shadow-2xl transition-transform duration-300 ease-out"
                        style={{ transform: `rotate(${rotation}deg)` }}
                        onLoad={onImageLoad}
                        crossOrigin="anonymous"
                      />
                    </ReactCrop>

                    {!image && (
                      <div className="flex flex-col items-center gap-3 text-white/20">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Loading Editor...</span>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="remove-bg" className="flex-1 overflow-y-auto px-6 pb-24 custom-scrollbar outline-none">
                {!bgRemovedImage ? (
                  <div className="flex flex-col items-center justify-center space-y-10 py-12">
                    <div className="text-center space-y-3">
                      <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Choose Removal <span className="text-primary">Method</span></h3>
                      <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest">AI-powered background removal for your uploads</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 w-full max-w-2xl px-4">
                      {/* Professional Method */}
                      <button
                        onClick={handlePaidBgRemoval}
                        disabled={isRemovingBackground}
                        className="group relative border border-white/10 bg-white/[0.03] rounded-2xl p-5 hover:border-primary/50 text-left disabled:opacity-50 transition-all shadow-xl hover:shadow-primary/5"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Zap className="h-5 w-5 text-primary" />
                          </div>
                          <span className="bg-primary/10 text-primary text-[8px] px-2 py-0.5 rounded-full font-black uppercase border border-primary/20">Best Quality</span>
                        </div>
                        <h4 className="font-black text-white text-sm uppercase italic tracking-tighter mb-1">Professional</h4>
                        <p className="text-[10px] text-white/40 leading-relaxed">
                          3-5 seconds • Neural Precision.<br />
                          Charged at <span className="text-primary font-bold">$0.20</span> per use.
                        </p>
                        {isRemovingBackground && <Loader2 className="w-4 h-4 animate-spin text-primary mt-3" />}
                      </button>

                      {/* Free Method */}
                      <button
                        onClick={handleFreeBgRemoval}
                        disabled={isRemovingBackground}
                        className="group relative border border-white/10 bg-white/[0.03] rounded-2xl p-5 hover:border-green-400/50 text-left disabled:opacity-50 transition-all shadow-xl hover:shadow-green-400/5"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-10 h-10 rounded-xl bg-green-400/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Sparkles className="h-5 w-5 text-green-400" />
                          </div>
                          <span className="bg-green-400/10 text-green-400 text-[8px] px-2 py-0.5 rounded-full font-black uppercase border border-green-400/20">Unlimited</span>
                        </div>
                        <h4 className="font-black text-white text-sm uppercase italic tracking-tighter mb-1">Free</h4>
                        <p className="text-[10px] text-white/40 leading-relaxed">
                          10-15 seconds • Good Quality.<br />
                          Completely <span className="text-green-400 font-bold">FREE</span> to use.
                        </p>
                        {isRemovingBackground && <Loader2 className="w-4 h-4 animate-spin text-green-400 mt-3" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl space-y-4">
                      <div className="flex gap-3">
                        <Button
                          onClick={() => setShowOriginal(!showOriginal)}
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-white/5 border-white/10 text-white h-12 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {showOriginal ? "View Processed" : "View Original"}
                        </Button>
                        <Button
                          onClick={() => { setImage(bgRemovedImage); setActiveTab('crop'); }}
                          size="sm"
                          className="flex-1 bg-primary text-black h-12 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:bg-primary/90"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Apply removal
                        </Button>
                      </div>
                      <Button
                        onClick={() => { setBgRemovedImage(null); setShowOriginal(false); }}
                        variant="outline"
                        size="sm"
                        className="w-full bg-white/5 border-white/10 text-white h-12 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Try another method
                      </Button>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-3xl p-8 flex items-center justify-center min-h-[450px] relative overflow-hidden group shadow-2xl">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,79,24,0.05)_0%,transparent_70%)] pointer-events-none" />
                      <LazyImage src={(showOriginal ? originalImage : bgRemovedImage) || ''} alt="Preview" className="max-w-full h-auto rounded-xl shadow-2xl" />

                      <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/60 text-[8px] font-black uppercase tracking-widest text-white px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                        {showOriginal ? (
                          <><Eye className="w-3 h-3 text-white/50" /> Original</>
                        ) : (
                          <><Check className="w-3 h-3 text-green-400" /> Processed</>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="px-8 py-6 flex-shrink-0 border-t border-white/5 bg-[#0f1620] gap-3 z-50">
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1 bg-white/5 border-white/10 text-white h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Discard</Button>
            <Button type="button" onClick={handleConfirmCrop} disabled={!completedCrop || isRemovingBackground} className="flex-1 bg-primary text-black h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:bg-primary/90 transition-all"><Check className="h-3.5 w-3.5 mr-2" />Apply Crop</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}