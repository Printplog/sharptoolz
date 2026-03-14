import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { Button } from './button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Upload, Pen, RotateCcw, X, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import SignatureCanvas from 'react-signature-canvas';
import { getSvgElementDimensions } from "@/lib/utils/svgDimensions";
import { useDropzone } from "react-dropzone";
import { Slider } from './slider';

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

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'draw' | 'preset'>('draw');
  //   const [isProcessing, setIsProcessing] = useState(false);

  const [strokeWidth, setStrokeWidth] = useState([2]);
  const [internalCanvasSize, setInternalCanvasSize] = useState({ width: 400, height: 150 });
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasHeight = dimensions?.height || 150;
  const signatureRef = useRef<SignatureCanvas>(null);

  // Sync internal canvas resolution with rendered screen size to fix coordinate mismatch
  // useLayoutEffect ensures the canvas is resized before the browser paints
  useLayoutEffect(() => {
    if (!containerRef.current || activeTab !== 'draw' || !isDialogOpen) return;

    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        // Only update if dimensions actually changed to avoid unnecessary clears
        setInternalCanvasSize(prev => {
          if (prev.width === clientWidth && prev.height === clientHeight) return prev;
          return { width: clientWidth, height: clientHeight };
        });
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      // Use requestAnimationFrame to ensure we're syncing with the browser's render cycle
      window.requestAnimationFrame(updateSize);
    });
    
    resizeObserver.observe(containerRef.current);
    updateSize();

    return () => resizeObserver.disconnect();
  }, [activeTab, isDialogOpen]);

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
  };

  const handleDownloadSignature = () => {
    if (currentValue) {
      const link = document.createElement('a');
      link.download = `${fieldName}-signature.png`;
      link.href = currentValue;
      link.click();
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        onSignatureSelect(fieldId, dataUrl);
        setIsDialogOpen(false);
      };
      reader.readAsDataURL(file);
    }
  }, [fieldId, onSignatureSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    disabled: disabled,
    multiple: false,
  });

  return (
    <div className={cn("space-y-2 w-full", className)}>
      {fieldName && (
        <label htmlFor={fieldId} className="text-sm font-medium text-white/90">
          {fieldName}
        </label>
      )}

      <div className="relative">
        <div
          className={`block w-full h-40 border-2 border-dashed rounded-lg transition-all duration-300 overflow-hidden group ${disabled
            ? "border-white/10 bg-white/5 cursor-not-allowed opacity-50"
            : "border-white/20 cursor-pointer hover:border-white/40 hover:bg-white/5"
            }`}
          onClick={() => {
            if (!disabled) {
              setIsDialogOpen(true);
            }
          }}
        >
          {currentValue ? (
            <div className="relative w-full h-full">
              <div className="w-full h-full flex items-center justify-center p-4">
                <img
                  src={currentValue}
                  alt={`${fieldName} signature`}
                  className="max-w-full max-h-full object-contain filter brightness-110"
                />
              </div>
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                <div className="text-center transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <div className="text-sm font-bold text-white uppercase tracking-tighter">Change Signature</div>
                  <div className="text-[10px] text-white/60 font-medium mt-1">Draw or upload a new one</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white/60 hover:text-white/80 transition-all duration-300">
              <div className="w-12 h-12 border-2 border-dashed border-current rounded-full flex items-center justify-center mb-3">
                <Pen className="w-6 h-6" />
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">{isDialogOpen ? "Opening..." : "Add Signature"}</div>
                <div className="text-xs opacity-80 mt-1">Tap to draw or upload</div>
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
              <Download className="h-3.5 w-3.5" />
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
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg bg-[#0a0a0c] border-white/10 p-0 overflow-hidden shadow-2xl rounded-2xl">
          <div className="p-4 pb-0">
            <DialogHeader className="mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Pen className="w-4 h-4 text-primary" />
                </div>
                <DialogTitle className="text-sm font-bold uppercase tracking-tight text-white/90">
                  Add {fieldName}
                </DialogTitle>
              </div>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'draw' | 'upload' | 'preset')} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-black/40 border border-white/5 h-9 p-0.5 rounded-lg mb-4">
                <TabsTrigger value="draw" className="rounded-md font-bold text-[9px] uppercase tracking-wider text-white/40 data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all h-full">
                  Draw
                </TabsTrigger>
                <TabsTrigger value="upload" className="rounded-md font-bold text-[9px] uppercase tracking-wider text-white/40 data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all h-full">
                  Upload
                </TabsTrigger>
                <TabsTrigger value="preset" className="rounded-md font-bold text-[9px] uppercase tracking-wider text-white/40 data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all h-full">
                  Preset
                </TabsTrigger>
              </TabsList>

              <div className="min-h-[220px] flex flex-col items-center justify-center">
                {/* Draw Signature Tab */}
                <TabsContent value="draw" className="w-full space-y-3 m-0 animate-in fade-in duration-300">
                  <div className="flex flex-col items-center w-full">
                    <div 
                      ref={containerRef}
                      className="w-full border border-white/10 rounded-xl overflow-hidden bg-white shadow-xl flex items-center justify-center p-0"
                      style={{ height: canvasHeight }}
                    >
                      <SignatureCanvas
                        ref={signatureRef}
                        canvasProps={{
                          width: internalCanvasSize.width,
                          height: internalCanvasSize.height,
                          className: 'signature-canvas', // REMOVED w-full h-full to prevent coordinate mismatch
                          style: { backgroundColor, display: 'block' }
                        }}
                        penColor={penColor}
                        minWidth={strokeWidth[0] - 0.5}
                        maxWidth={strokeWidth[0] + 0.5}
                        velocityFilterWeight={0.7}
                      />
                    </div>
                    
                    <div className="w-full max-w-[400px] mt-4 space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Pen Size</span>
                        <span className="text-[9px] font-bold text-primary uppercase">{strokeWidth[0]}px</span>
                      </div>
                      <Slider 
                        value={strokeWidth} 
                        onValueChange={setStrokeWidth} 
                        min={0.5} 
                        max={4} 
                        step={0.5}
                        className="w-full"
                      />
                    </div>

                    <div className="mt-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearSignature}
                        className="h-8 text-[9px] font-bold uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 rounded-lg"
                        disabled={disabled}
                      >
                        <RotateCcw className="w-3 h-3 mr-2" />
                        Clear Canvas
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Upload Signature Tab */}
                <TabsContent value="upload" className="w-full m-0 animate-in fade-in duration-300">
                  <div 
                    {...getRootProps()} 
                    className={cn(
                      "w-full h-40 border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden group",
                      isDragActive ? "border-primary bg-primary/5" : "border-white/10 bg-white/5 hover:border-white/20"
                    )}
                  >
                    <input {...getInputProps()} />
                    <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center transition-all group-hover:scale-105">
                      <Upload className={cn("w-4 h-4 transition-colors", isDragActive ? "text-primary" : "text-white/40")} />
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-white/60">
                      {isDragActive ? "Drop here" : "Choose File"}
                    </div>
                  </div>
                </TabsContent>

                {/* Preset Signature Tab */}
                <TabsContent value="preset" className="w-full m-0 animate-in fade-in duration-300">
                  <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                    {PRESET_SIGNATURES.map((preset) => (
                      <div
                        key={preset.id}
                        className={cn(
                          "group h-14 rounded-lg border border-white/5 bg-white hover:border-primary transition-all p-1 flex items-center justify-center shadow-sm",
                          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                        )}
                        onClick={disabled ? undefined : () => handlePresetSignature(preset)}
                      >
                        <img
                          src={preset.data}
                          alt={preset.name}
                          className="max-h-[80%] max-w-[80%] object-contain transition-transform group-hover:scale-110"
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          <div className="p-3 bg-white/5 border-t border-white/10 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsDialogOpen(false)}
              className="h-8 text-[9px] font-bold uppercase tracking-widest text-white/60 hover:text-white"
            >
              Cancel
            </Button>
            
            {activeTab === 'draw' && (
              <Button
                type="button"
                size="sm"
                onClick={handleDrawSignature}
                className="bg-primary text-black font-bold uppercase tracking-widest text-[9px] rounded-lg h-8 px-5"
                disabled={disabled}
              >
                Done
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
