import * as React from "react";
import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Dialog as ShadcnDialog, DialogContent as ShadcnDialogContent } from "@/components/ui/dialog";
import { Upload, Check, Loader2, Sparkles, RefreshCcw } from "lucide-react";
import { annotationDetector } from "@/lib/utils/annotationDetector";
import useToolStore from "@/store/formStore";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { removeBackground } from "@/api/apiEndpoints";
import { LazyImage } from "@/components/LazyImage";
import ImageCropper, { type ImageCropperRef } from "./ImageCropper";

interface ImageCropUploadProps {
  fieldId: string;
  fieldName: string;
  currentValue: string;
  onImageSelect: (id: string, dataUrl: string, rotation?: number) => void;
  svgElementId?: string;
  disabled?: boolean;
  requiresGrayscale?: boolean;
  grayscaleIntensity?: number;
  targetAspectRatio?: number;
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
  targetAspectRatio,
}: ImageCropUploadProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [image, setImage] = useState<string | null>(() => currentValue || null);
  const [annotationResult, setAnnotationResult] = useState<any>(null);

  // Background removal state
  const [bgRemovedImage, setBgRemovedImage] = useState<string | null>(null);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [bgProgress, setBgProgress] = useState(0);
  const [isInserting, setIsInserting] = useState(false);

  // Post-crop state: set after "Done" in the crop editor
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  // Initial crop selection for the cropper
  const [initialCrop, setInitialCrop] = useState<{ x: number, y: number, w: number, h: number } | undefined>(undefined);

  // editing → postCrop → processing → reviewing
  const phase = isRemovingBackground ? 'processing' : bgRemovedImage ? 'reviewing' : croppedImage ? 'postCrop' : 'editing';

  const cropperRef = useRef<ImageCropperRef>(null);
  const { svgRaw } = useToolStore();

  // Reset transient state whenever the dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      setCroppedImage(null);
      setBgRemovedImage(null);
      setBgProgress(0);
    }
  }, [isDialogOpen]);

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
      }
    } else if (!currentValue && image) {
      setImage(null);
    }
  }, [currentValue, isDialogOpen]);

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

  const bgRemovalMutation = useMutation({
    mutationFn: (imageData: string | File) => removeBackground(imageData),
    onMutate: () => {
      setBgProgress(10);
      setIsRemovingBackground(true);
    },
    onSuccess: (data) => {
      setBgProgress(100);
      setBgRemovedImage(data.image);
    },
    onError: (e: any) => {
      const errorMsg = e.response?.data?.error || e.message || "Background removal failed";
      toast.error(errorMsg);
      console.error(e);
      setBgProgress(0);
    },
    onSettled: () => {
      setIsRemovingBackground(false);
    }
  });

  // Triggered from the postCrop phase "Remove Background" button
  const handleMagicMask = () => {
    if (!croppedImage) return;
    bgRemovalMutation.mutate(croppedImage);
  };

  // Called by the cropper when "Done" is clicked — stores result, shows postCrop phase
  const handleApplyCrop = useCallback((croppedDataUrl: string) => {
    setCroppedImage(croppedDataUrl);
  }, []);

  // Final insertion — closes dialog, applies grayscale, calls onImageSelect
  const finalizeAndClose = useCallback(async (imageDataUrl: string) => {
    setIsDialogOpen(false);
    setIsInserting(true);
    try {
      const processed = await applyGrayscaleToImage(imageDataUrl);
      onImageSelect(fieldId, processed, annotationResult?.rotation || 0);
      toast.success("Image applied ✨");
    } catch (e) {
      toast.error("Failed to apply image");
      console.error(e);
    } finally {
      setIsInserting(false);
    }
  }, [applyGrayscaleToImage, onImageSelect, fieldId, annotationResult]);

  const computeAspectRatioCrop = (dataUrl: string) => {
    if (!targetAspectRatio) return;
    const img = new Image();
    img.onload = () => {
      const imgAR = img.naturalWidth / img.naturalHeight;
      let x: number, y: number, w: number, h: number;
      if (imgAR >= targetAspectRatio) {
        h = 1; w = (img.naturalHeight * targetAspectRatio) / img.naturalWidth;
        x = (1 - w) / 2; y = 0;
      } else {
        w = 1; h = img.naturalWidth / (img.naturalHeight * targetAspectRatio);
        y = (1 - h) / 2; x = 0;
      }
      setInitialCrop({ x, y, w, h });
    };
    img.src = dataUrl;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        setImage(dataUrl);
        setBgRemovedImage(null);
        setIsDialogOpen(true);
        setInitialCrop(undefined);

        // Analyze uploaded image for blue borders
        try {
          const result = await annotationDetector.loadAndAnalyzeImage(dataUrl);
          if (result && result.confidence > 0.5) {
            setAnnotationResult(result);
            setInitialCrop({
              x: result.border.left / result.imageWidth,
              y: result.border.top / result.imageHeight,
              w: result.content.width / result.imageWidth,
              h: result.content.height / result.imageHeight
            });
          } else {
            setAnnotationResult(null);
            computeAspectRatioCrop(dataUrl);
          }
        } catch {
          setAnnotationResult(null);
          computeAspectRatioCrop(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  }, [targetAspectRatio]);

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
              <div className="w-full h-full overflow-auto">
                <LazyImage src={currentValue} alt={fieldName} className="w-full max-w-none h-auto object-contain min-h-full" />
              </div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <div className="text-center text-white">
                  <div className="text-sm font-medium">Click to change image</div>
                  <div className="text-xs opacity-80">Upload a new image</div>
                </div>
              </div>

              {isInserting && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-in fade-in duration-300">
                  <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">Inserting Image...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {currentValue && (
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async (e: React.MouseEvent) => {
                e.stopPropagation();
                setCroppedImage(null);
                setIsDialogOpen(true);

                if (currentValue && !annotationResult) {
                  try {
                    const result = await annotationDetector.loadAndAnalyzeImage(currentValue);
                    if (result && result.confidence > 0.5) {
                      setAnnotationResult(result);
                      setInitialCrop({
                        x: result.border.left / result.imageWidth,
                        y: result.border.top / result.imageHeight,
                        w: result.content.width / result.imageWidth,
                        h: result.content.height / result.imageHeight
                      });
                    } else {
                      computeAspectRatioCrop(currentValue);
                    }
                  } catch (e) { console.error("Re-analysis failed", e); }
                } else {
                  setInitialCrop(undefined);
                }
              }}
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
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); onImageSelect(fieldId, ""); }}
              className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
              disabled={disabled}
            >
              Remove
            </Button>
          </div>
        )}
      </div>

      <ShadcnDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <ShadcnDialogContent className="h-[100dvh] w-screen max-w-none rounded-none border-none bg-black/95 p-0 overflow-hidden flex flex-col">
          {image && (
            <div className="flex-1 relative flex flex-col min-h-0">
              <div className="flex-1 flex flex-col items-center justify-center p-1 min-h-0">
                <div className="w-full h-full flex flex-col items-center justify-center relative min-h-0">
                  <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-0 flex items-center justify-center relative group shadow-[0_0_50px_rgba(0,0,0,0.5)] min-h-0 w-full max-w-6xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,79,24,0.05)_0%,transparent_70%)] pointer-events-none" />
                    <div className="relative h-full w-full flex items-center justify-center min-h-0">
                      {phase === 'editing' || phase === 'processing' ? (
                        <div className="relative w-full h-full flex flex-col items-center justify-center p-2 md:p-8 min-h-0">
                          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[32px_32px] pointer-events-none" />

                          <div className="relative flex items-center justify-center min-h-0 w-full h-full">
                            <ImageCropper
                              ref={cropperRef}
                              image={image || ''}
                              onCrop={handleApplyCrop}
                              initialSelection={initialCrop}
                            />
                          </div>

                          {phase === 'processing' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-50">
                              <div className="relative mb-6">
                                <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse rounded-full" />
                                <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10" />
                              </div>
                              <div className="w-64 space-y-2 text-center">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-primary/80">
                                  <span>AI Engine</span>
                                  <span>{bgProgress}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                                  <div
                                    className="h-full bg-primary transition-all duration-300 ease-out shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                                    style={{ width: `${bgProgress}%` }}
                                  />
                                </div>
                                <p className="text-[9px] font-medium text-white/40 uppercase tracking-[0.2em] animate-pulse">
                                  Extracting Subject...
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : phase === 'postCrop' ? (
                        <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
                          <img
                            src={croppedImage || ''}
                            alt="Cropped preview"
                            className="max-h-[70vh] w-auto shadow-2xl object-contain animate-in fade-in zoom-in-95 duration-500"
                          />
                        </div>
                      ) : phase === 'reviewing' ? (
                        <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
                          <img
                            src={bgRemovedImage || ''}
                            alt="Background removed"
                            className="max-h-[70vh] w-auto shadow-2xl object-contain animate-in fade-in zoom-in-95 duration-500"
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Action bar */}
                  <div className="mt-[5px] z-50 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 w-auto pb-2">
                    <div className="flex items-center gap-1 p-1 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl">
                      {phase === 'postCrop' ? (
                        <div className="flex items-center gap-1">
                          <Button
                            onClick={handleMagicMask}
                            disabled={isRemovingBackground}
                            variant="ghost"
                            size="sm"
                            className="h-9 md:h-10 px-4 text-primary text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 rounded-lg group"
                          >
                            <Sparkles className="h-3 w-3 mr-2 group-hover:scale-125 transition-transform" />
                            Remove Background
                          </Button>
                          <div className="w-[1px] h-5 md:h-6 bg-white/10 mx-1 md:mx-2" />
                          <Button
                            onClick={() => finalizeAndClose(croppedImage!)}
                            variant="ghost"
                            size="sm"
                            className="h-9 md:h-10 px-4 text-green-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-green-400/10 rounded-lg"
                          >
                            <Check className="h-3 w-3 mr-2" />
                            Save As-Is
                          </Button>
                        </div>
                      ) : phase === 'reviewing' ? (
                        <div className="flex items-center gap-1">
                          <Button
                            onClick={() => finalizeAndClose(bgRemovedImage!)}
                            variant="ghost"
                            size="sm"
                            className="h-9 md:h-10 px-5 text-green-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-green-400/10 rounded-lg"
                          >
                            <Check className="h-3 w-3 mr-2" />
                            Apply & Close
                          </Button>
                        </div>
                      ) : phase === 'processing' ? (
                        <div className="px-6 py-3 flex items-center gap-3">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-primary/60">Processing AI Mask...</span>
                        </div>
                      ) : (
                        <>
                          <Button
                            onClick={() => {
                              if (currentValue) setImage(currentValue);
                            }}
                            variant="ghost"
                            size="sm"
                            className="h-9 md:h-10 px-3 md:px-4 text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-white/10 rounded-lg"
                          >
                            <RefreshCcw className="h-3 w-3 mr-2" />
                            Reset
                          </Button>
                        </>
                      )}
                    </div>

                    {phase === 'editing' && (
                      <div className="flex items-center gap-2 md:gap-3">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setIsDialogOpen(false)}
                          className="flex-1 md:flex-none h-9 md:h-10 px-4 md:px-5 bg-white/5 backdrop-blur-xl border border-white/10 text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-white/10 rounded-lg transition-all shadow-2xl"
                        >
                          Discard
                        </Button>
                        <Button
                          type="button"
                          onClick={() => cropperRef.current?.crop()}
                          className="flex-1 md:flex-none h-9 md:h-10 px-6 md:px-7 bg-primary text-black text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-lg shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:bg-primary/90 transition-all"
                        >
                          <Check className="h-3 w-3 mr-2" />
                          Done
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </ShadcnDialogContent>
      </ShadcnDialog>
    </div>
  );
}
