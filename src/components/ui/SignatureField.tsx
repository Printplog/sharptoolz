import React, { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Upload, Pen, Type, RotateCcw, Check, X, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import SignatureCanvas from 'react-signature-canvas';

interface SignatureFieldProps {
  fieldId: string;
  fieldName: string;
  currentValue?: string;
  onSignatureSelect: (fieldId: string, signatureDataUrl: string) => void;
  className?: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  penColor?: string;
  svgElementId?: string; // SVG element ID to get dimensions from
  disabled?: boolean;
}

// Helper function to get SVG element dimensions from the DOM
function getSvgElementDimensions(svgElementId: string): { width: number; height: number } | null {
  if (!svgElementId) return null;
  
  // Try multiple times to find the element (in case of timing issues)
  let element = document.getElementById(svgElementId);
  if (!element) {
    // Try to find it in the SVG preview container
    const svgPreview = document.querySelector('[data-svg-preview]');
    if (svgPreview) {
      element = svgPreview.querySelector(`#${svgElementId}`) as HTMLElement;
    }
  }
  
  if (!element) {
    console.log('SVG element not found:', svgElementId);
    return null;
  }
  
  console.log('Found SVG element:', element, 'Tag:', element.tagName);
  
  // For image elements, try to get the natural dimensions first
  if (element.tagName === 'image') {
    const img = element as HTMLImageElement;
    if (img.naturalWidth && img.naturalHeight) {
      console.log('Using natural image dimensions:', img.naturalWidth, 'x', img.naturalHeight);
      return { width: img.naturalWidth, height: img.naturalHeight };
    }
  }
  
  // Get computed style dimensions
  const computedStyle = window.getComputedStyle(element);
  const width = parseFloat(computedStyle.width);
  const height = parseFloat(computedStyle.height);
  
  console.log('Computed style dimensions:', width, 'x', height);
  
  // Check if we got valid dimensions
  if (width && height && width > 0 && height > 0) {
    console.log('Returning computed style dimensions:', width, 'x', height);
    return { width, height };
  }
  
  // Fallback to getBoundingClientRect if computed style doesn't work
  const rect = element.getBoundingClientRect();
  console.log('Using bounding rect dimensions:', rect.width, 'x', rect.height);
  return { width: rect.width, height: rect.height };
}

// Pre-made signature options - Using local images from /sign/ directory
const PRESET_SIGNATURES = [
  { 
    id: 'sign1', 
    name: 'Signature 1', 
    data: '/sign/sign1.png'
  },
  { 
    id: 'sign2', 
    name: 'Signature 2', 
    data: '/sign/sign2.png'
  },
  { 
    id: 'sign3', 
    name: 'Signature 3', 
    data: '/sign/sign3.png'
  },
  { 
    id: 'sign4', 
    name: 'Signature 4', 
    data: '/sign/sign4.png'
  },
  { 
    id: 'sign5', 
    name: 'Signature 5', 
    data: '/sign/sign5.png'
  },
  { 
    id: 'sign6', 
    name: 'Signature 6', 
    data: '/sign/sign6.png'
  },
  { 
    id: 'sign7', 
    name: 'Signature 7', 
    data: '/sign/sign7.png'
  }, 
  { 
    id: 'sign8', 
    name: 'Signature 8', 
    data: '/sign/sign8.png'
  },
  { 
    id: 'sign9', 
    name: 'Signature 9', 
    data: '/sign/sign9.png'
  },
];

export default function SignatureField({
  fieldId,
  fieldName,
  currentValue,
  onSignatureSelect,
  className,
  width = 400,
  height = 150,
  backgroundColor = '#ffffff',
  penColor = '#000000',
  svgElementId,
  disabled = false,
}: SignatureFieldProps) {
  // State for dimensions to handle timing issues
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  
  // Get exact dimensions from SVG element with retry logic
  useEffect(() => {
    if (!svgElementId) {
      setDimensions(null);
      return;
    }
    
    const getDimensions = () => {
      const svgDimensions = getSvgElementDimensions(svgElementId);
      setDimensions(svgDimensions);
      
      // Debug logging
      console.log('Signature Field Debug:', {
        svgElementId,
        svgDimensions,
        canvasWidth: svgDimensions?.width || width,
        canvasHeight: svgDimensions?.height || height,
        fallbackWidth: width,
        fallbackHeight: height
      });
    };
    
    // Try immediately
    getDimensions();
    
    // Retry after a short delay in case the SVG isn't ready yet
    const timeout = setTimeout(getDimensions, 100);
    
    return () => clearTimeout(timeout);
  }, [svgElementId, width, height]);
  
  const canvasWidth = dimensions?.width || width;
  const canvasHeight = dimensions?.height || height;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'draw' | 'preset'>('draw');
//   const [isProcessing, setIsProcessing] = useState(false);
  
  const signatureRef = useRef<SignatureCanvas>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const handleUploadSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        onSignatureSelect(fieldId, dataUrl);
        setIsDialogOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrawSignature = () => {
    if (signatureRef.current) {
      const dataUrl = signatureRef.current.toDataURL('image/png');
      onSignatureSelect(fieldId, dataUrl);
      setIsDialogOpen(false);
    }
  };

  const handlePresetSignature = (preset: typeof PRESET_SIGNATURES[0]) => {
    // Use the URL directly to avoid CORS issues in production
    onSignatureSelect(fieldId, preset.data);
    setIsDialogOpen(false);
  };

  const handleClearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };

  const handleRemoveSignature = () => {
    onSignatureSelect(fieldId, '');
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = '';
    }
  };

  const handleDownloadSignature = () => {
    if (currentValue) {
      const link = document.createElement('a');
      link.download = `${fieldName}-signature.png`;
      link.href = currentValue;
      link.click();
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
        onChange={handleUploadSignature}
        className="hidden"
      />

      {/* Signature buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsDialogOpen(true)}
          className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
          disabled={disabled}
        >
          <Pen className="w-4 h-4 mr-2" />
          {currentValue ? 'Change Signature' : `Add ${fieldName}`}
        </Button>
        
        {currentValue && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadSignature}
              className="bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30"
              disabled={disabled}
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleRemoveSignature}
              className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
              disabled={disabled}
            >
              <X className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      {/* Signature preview */}
      {currentValue && (
        <div className="mt-2">
          <img
            src={currentValue}
            alt={`${fieldName} signature`}
            className="w-full max-w-xs h-auto rounded-lg border border-white/20 bg-white"
          />
        </div>
      )}

      {/* Signature Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto custom-scrollbar  ">
          <DialogHeader>
            <DialogTitle className="text-white">Add {fieldName}</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'draw' | 'upload' | 'preset')}>
            <TabsList className="grid w-full grid-cols-3 bg-white/10">
              <TabsTrigger value="draw" className="text-white data-[state=active]:bg-white/20">
                <Pen className="w-4 h-4 mr-2" />
                Draw
              </TabsTrigger>
              <TabsTrigger value="upload" className="text-white data-[state=active]:bg-white/20">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="preset" className="text-white data-[state=active]:bg-white/20">
                <Type className="w-4 h-4 mr-2" />
                Preset
              </TabsTrigger>
            </TabsList>

            {/* Draw Signature Tab */}
            <TabsContent value="draw" className="space-y-4">
              <div className="flex justify-center">
                <div className="border border-white/20 rounded-lg overflow-hidden bg-white">
                  <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{
                      width: canvasWidth,
                      height: canvasHeight,
                      className: 'signature-canvas',
                      style: { backgroundColor }
                    }}
                    penColor={penColor}
                    minWidth={3}
                    maxWidth={8}
                    velocityFilterWeight={0.7}
                    disabled={disabled}
                  />
                </div>
              </div>
              
              <div className="flex justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearSignature}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  disabled={disabled}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Clear
                </Button>
                <Button
                  type="button"
                  onClick={handleDrawSignature}
                  className="bg-primary text-background hover:bg-primary/90"
                  disabled={disabled}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Use Signature
                </Button>
              </div>
            </TabsContent>

            {/* Upload Signature Tab */}
            <TabsContent value="upload" className="space-y-4">
              <div className="text-center">
                <p className="text-white mb-4">Upload a signature image file</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => hiddenInputRef.current?.click()}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  disabled={disabled}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
              </div>
            </TabsContent>

            {/* Preset Signature Tab */}
            <TabsContent value="preset" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {PRESET_SIGNATURES.map((preset) => (
                  <div
                    key={preset.id}
                    className={`flex items-center gap-4 p-4 border border-white/20 rounded-lg bg-white/5 transition-colors ${
                      disabled 
                        ? "opacity-50 cursor-not-allowed" 
                        : "hover:bg-white/10 cursor-pointer"
                    }`}
                    onClick={disabled ? undefined : () => handlePresetSignature(preset)}
                  >
                    <img
                      src={preset.data}
                      alt={preset.name}
                      className="w-20 h-8 object-contain bg-white rounded border"
                    />
                    <span className="text-white flex-1">{preset.name}</span>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-primary text-background hover:bg-primary/90"
                      disabled={disabled}
                    >
                      Use
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
