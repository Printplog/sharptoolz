import React, { useState, useRef } from 'react';
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
}

// Pre-made signature options - Using local images from /sign/ directory
const PRESET_SIGNATURES = [
  { 
    id: 'preset1', 
    name: 'Preset Signature 1', 
    data: '/sign/preset1.png'
  },
  { 
    id: 'preset2', 
    name: 'Preset Signature 2', 
    data: '/sign/preset2.png'
  },
  { 
    id: 'preset3', 
    name: 'Preset Signature 3', 
    data: '/sign/preset3.png'
  },
  { 
    id: 'preset4', 
    name: 'Preset Signature 4', 
    data: '/sign/preset4.png'
  },
  { 
    id: 'preset5', 
    name: 'Preset Signature 5', 
    data: '/sign/preset5.png'
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
}: SignatureFieldProps) {
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
    // Convert image URL to data URL for consistency
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        onSignatureSelect(fieldId, dataUrl);
        setIsDialogOpen(false);
      }
    };
    img.onerror = () => {
      // Fallback: use the URL directly if image conversion fails
      onSignatureSelect(fieldId, preset.data);
      setIsDialogOpen(false);
    };
    img.src = preset.data;
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
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleRemoveSignature}
              className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
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
                      width,
                      height,
                      className: 'signature-canvas',
                      style: { backgroundColor }
                    }}
                    penColor={penColor}
                  />
                </div>
              </div>
              
              <div className="flex justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearSignature}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Clear
                </Button>
                <Button
                  type="button"
                  onClick={handleDrawSignature}
                  className="bg-primary text-background hover:bg-primary/90"
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
                    className="flex items-center gap-4 p-4 border border-white/20 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                    onClick={() => handlePresetSignature(preset)}
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
