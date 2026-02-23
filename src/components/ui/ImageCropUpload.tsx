import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, RotateCcw, RotateCw, X, Check, Loader2, Zap, Sparkles, Eye } from "lucide-react";
import { annotationDetector, type AnnotationResult } from "@/lib/utils/annotationDetector";
import useToolStore from "@/store/formStore";
import { removeBackground } from "@/api/apiEndpoints";
import { Client } from "@gradio/client";
import { toast } from "sonner";
import errorMessage from "@/lib/utils/errorMessage";
import "react-image-crop/dist/ReactCrop.css";
import { LazyImage } from "@/components/LazyImage";

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
  const [image, setImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null); // Keep original for comparison
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [annotationResult, setAnnotationResult] = useState<AnnotationResult | null>(null);
  const [rotation, setRotation] = useState(0);

  // Cache for background-removed image to avoid re-processing
  const [cachedBgRemovedImage, setCachedBgRemovedImage] = useState<string | null>(null);
  const [cachedFreeBgRemoved, setCachedFreeBgRemoved] = useState<string | null>(null);

  // Background removal state
  const [bgRemovedImage, setBgRemovedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'crop' | 'remove-bg'>('crop');
  const [showOriginal, setShowOriginal] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);

  const applyGrayscaleToImage = useCallback(
    (imageSrc: string): Promise<string> => {
      if (!requiresGrayscale) {
        return Promise.resolve(imageSrc);
      }

      const intensityValue = Math.max(0, Math.min(100, grayscaleIntensity ?? 100));
      if (intensityValue === 0) {
        return Promise.resolve(imageSrc);
      }

      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("Unable to acquire 2D context for grayscale conversion"));
              return;
            }

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const alpha = intensityValue / 100;
            if (alpha > 0) {
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const data = imageData.data;

              for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                data[i] = r + (gray - r) * alpha;
                data[i + 1] = g + (gray - g) * alpha;
                data[i + 2] = b + (gray - b) * alpha;
              }

              ctx.putImageData(imageData, 0, 0);
            }

            const processedUrl = canvas.toDataURL("image/png");
            resolve(processedUrl);
          } catch (error) {
            reject(error instanceof Error ? error : new Error("Failed to apply grayscale conversion"));
          }
        };

        img.onerror = () => {
          reject(new Error("Failed to load image for grayscale conversion"));
        };

        img.src = imageSrc;
      });
    },
    [requiresGrayscale, grayscaleIntensity]
  );

  // Get SVG text from store
  const { svgRaw } = useToolStore();

  // Sync with external currentValue changes (e.g., from dependsOn updates)
  useEffect(() => {
    // Sync with external currentValue changes (e.g., from dependsOn updates)
    if (currentValue && currentValue !== image && (currentValue.startsWith('data:image/') || currentValue.startsWith('blob:'))) {
      console.log(`[ImageCropUpload.${fieldId}] Syncing with external currentValue change:`, {
        hasCurrentValue: !!currentValue,
        currentValueLength: currentValue.length,
        hasLocalImage: !!image,
        valuesEqual: currentValue === image
      });
      // Update local image state to reflect the external change
      setImage(currentValue);
      setOriginalImage(currentValue);
    }
  }, [currentValue, fieldId, image]); // Simplified: only sync TOWARDS local state

  // Analyze default image for annotations when component mounts
  useEffect(() => {
    const analyzeDefaultImage = async () => {
      if (!svgElementId) return;

      try {
        const result = await annotationDetector.findAndAnalyzeDefaultImage(svgElementId, svgRaw);

        if (result) {
          setAnnotationResult(result);
        }
      } catch {
        // Silent error handling
      }
    };

    analyzeDefaultImage();
  }, [svgElementId, svgRaw]);



  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;

    // Set a default crop area (center, 80% of image) based on displayed dimensions
    const cropWidth = width * 0.8;
    const cropHeight = height * 0.8;
    const cropX = (width - cropWidth) / 2;
    const cropY = (height - cropHeight) / 2;

    const defaultCrop: Crop = {
      unit: "px",
      x: cropX,
      y: cropY,
      width: cropWidth,
      height: cropHeight,
    };

    setCrop(defaultCrop);

    // CRITICAL: Set completedCrop as well so the user can hit 'Confirm' immediately
    setCompletedCrop({
      unit: 'px',
      x: cropX,
      y: cropY,
      width: cropWidth,
      height: cropHeight
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

          if (!ctx) {
            reject(new Error("No 2d context"));
            return;
          }

          // Get the displayed image dimensions
          const displayedImage = imgRef.current;
          if (!displayedImage) {
            reject(new Error("Image ref not found"));
            return;
          }

          // Calculate scale factors
          const scaleX = image.width / displayedImage.width;
          const scaleY = image.height / displayedImage.height;

          // Scale crop coordinates to original image dimensions
          const scaledCrop = {
            x: pixelCrop.x * scaleX,
            y: pixelCrop.y * scaleY,
            width: pixelCrop.width * scaleX,
            height: pixelCrop.height * scaleY
          };

          // If we have annotation result, stretch to those dimensions
          if (annotationResult) {
            canvas.width = annotationResult.content.width;
            canvas.height = annotationResult.content.height;

            ctx.drawImage(
              image,
              scaledCrop.x,
              scaledCrop.y,
              scaledCrop.width,
              scaledCrop.height,
              0,
              0,
              annotationResult.content.width,
              annotationResult.content.height
            );
          } else {
            // Use the actual crop dimensions
            canvas.width = scaledCrop.width;
            canvas.height = scaledCrop.height;

            ctx.drawImage(
              image,
              scaledCrop.x,
              scaledCrop.y,
              scaledCrop.width,
              scaledCrop.height,
              0,
              0,
              scaledCrop.width,
              scaledCrop.height
            );
          }

          try {
            const dataUrl = canvas.toDataURL("image/png");
            resolve(dataUrl);
          } catch (error) {
            reject(error instanceof Error ? error : new Error("Failed to serialize cropped image"));
          }
        };
        image.src = imageSrc;
      });
    },
    [annotationResult]
  );

  // Paid background removal (Remove.bg API - $0.20)
  const handlePaidBgRemoval = useCallback(async () => {
    if (!originalFile) return;

    // Check cache first
    if (cachedBgRemovedImage) {
      console.log('Using cached paid background-removed image');
      setBgRemovedImage(cachedBgRemovedImage);
      toast.success("Background removed ⚡");
      return;
    }

    setIsRemovingBackground(true);
    try {
      console.log('Starting paid background removal via Remove.bg API...');

      // Call backend API for background removal
      const result = await removeBackground(originalFile);

      if (!result.success || !result.image) {
        throw new Error('Invalid response from server');
      }

      console.log('Background removed successfully');

      // Cache and set the image
      setCachedBgRemovedImage(result.image);
      setBgRemovedImage(result.image);
      console.log('Paid BG Removal - Original:', originalImage?.substring(0, 50));
      console.log('Paid BG Removal - Processed:', result.image.substring(0, 50));
      toast.success("Background removed successfully! $0.20 charged ✨");

    } catch (error) {
      console.error('Background removal failed:', error);
      toast.error(errorMessage(error as Error));
    } finally {
      setIsRemovingBackground(false);
    }
  }, [originalFile, cachedBgRemovedImage, originalImage]);

  // Free background removal (Hugging Face API)
  const handleFreeBgRemoval = useCallback(async () => {
    if (!originalFile) return;

    // Check cache first
    if (cachedFreeBgRemoved) {
      console.log('Using cached free background-removed image');
      setBgRemovedImage(cachedFreeBgRemoved);
      toast.success("Background removed ⚡");
      return;
    }

    setIsRemovingBackground(true);
    try {
      console.log('Starting free background removal via Hugging Face...');

      const imageBlob = new Blob([originalFile], { type: originalFile.type });
      const client = await Client.connect("not-lain/background-removal");

      const result = await client.predict("/image", {
        image: imageBlob,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resultData = result.data as any;

      if (resultData && resultData[0] && resultData[0][1]) {
        const processedImageUrl = resultData[0][1].url;
        const response = await fetch(processedImageUrl);
        const blob = await response.blob();

        const base64data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        // Cache and set the image
        setCachedFreeBgRemoved(base64data);
        setBgRemovedImage(base64data);
        console.log('Free BG Removal - Original:', originalImage?.substring(0, 50));
        console.log('Free BG Removal - Processed:', base64data.substring(0, 50));
        toast.success("Background removed successfully (Free) ✨");
      } else {
        throw new Error('Invalid response from service');
      }

    } catch (error) {
      console.error('Background removal failed:', error);
      toast.error(errorMessage(error as Error));
    } finally {
      setIsRemovingBackground(false);
    }
  }, [originalFile, cachedFreeBgRemoved, originalImage]);

  const handleConfirmCrop = useCallback(async () => {
    if (!image || !completedCrop) return;

    try {
      const croppedImageDataUrl = await getCroppedImg(image, completedCrop);
      const processedImageDataUrl = await applyGrayscaleToImage(croppedImageDataUrl);

      // Debug: Log the rotation being passed
      console.log('[ImageCropUpload] Confirming crop with rotation:', {
        fieldId,
        hasAnnotationResult: !!annotationResult,
        rotation: annotationResult?.rotation,
        center: annotationResult?.center
      });

      // Close the dialog immediately
      setIsDialogOpen(false);

      onImageSelect(fieldId, processedImageDataUrl, annotationResult?.rotation);

      setOriginalImage(null);
      setOriginalFile(null);
      setCrop(undefined);
      setCompletedCrop(undefined);
      setBgRemovedImage(null);
      setCachedBgRemovedImage(null);
      setCachedFreeBgRemoved(null);
    } catch (error) {
      console.error('Crop failed:', error);
    }
  }, [image, completedCrop, getCroppedImg, onImageSelect, fieldId, applyGrayscaleToImage, annotationResult]);

  const handleRotateLeft = useCallback(() => {
    setRotation(prev => prev - 90);
  }, []);

  const handleRotateRight = useCallback(() => {
    setRotation(prev => prev + 90);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: useCallback((acceptedFiles: File[]) => {
      if (!disabled && acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setOriginalFile(file);
        const reader = new FileReader();
        reader.addEventListener("load", () => {
          const imageDataUrl = reader.result as string;
          setImage(imageDataUrl);
          setOriginalImage(imageDataUrl); // Preserve original for comparison
          setCrop(undefined);
          setCompletedCrop(undefined);
          setCachedBgRemovedImage(null); // Clear cache for new image
          setCachedFreeBgRemoved(null);
          setBgRemovedImage(null);
          setActiveTab('crop'); // Reset to crop tab
          setIsDialogOpen(true);
        });
        reader.readAsDataURL(file);
      }
    }, [disabled]),
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".bmp", ".webp"]
    },
    multiple: false,
    disabled: disabled
  });

  const handleChangeImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setOriginalFile(file);
        const reader = new FileReader();
        reader.addEventListener("load", () => {
          const imageDataUrl = reader.result as string;
          setImage(imageDataUrl);
          setOriginalImage(imageDataUrl); // Preserve original for comparison
          setCrop(undefined);
          setCompletedCrop(undefined);
          setCachedBgRemovedImage(null); // Clear cache for new image
          setCachedFreeBgRemoved(null);
          setBgRemovedImage(null);
          setActiveTab('crop'); // Reset to crop tab
          setIsDialogOpen(true);
        });
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }, []);

  return (
    <div className="space-y-2">
      <label htmlFor={fieldId} className="text-sm font-medium text-white">
        {fieldName}
      </label>

      <div className="relative">
        <div
          {...getRootProps()}
          className={`block w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors overflow-hidden ${disabled
            ? "border-white/10 bg-white/5 cursor-not-allowed opacity-50"
            : isDragActive
              ? "border-white/40 bg-white/10"
              : "border-white/20 hover:border-white/40"
            }`}
        >
          <input {...getInputProps()} />
          {!currentValue ? (
            <div className="flex flex-col items-center justify-center h-full text-white/60 hover:text-white/80 transition-colors">
              <div className="w-12 h-12 border-2 border-dashed border-current rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">
                  {isDragActive ? "Drop image here" : "Click to upload image"}
                </div>
                <div className="text-xs opacity-80">PNG, JPG, GIF up to 10MB</div>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full group">
              <div className="w-full h-full overflow-auto custom-scrollbar">
                <LazyImage
                  src={currentValue}
                  alt="Uploaded image"
                  className="w-full max-w-none h-auto object-contain min-h-full"
                />
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
              onClick={(e) => {
                e.stopPropagation();
                handleChangeImage();
              }}
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              disabled={disabled}
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Change
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onImageSelect(fieldId, "");
              }}
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              disabled={disabled}
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Remove
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col bg-[#0f1620] border-white/10 p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
          <DialogHeader className="p-6 pb-2 flex-shrink-0 border-b border-white/5">
            <DialogTitle className="text-xl font-fancy font-black text-white italic uppercase tracking-tighter">
              Adjust <span className="text-primary">Image</span>
            </DialogTitle>
          </DialogHeader>

          {image ? (
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'crop' | 'remove-bg')} className="flex-1 flex flex-col min-h-[500px]">
              <div className="px-6 py-4 flex-shrink-0">
                <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl h-auto flex items-center w-fit">
                  <TabsTrigger value="crop" className="rounded-lg px-6 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
                    Crop & Frame
                  </TabsTrigger>
                  <TabsTrigger value="remove-bg" className="rounded-lg px-6 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
                    Magic Remove
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Crop Tab */}
              <TabsContent value="crop" className="flex-1 flex flex-col space-y-4 min-h-0 outline-none focus:outline-none px-6 pb-4">
                {/* Control Bar */}
                <div className="flex-shrink-0 flex items-center justify-between gap-4 p-4 bg-white/[0.03] border border-white/10 rounded-3xl backdrop-blur-3xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
                      <RotateCcw className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                      Drag to crop • Rotate to adjust
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRotateLeft}
                      className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-10 w-10 p-0 rounded-xl transition-all"
                      title="Rotate Left"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRotateRight}
                      className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-10 w-10 p-0 rounded-xl transition-all"
                      title="Rotate Right"
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Cropper Container */}
                <div className="flex-1 bg-black/40 border border-white/5 rounded-3xl p-4 flex items-center justify-center overflow-auto custom-scrollbar relative min-h-[300px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => {
                      console.log('Crop completed with coordinates:', c);
                      setCompletedCrop(c);
                    }}
                    keepSelection
                    minWidth={50}
                    minHeight={50}
                  >
                    <img
                      ref={imgRef}
                      alt="Crop target"
                      src={image}
                      className="w-full h-auto rounded-lg shadow-2xl"
                      style={{
                        transform: `rotate(${rotation}deg)`,
                      }}
                      onLoad={onImageLoad}
                      loading="lazy"
                    />
                  </ReactCrop>
                </div>
              </TabsContent>

              {/* Remove Background Tab */}
              <TabsContent value="remove-bg" className="flex-1 flex flex-col space-y-4 min-h-0 outline-none focus:outline-none px-6 pb-4">
                {!bgRemovedImage ? (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-6 p-4 overflow-y-auto">
                    <div className="text-center space-y-2">
                      <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full mb-1">
                        <Sparkles className="w-3 h-3 text-primary" />
                        <span className="text-primary font-black uppercase tracking-[0.2em] text-[8px]">AI Powered</span>
                      </div>
                      <h3 className="text-base font-black text-white uppercase italic tracking-tighter">Choose Removal <span className="text-primary">Method</span></h3>
                      <p className="text-xs text-white/40 max-w-sm mx-auto">Select how you want our AI to process your image background.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl">
                      {/* Paid Method - Remove.bg */}
                      <button
                        onClick={handlePaidBgRemoval}
                        disabled={isRemovingBackground}
                        className="group relative border border-white/10 bg-white/[0.03] rounded-2xl p-6 hover:bg-white/[0.05] hover:border-primary/50 transition-all duration-500 text-left disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden shadow-xl"
                      >
                        <div className="absolute -right-6 -top-6 w-16 h-16 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-all" />

                        <div className="space-y-3 relative z-10">
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 group-hover:scale-110 transition-transform">
                              <Zap className="h-5 w-5 text-primary" />
                            </div>
                            <div className="bg-primary/10 text-primary text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                              Best Quality
                            </div>
                          </div>
                          <div>
                            <h4 className="font-black text-white text-sm uppercase italic tracking-tighter">Professional</h4>
                            <p className="text-[10px] text-white/40 leading-relaxed font-medium mt-1">3-5 seconds • Best quality. Best for complex images. Charged at <span className="text-primary">$0.20</span> per use.</p>
                          </div>
                          {isRemovingBackground && activeTab === 'remove-bg' && (
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-primary animate-[shimmer_2s_infinite]" style={{ width: '40%' }} />
                            </div>
                          )}
                        </div>
                      </button>

                      {/* Free Method - Hugging Face */}
                      <button
                        onClick={handleFreeBgRemoval}
                        disabled={isRemovingBackground}
                        className="group relative border border-white/10 bg-white/[0.03] rounded-2xl p-6 hover:bg-white/[0.05] hover:border-green-400/50 transition-all duration-500 text-left disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden shadow-xl"
                      >
                        <div className="absolute -right-6 -top-6 w-16 h-16 bg-green-400/10 rounded-full blur-xl group-hover:bg-green-400/20 transition-all" />

                        <div className="space-y-3 relative z-10">
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-green-400/20 flex items-center justify-center border border-green-400/30 group-hover:scale-110 transition-transform">
                              <Sparkles className="h-5 w-5 text-green-400" />
                            </div>
                            <div className="bg-green-400/10 text-green-400 text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-green-400/20">
                              Unlimited
                            </div>
                          </div>
                          <div>
                            <h4 className="font-black text-white text-sm uppercase italic tracking-tighter">Free</h4>
                            <p className="text-[10px] text-white/40 leading-relaxed font-medium mt-1">10-15 seconds • Good quality. Good quality for simple backgrounds.completely <span className="text-green-400">FREE</span>.</p>
                          </div>
                          {isRemovingBackground && activeTab === 'remove-bg' && (
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-green-400 animate-[shimmer_2s_infinite]" style={{ width: '60%' }} />
                            </div>
                          )}
                        </div>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col space-y-4">
                    {/* Controls - Two Rows */}
                    <div className="p-4 bg-white/[0.03] border border-white/10 rounded-3xl space-y-3 backdrop-blur-3xl">
                      <div className="flex gap-3">
                        <Button
                          onClick={() => setShowOriginal(!showOriginal)}
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 h-10 font-bold uppercase tracking-widest text-[10px] rounded-xl"
                        >
                          <Eye className="h-3.5 w-3.5 mr-2" />
                          {showOriginal ? "Processed" : "Original"}
                        </Button>
                        <Button
                          onClick={() => {
                            setImage(bgRemovedImage);
                            setActiveTab('crop');
                          }}
                          size="sm"
                          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-10 font-black uppercase tracking-widest text-[10px] rounded-xl shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all"
                        >
                          <Check className="h-3.5 w-3.5 mr-2" />
                          Use This
                        </Button>
                      </div>
                      <Button
                        onClick={() => {
                          setBgRemovedImage(null);
                          setShowOriginal(false);
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 h-10 font-bold uppercase tracking-widest text-[10px] rounded-xl"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-2" />
                        Reset Selection
                      </Button>
                    </div>

                    {/* Image Display with Label */}
                    <div className="flex-1 bg-black/40 border border-white/5 rounded-3xl p-4 flex items-center justify-center relative overflow-hidden min-h-[300px]">
                      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />
                      <LazyImage
                        src={(showOriginal ? originalImage : bgRemovedImage) || ''}
                        alt={showOriginal ? "Original" : "Background Removed"}
                        className="w-full h-auto rounded-lg shadow-2xl"
                      />
                      {/* Image Label */}
                      <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                        {showOriginal ? (
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        )}
                        {showOriginal ? "Original" : "Magic Output"}
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex-1 flex items-center justify-center p-12 text-center">
              <p className="text-white/40">No image selected</p>
            </div>
          )}

          <DialogFooter className="flex-shrink-0 p-4 pt-2 gap-3 border-t border-white/5">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setImage(null);
                setOriginalImage(null);
                setOriginalFile(null);
                setBgRemovedImage(null);
                setCachedBgRemovedImage(null);
                setCachedFreeBgRemoved(null);
              }}
              className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 h-10 rounded-xl font-bold uppercase tracking-widest text-[10px]"
            >
              Discard
            </Button>
            <Button
              type="button"
              onClick={handleConfirmCrop}
              disabled={!completedCrop}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(var(--primary),0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Check className="h-3.5 w-3.5 mr-2" />
              Confirm Crop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}