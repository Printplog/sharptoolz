import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
  convertToPixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from './button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './dialog';
import { Upload, RotateCcw, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageCropUploadProps {
  fieldId: string;
  fieldName: string;
  currentValue?: string;
  onImageSelect: (fieldId: string, croppedImageDataUrl: string) => void;
  className?: string;
  aspectRatio?: number; // Optional aspect ratio (width/height)
  minWidth?: number;
  minHeight?: number;
}

// Helper function to get cropped image as data URL
function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
  fileName: string = 'cropped-image.jpg'
): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = window.devicePixelRatio;

  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    Math.floor(crop.x * scaleX),
    Math.floor(crop.y * scaleY),
    Math.floor(crop.width * scaleX),
    Math.floor(crop.height * scaleY),
    0,
    0,
    Math.floor(crop.width * scaleX),
    Math.floor(crop.height * scaleY)
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          console.error('Canvas is empty');
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      },
      'image/jpeg',
      0.9
    );
  });
}

export default function ImageCropUpload({
  fieldId,
  fieldName,
  currentValue,
  onImageSelect,
  className,
  aspectRatio,
  minWidth = 50,
  minHeight = 50,
}: ImageCropUploadProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [aspect, setAspect] = useState<number | undefined>(aspectRatio);
  const [isProcessing, setIsProcessing] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerCrop(makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        aspect,
        width,
        height
      ), width, height));
    }
  }, [aspect]);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
      setIsDialogOpen(true);
    }
  };

  const onImageCropComplete = (crop: PixelCrop) => {
    setCompletedCrop(crop);
  };

  const onImageCropChange = (crop: Crop, percentCrop: Crop) => {
    setCrop(percentCrop);
  };

  const handleCropImage = async () => {
    if (!imgRef.current || !completedCrop) return;

    setIsProcessing(true);
    try {
      const croppedImageDataUrl = await getCroppedImg(
        imgRef.current,
        completedCrop,
        `${fieldName}-cropped.jpg`
      );
      
      onImageSelect(fieldId, croppedImageDataUrl);
      setIsDialogOpen(false);
      
      // Reset state
      setImgSrc('');
      setCrop(undefined);
      setCompletedCrop(undefined);
      setScale(1);
      setRotate(0);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveImage = () => {
    onImageSelect(fieldId, '');
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = '';
    }
  };

  const handleResetCrop = () => {
    setScale(1);
    setRotate(0);
    if (imgRef.current && aspect) {
      const { width, height } = imgRef.current;
      setCrop(centerCrop(makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        aspect,
        width,
        height
      ), width, height));
    }
  };

  return (
    <div className={cn("space-y-2 w-full", className)}>
      <label htmlFor={fieldId} className="text-sm font-medium text-white">
        {fieldName}
      </label>
      
      {/* Hidden file input */}
      <input
        ref={hiddenInputRef}
        id={fieldId}
        type="file"
        accept="image/*"
        onChange={onSelectFile}
        className="hidden"
      />

      {/* Upload button */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => hiddenInputRef.current?.click()}
          className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <Upload className="w-4 h-4 mr-2" />
          {currentValue ? 'Change Image' : `Upload ${fieldName}`}
        </Button>
        
        {currentValue && (
          <Button
            type="button"
            variant="outline"
            onClick={handleRemoveImage}
            className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Preview */}
      {currentValue && (
        <div className="mt-2">
          <img
            src={currentValue}
            alt={`${fieldName} preview`}
            className="w-full max-w-xs h-auto rounded-lg border border-white/20"
          />
        </div>
      )}

      {/* Crop Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Crop {fieldName}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm text-white">Scale:</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-sm text-white w-8">{scale.toFixed(1)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm text-white">Rotate:</label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={rotate}
                  onChange={(e) => setRotate(Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-sm text-white w-12">{rotate}°</span>
              </div>

              {aspect && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-white">Aspect:</label>
                  <span className="text-sm text-white bg-white/10 px-2 py-1 rounded">
                    {aspect.toFixed(2)}
                  </span>
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetCrop}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            </div>

            {/* Image with crop overlay */}
            <div className="flex justify-center">
              {imgSrc && (
                <ReactCrop
                  crop={crop}
                  onChange={onImageCropChange}
                  onComplete={onImageCropComplete}
                  aspect={aspect}
                  minWidth={minWidth}
                  minHeight={minHeight}
                  className="max-w-full max-h-96"
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imgSrc}
                    style={{
                      transform: `scale(${scale}) rotate(${rotate}deg)`,
                      maxWidth: '100%',
                      maxHeight: '400px',
                    }}
                    onLoad={onImageLoad}
                  />
                </ReactCrop>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCropImage}
              disabled={!completedCrop || isProcessing}
              className="bg-primary text-background hover:bg-primary/90"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-background border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Apply Crop
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
