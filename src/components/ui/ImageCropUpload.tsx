import React, { useState, useRef, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Upload, RotateCcw, RotateCw, ZoomIn, ZoomOut, X, Check } from "lucide-react";
import { annotationDetector, type AnnotationResult } from "@/lib/utils/annotationDetector";
import useToolStore from "@/store/formStore";

interface ImageCropUploadProps {
  fieldId: string;
  fieldName: string;
  currentValue: string;
  onImageSelect: (fieldId: string, croppedImageDataUrl: string) => void;
  aspectRatio?: number;
  minWidth?: number;
  minHeight?: number;
  svgElementId?: string;
}

export default function ImageCropUpload({
  fieldId,
  fieldName,
  currentValue,
  onImageSelect,
  aspectRatio = 1,
  minWidth = 50,
  minHeight = 50,
  svgElementId
}: ImageCropUploadProps) {
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [annotationResult, setAnnotationResult] = useState<AnnotationResult | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Get SVG text from store
  const { svgRaw } = useToolStore();

  // Analyze default image for annotations when component mounts
  useEffect(() => {
    const analyzeDefaultImage = async () => {
      if (!svgElementId) return;
      
      try {
        // Pass SVG text to the annotation detector
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
    
    // Use annotation result if available, otherwise use default aspect ratio
    const targetAspectRatio = annotationResult?.content.aspectRatio || aspectRatio;
    
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: "%",
          width: 90,
        },
        targetAspectRatio,
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  }, [aspectRatio, annotationResult]);


  const getCroppedImg = useCallback(
    (
      image: HTMLImageElement,
      crop: PixelCrop
    ) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("No 2d context");
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const pixelRatio = window.devicePixelRatio;

      canvas.width = crop.width * pixelRatio * scaleX;
      canvas.height = crop.height * pixelRatio * scaleY;

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width * scaleX,
        crop.height * scaleY
      );

      return new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              throw new Error("Canvas is empty");
            }
            resolve(blob);
          },
          "image/jpeg",
          0.8
        );
      });
    },
    []
  );

  const makeClientCrop = useCallback(
    async (crop: PixelCrop) => {
      if (image && completedCrop && previewCanvasRef.current && imgRef.current) {
        setCompletedCrop(crop);
        const croppedImageBlob = await getCroppedImg(imgRef.current, crop);
        const croppedImageDataUrl = URL.createObjectURL(croppedImageBlob);
        onImageSelect(fieldId, croppedImageDataUrl);
      }
    },
    [image, completedCrop, getCroppedImg, onImageSelect, fieldId]
  );

  const onCropChange = useCallback((_crop: Crop, percentCrop: Crop) => {
    setCrop(percentCrop);
  }, []);

  const onCropComplete = useCallback(
    (crop: PixelCrop) => {
      setCompletedCrop(crop);
      makeClientCrop(crop);
    },
    [makeClientCrop]
  );

  const handleResetCrop = useCallback(() => {
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      
      // Use annotation result if available, otherwise use default
      const targetAspectRatio = annotationResult?.content.aspectRatio || aspectRatio;
      
      const newCrop = centerCrop(
        makeAspectCrop(
          {
            unit: "%",
            width: 90,
          },
          targetAspectRatio,
          width,
          height
        ),
        width,
        height
      );
      setCrop(newCrop);
    }
  }, [aspectRatio, annotationResult]);

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.1, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  }, []);

  const handleRotateLeft = useCallback(() => {
    setRotate(prev => prev - 90);
  }, []);

  const handleRotateRight = useCallback(() => {
    setRotate(prev => prev + 90);
  }, []);

  const handleConfirmCrop = useCallback(() => {
    if (completedCrop && imgRef.current) {
      getCroppedImg(imgRef.current, completedCrop).then((blob) => {
        const croppedImageDataUrl = URL.createObjectURL(blob);
        onImageSelect(fieldId, croppedImageDataUrl);
        setIsDialogOpen(false);
        setImage(null);
        setCrop(undefined);
        setCompletedCrop(undefined);
        setScale(1);
        setRotate(0);
      });
    }
  }, [completedCrop, getCroppedImg, onImageSelect, fieldId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: useCallback((acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const reader = new FileReader();
        reader.addEventListener("load", () => {
          setImage(reader.result as string);
          setCrop(undefined);
          setIsDialogOpen(true);
        });
        reader.readAsDataURL(file);
      }
    }, []),
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".bmp", ".webp"]
    },
    multiple: false
  });

  const handleChangeImage = useCallback(() => {
    // Create a hidden file input and trigger it
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.addEventListener("load", () => {
          setImage(reader.result as string);
          setCrop(undefined);
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
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? "border-blue-400 bg-blue-50/10" 
              : "border-gray-300 hover:border-gray-400"
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
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
          </DialogHeader>
          
          {image && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleZoomOut}
                    className="text-white border-white/20 hover:bg-white/10"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-white text-sm">{Math.round(scale * 100)}%</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleZoomIn}
                    className="text-white border-white/20 hover:bg-white/10"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetCrop}
                    className="text-white border-white/20 hover:bg-white/10"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </div>

              <div className="relative">
                <ReactCrop
                  crop={crop}
                  onChange={onCropChange}
                  onComplete={onCropComplete}
                  aspect={annotationResult?.content.aspectRatio || aspectRatio}
                  minWidth={annotationResult?.content.width || minWidth}
                  minHeight={annotationResult?.content.height || minHeight}
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={image}
                    style={{
                      transform: `scale(${scale}) rotate(${rotate}deg)`,
                      maxHeight: "400px",
                      maxWidth: "100%"
                    }}
                    onLoad={onImageLoad}
                  />
                </ReactCrop>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
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