import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Upload, RotateCcw, RotateCw, X, Check, Wand2, Loader2 } from "lucide-react";
import { annotationDetector, type AnnotationResult } from "@/lib/utils/annotationDetector";
import useToolStore from "@/store/formStore";
import { removeBackground } from "@/api/apiEndpoints";
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
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [hasBackgroundRemoved, setHasBackgroundRemoved] = useState(false);
  const [annotationResult, setAnnotationResult] = useState<AnnotationResult | null>(null);
  const [rotation, setRotation] = useState(0);
  
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

    setIsRemovingBackground(true);
    try {
      console.log('Starting background removal via API...');
      console.log('Original file:', originalFile.name, originalFile.size, 'bytes');
      
      // Call backend API for background removal using axios
      const result = await removeBackground(originalFile);
      
      if (!result.success || !result.image) {
        throw new Error('Invalid response from server');
      }
      
      console.log('Background removal completed successfully');
      setImage(result.image);
      setHasBackgroundRemoved(true);
      toast.success("Background removed successfully");
    } catch (error) {
      console.error('Background removal failed:', error);
      toast.error(errorMessage(error as Error));
    } finally {
      setIsRemovingBackground(false);
    }
  }, [originalFile]);

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
          setIsDialogOpen(true);
        });
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }, []);

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-white">{fieldName}</label>
      
      {!currentValue ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            disabled 
              ? "border-gray-500 bg-gray-100/10 cursor-not-allowed opacity-50" 
              : isDragActive 
                ? "border-blue-400 bg-blue-50/10 cursor-pointer" 
                : "border-gray-300 hover:border-gray-400 cursor-pointer"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-400">
            {isDragActive ? "Drop the image here" : "Drag & drop an image, or click to select"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="overflow-auto custom-scrollbar max-h-64 rounded-lg border border-gray-300">
            <img 
              src={currentValue} 
              alt="Current image" 
              className="w-full h-auto object-contain"
            />
          </div>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleChangeImage}
              className="text-white border-white/20 hover:bg-white/10"
              disabled={disabled}
            >
              <Upload className="h-4 w-4 mr-2" />
              Change Image
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onImageSelect(fieldId, "")}
              className="text-white border-white/20 hover:bg-white/10"
              disabled={disabled}
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-white">Crop Image</DialogTitle>
          </DialogHeader>
          
          {image && (
            <div className="flex-1 flex flex-col space-y-4 min-h-0 overflow-y-auto custom-scrollbar">
              {/* Controls Row */}
              <div className="flex-shrink-0 flex items-center justify-between flex-wrap gap-2 p-2 bg-gray-800/50 rounded-lg">
                <div className="text-white text-sm">
                  <span className="text-gray-300">Drag the corners to resize • Drag the center to move</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRotateLeft}
                    className="text-white border-white/20 hover:bg-white/10"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRotateRight}
                    className="text-white border-white/20 hover:bg-white/10"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!hasBackgroundRemoved ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveBackground}
                      disabled={isRemovingBackground}
                      className="text-white border-white/20 hover:bg-white/10"
                    >
                      {isRemovingBackground ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                      {isRemovingBackground ? "Removing..." : "Remove BG"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRestoreOriginal}
                      className="text-white border-white/20 hover:bg-white/10"
                    >
                      <X className="h-4 w-4" />
                      Restore Original
                    </Button>
                  )}
                </div>
              </div>

              {/* Cropper Container */}
              <div className="flex-1 relative h-fit bg-gray-900 rounded-lg overflow-hidden">
                <div className="w-full h-full flex items-center justify-center">
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
          
          <DialogFooter className="flex-shrink-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setImage(null);
                setOriginalImage(null);
                setOriginalFile(null);
                setHasBackgroundRemoved(false);
              }}
              className="text-white border-white/20 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmCrop}
              disabled={!completedCrop}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Check className="h-4 w-4 mr-2" />
              Confirm Crop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}