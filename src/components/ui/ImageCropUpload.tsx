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

interface ImageCropUploadProps {
  fieldId: string;
  fieldName: string;
  currentValue: string;
  onImageSelect: (fieldId: string, croppedImageDataUrl: string) => void;
  svgElementId?: string;
  disabled?: boolean;
}

export default function ImageCropUpload({
  fieldId,
  fieldName,
  currentValue,
  onImageSelect,
  svgElementId,
  disabled = false
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
  
  // Get SVG text from store
  const { svgRaw } = useToolStore();

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
    
    setCrop({
      unit: "px",
      x: cropX,
      y: cropY,
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

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Canvas is empty"));
                return;
              }
              resolve(URL.createObjectURL(blob));
            },
            "image/png"
          );
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
  }, [originalFile, cachedBgRemovedImage]);

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
  }, [originalFile, cachedFreeBgRemoved]);

  const handleConfirmCrop = useCallback(async () => {
    if (!image || !completedCrop) return;

    try {
      const croppedImageDataUrl = await getCroppedImg(image, completedCrop);
      onImageSelect(fieldId, croppedImageDataUrl);
      setIsDialogOpen(false);
      setImage(null);
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
  }, [image, completedCrop, getCroppedImg, onImageSelect, fieldId]);

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
      
      {!currentValue ? (
        <div
          {...getRootProps()}
          className={`relative border border-white/20 rounded-lg p-8 text-center transition-all duration-200 ${
            disabled 
              ? "bg-white/5 cursor-not-allowed opacity-50" 
              : isDragActive 
                ? "bg-white/20 border-white/40 cursor-pointer" 
                : "bg-white/10 hover:bg-white/15 hover:border-white/30 cursor-pointer"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-10 w-10 text-white/40 mb-3" />
          <p className="text-sm text-white/60">
            {isDragActive ? "Drop image here" : "Click to upload or drag and drop"}
          </p>
          <p className="text-xs text-white/40 mt-1">
            PNG, JPG, GIF up to 10MB
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative overflow-hidden rounded-lg border border-white/20 bg-white/5">
            <img 
              src={currentValue} 
              alt="Uploaded image" 
              className="w-full h-auto max-h-64 object-contain"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleChangeImage}
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
              disabled={disabled}
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Change
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onImageSelect(fieldId, "")}
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
              disabled={disabled}
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Remove
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] flex flex-col bg-gray-900 border-white/20">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-white text-lg">Edit Image</DialogTitle>
          </DialogHeader>
          
          {image && (
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'crop' | 'remove-bg')} className="flex-1 flex flex-col min-h-0">
              <TabsList className="bg-white/10 w-full shrink-0">
                <TabsTrigger value="crop" className="flex-1">Crop Image</TabsTrigger>
                <TabsTrigger value="remove-bg" className="flex-1">Remove Background</TabsTrigger>
              </TabsList>

              {/* Crop Tab */}
              <TabsContent value="crop" className="flex-1 flex flex-col space-y-3 min-h-0 overflow-y-auto custom-scrollbar mt-3">
                {/* Rotate Controls */}
                <div className="flex-shrink-0 flex items-center justify-between gap-3 p-3 bg-white/5 border border-white/10 rounded-lg">
                  <div className="text-xs text-white/50 hidden md:block">
                    Drag corners to resize • Drag center to move
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRotateLeft}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 h-8 w-8 p-0"
                      title="Rotate Left"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRotateRight}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 h-8 w-8 p-0"
                      title="Rotate Right"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Cropper Container */}
                <div className="bg-black/30 border border-white/10 rounded-lg p-4 flex items-center justify-center">
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
                      alt="Crop me"
                      src={image}
                      className="w-auto h-[500px]"
                      style={{
                        transform: `rotate(${rotation}deg)`,
                      }}
                      onLoad={onImageLoad}
                    />
                  </ReactCrop>
                </div>
              </TabsContent>

              {/* Remove Background Tab */}
              <TabsContent value="remove-bg" className="flex-1 flex flex-col space-y-3 min-h-0 overflow-y-auto custom-scrollbar mt-3">
                {!bgRemovedImage ? (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-6 p-6">
                    <div className="text-center space-y-2 mb-4">
                      <h3 className="text-base font-medium text-white">Choose Removal Method</h3>
                      <p className="text-xs text-white/60">Select how you want to remove the background</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl">
                      {/* Paid Method - Remove.bg */}
                      <button
                        onClick={handlePaidBgRemoval}
                        disabled={isRemovingBackground}
                        className="relative border border-primary/50 bg-white/5 rounded-lg p-5 hover:bg-white/10 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="absolute -top-2 -right-2 bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                          Fastest
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-primary" />
                            <div>
                              <h4 className="font-semibold text-white text-sm">Professional</h4>
                              <p className="text-xs text-white/60">3-5 seconds • Best quality</p>
                            </div>
                          </div>
                          <div className="text-xl font-bold text-primary">$0.20</div>
                          {isRemovingBackground && (
                            <div className="flex items-center gap-2 text-xs text-white/70">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Processing...
                            </div>
                          )}
                        </div>
                      </button>

                      {/* Free Method - Hugging Face */}
                      <button
                        onClick={handleFreeBgRemoval}
                        disabled={isRemovingBackground}
                        className="border border-white/20 bg-white/5 rounded-lg p-5 hover:bg-white/10 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-green-400" />
                            <div>
                              <h4 className="font-semibold text-white text-sm">Free</h4>
                              <p className="text-xs text-white/60">10-15 seconds • Good quality</p>
                            </div>
                          </div>
                          <div className="text-xl font-bold text-green-400">Free</div>
                          {isRemovingBackground && (
                            <div className="flex items-center gap-2 text-xs text-white/70">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Processing...
                            </div>
                          )}
                        </div>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col space-y-3">
                    {/* Controls - Two Rows */}
                    <div className="p-3 bg-white/5 border border-white/10 rounded-lg space-y-2">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setShowOriginal(!showOriginal)}
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          {showOriginal ? "Show Processed" : "Show Original"}
                        </Button>
                        <Button
                          onClick={() => {
                            setImage(bgRemovedImage);
                            setActiveTab('crop');
                          }}
                          size="sm"
                          className="flex-1 bg-primary/80 hover:bg-primary/70 text-white shadow-sm"
                        >
                          <Check className="h-3.5 w-3.5 mr-1.5" />
                          Use This Image
                        </Button>
                      </div>
                      <Button
                        onClick={() => {
                          setBgRemovedImage(null);
                          setShowOriginal(false);
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                        Try Different Method
                      </Button>
                    </div>

                    {/* Image Display with Label */}
                    <div className="bg-black/30 border border-white/10 rounded-lg p-4 flex items-center justify-center relative">
                      <img
                        src={(showOriginal ? originalImage : bgRemovedImage) || ''}
                        alt={showOriginal ? "Original" : "Background Removed"}
                        className="w-auto h-[500px]"
                      />
                      {/* Image Label */}
                      <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/80 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm">
                        <Check className="h-3.5 w-3.5 text-green-400" />
                        {showOriginal ? "Original Image" : "Background Removed"}
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
          
          <DialogFooter className="flex-shrink-0 mt-3 gap-2">
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
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmCrop}
              disabled={!completedCrop}
              className="flex-1 bg-primary/80 hover:bg-primary/70 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Confirm Crop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}