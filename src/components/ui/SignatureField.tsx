import React, { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Upload, Pen, Type, RotateCcw, Check, X, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import SignatureCanvas from 'react-signature-canvas';
import { LazyImage } from '@/components/LazyImage';
import { getSvgElementDimensions } from "@/lib/utils/svgDimensions";

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

  const handlePresetSignature = async (preset: typeof PRESET_SIGNATURES[0]) => {
    try {
      // Fetch the image and convert to base64 so it can be safely embedded in SVG for Canvas rendering
      // This is crucial because drawn/uploaded signatures are base64, and Canvas requires it to avoid taint
      const response = await fetch(preset.data);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        onSignatureSelect(fieldId, reader.result as string);
        setIsDialogOpen(false);
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error("Failed to load preset signature as base64", e);
      // Fallback to raw URL if fetch fails
      onSignatureSelect(fieldId, preset.data);
      setIsDialogOpen(false);
    }
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

      <div className="relative">
        <div
          className={`block w-full h-40 border-2 border-dashed rounded-lg transition-colors overflow-hidden ${disabled
            ? "border-white/10 bg-white/5 cursor-not-allowed opacity-50"
            : "border-white/20 cursor-pointer hover:border-white/40"
            }`}
          onClick={() => {
            if (!disabled) {
              setIsDialogOpen(true);
            }
          }}
        >
          {currentValue ? (
            <div className="relative w-full h-full group">
              <div className="w-full h-full overflow-auto custom-scrollbar">
                <img
                  src={currentValue}
                  alt={`${fieldName} signature`}
                  className="w-full max-w-none h-auto object-contain min-h-full"
                />
              </div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <div className="text-center text-white">
                  <div className="text-sm font-medium">Click to change signature</div>
                  <div className="text-xs opacity-80">Draw or upload a new signature</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white/60 hover:text-white/80 transition-colors">
              <div className="w-12 h-12 border-2 border-dashed border-current rounded-full flex items-center justify-center mb-3">
                <Pen className="w-6 h-6" />
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">Click to add signature</div>
                <div className="text-xs opacity-80">Draw or upload a signature</div>
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
                setIsDialogOpen(true);
              }}
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              disabled={disabled}
            >
              <Pen className="h-3.5 w-3.5 mr-1.5" />
              Draw New
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadSignature();
              }}
              className="bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30"
              disabled={disabled}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveSignature();
              }}
              className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
              disabled={disabled}
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Remove
            </Button>
          </div>
        )}
      </div>

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
                  <div style={{ position: 'relative' }}>
                    <SignatureCanvas
                      ref={signatureRef}
                      canvasProps={{
                        width: canvasWidth,
                        height: canvasHeight,
                        className: 'signature-canvas',
                        style: { backgroundColor }
                      }}
                      penColor={penColor}
                      minWidth={1}
                      maxWidth={3}
                      velocityFilterWeight={0.7}
                    />
                    {disabled && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'transparent',
                        cursor: 'not-allowed',
                        zIndex: 10
                      }} />
                    )}
                  </div>
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
                  className="bg-primary text-black hover:bg-primary/90"
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
                    className={`flex items-center gap-4 p-4 border border-white/20 rounded-lg bg-white/5 transition-colors ${disabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-white/10 cursor-pointer"
                      }`}
                    onClick={disabled ? undefined : () => handlePresetSignature(preset)}
                  >
                    <LazyImage
                      src={preset.data}
                      alt={preset.name}
                      className="w-20 h-8 object-contain bg-white rounded border"
                      placeholderColor="#ffffff"
                    />
                    <span className="text-white flex-1">{preset.name}</span>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-primary text-black hover:bg-primary/90"
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
