import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Upload, RotateCcw, RotateCw, X, Check, Wand2, Loader2 } from "lucide-react";
import { annotationDetector, type AnnotationResult } from "@/lib/utils/annotationDetector";
import useToolStore from "@/store/formStore";
import { Client } from "@gradio/client";
import { toast } from "sonner";
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
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [hasBackgroundRemoved, setHasBackgroundRemoved] = useState(false);
  const [annotationResult, setAnnotationResult] = useState<AnnotationResult | null>(null);
  const [rotation, setRotation] = useState(0);
  
  // Cache for background-removed image to avoid re-processing
  const [cachedBgRemovedImage, setCachedBgRemovedImage] = useState<string | null>(null);
  
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
    
    // Set a default crop area (center, 80% of image)
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
          console.log('=== CROPPING DEBUG ===');
          console.log('Original image dimensions:', image.width, 'x', image.height);
          console.log('Pixel crop coordinates:', pixelCrop);
          console.log('Annotation result:', annotationResult);
          
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("No 2d context"));
            return;
          }

          // Calculate scale factors between displayed image and original image
          const displayedHeight = 400; // Our fixed display height
          const displayedWidth = (image.width / image.height) * displayedHeight;
          const scaleX = image.width / displayedWidth;
          const scaleY = image.height / displayedHeight;
          
          console.log('Display dimensions:', displayedWidth, 'x', displayedHeight);
          console.log('Scale factors:', scaleX, 'x', scaleY);
          
          // Scale crop coordinates to original image dimensions
          const scaledCrop = {
            x: pixelCrop.x * scaleX,
            y: pixelCrop.y * scaleY,
            width: pixelCrop.width * scaleX,
            height: pixelCrop.height * scaleY
          };
          
          console.log('Scaled crop coordinates:', scaledCrop);

          // If we have annotation result, stretch the cropped image to those dimensions
          if (annotationResult) {
            const targetWidth = annotationResult.content.width;
            const targetHeight = annotationResult.content.height;
            
            console.log('Stretching to target dimensions:', targetWidth, 'x', targetHeight);
            
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            
            // Draw the cropped image stretched to target dimensions
            ctx.drawImage(
              image,
              scaledCrop.x,
              scaledCrop.y,
              scaledCrop.width,
              scaledCrop.height,
              0,
              0,
              targetWidth,
              targetHeight
            );
          } else {
            // Use the actual crop dimensions
            console.log('Using actual crop dimensions:', scaledCrop.width, 'x', scaledCrop.height);
            
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

          console.log('Final canvas dimensions:', canvas.width, 'x', canvas.height);
          console.log('=== END DEBUG ===');

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Canvas is empty"));
                return;
              }
              resolve(URL.createObjectURL(blob));
            },
            "image/jpeg",
            0.8
          );
        };
        image.src = imageSrc;
      });
    },
    [annotationResult]
  );

  const handleRemoveBackground = useCallback(async () => {
    if (!originalFile) return;

    // Check if we already have a cached background-removed version
    if (cachedBgRemovedImage) {
      console.log('Using cached background-removed image');
      setImage(cachedBgRemovedImage);
      setHasBackgroundRemoved(true);
      toast.success("Background removed ⚡");
      return;
    }

    setIsRemovingBackground(true);
    try {
      console.log('Starting background removal...');
      console.log('Original file:', originalFile.name, originalFile.size, 'bytes');
      
      // Convert File to Blob for Gradio Client
      const imageBlob = new Blob([originalFile], { type: originalFile.type });
      
      // Connect to Hugging Face Gradio Space
      const client = await Client.connect("not-lain/background-removal");
      
      // Call the background removal API
      const result = await client.predict("/image", { 
        image: imageBlob, 
      });

      console.log('API Result:', result);
      
      // The result.data contains [input_image, output_image]
      // We need the second item (index 1) which is the background-removed image
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resultData = result.data as any;
      if (result && resultData && resultData[0] && resultData[0][1]) {
        // Get the processed image (second item in the array)
        const processedImageUrl = resultData[0][1].url;
        
        // Fetch the image and convert to base64
        const response = await fetch(processedImageUrl);
        const blob = await response.blob();
        
        // Convert blob to data URL using Promise
        const base64data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        
        // Cache the processed image for future use
        setCachedBgRemovedImage(base64data);
        
        // Update state after conversion is complete
        setImage(base64data);
        setHasBackgroundRemoved(true);
        toast.success("Background removed successfully ✨");
      } else {
        throw new Error('Invalid response from background removal service');
      }
      
    } catch (error) {
      console.error('Background removal failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove background. Please try again.');
    } finally {
      setIsRemovingBackground(false);
    }
  }, [originalFile, cachedBgRemovedImage]);

  const handleRestoreOriginal = useCallback(() => {
    if (originalImage) {
      setImage(originalImage);
      setHasBackgroundRemoved(false);
    }
  }, [originalImage]);

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
      setHasBackgroundRemoved(false);
      setCachedBgRemovedImage(null); // Clear cache when done
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
          setOriginalImage(imageDataUrl);
          setCrop(undefined);
          setCompletedCrop(undefined);
          setHasBackgroundRemoved(false);
          setCachedBgRemovedImage(null); // Clear cache for new image
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
          setOriginalImage(imageDataUrl);
          setCrop(undefined);
          setCompletedCrop(undefined);
          setHasBackgroundRemoved(false);
          setCachedBgRemovedImage(null); // Clear cache for new image
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
              className="w-full h-auto object-contain max-h-64"
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
            <DialogTitle className="text-white text-lg">Crop & Edit Image</DialogTitle>
          </DialogHeader>
          
          {image && (
            <div className="flex-1 flex flex-col space-y-3 min-h-0 overflow-y-auto custom-scrollbar">
              {/* Controls Row */}
              <div className="flex-shrink-0 flex items-center justify-between flex-wrap gap-3 p-3 bg-white/5 border border-white/10 rounded-lg">
                <div className="text-xs text-white/50 hidden md:block">
                  Drag corners to resize • Drag center to move
                </div>
                <div className="flex items-center gap-2">
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
                
                <div className="flex items-center gap-2">
                  {!hasBackgroundRemoved ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveBackground}
                      disabled={isRemovingBackground}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                    >
                      {isRemovingBackground ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          Removing...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                          Remove BG
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRestoreOriginal}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                      Restore
                    </Button>
                  )}
                </div>
              </div>

              {/* Cropper Container */}
              <div className="flex-1 relative h-fit bg-black/30 border border-white/10 rounded-lg overflow-hidden">
                <div className="w-full h-full flex items-center justify-center p-4">
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => {
                      console.log('Crop completed with coordinates:', c);
                      setCompletedCrop(c);
                    }}
                    className="max-w-full max-h-full"
                    keepSelection
                    minWidth={50}
                    minHeight={50}
                  >
                    <img
                      ref={imgRef}
                      alt="Crop me"
                      src={image}
                      style={{
                        transform: `rotate(${rotation}deg)`,
                        height: "400px",
                        width: "auto",
                        objectFit: "contain"
                      }}
                      onLoad={onImageLoad}
                    />
                  </ReactCrop>
                </div>
              </div>
            </div>
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
                setHasBackgroundRemoved(false);
                setCachedBgRemovedImage(null); // Clear cache on cancel
              }}
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmCrop}
              disabled={!completedCrop}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}