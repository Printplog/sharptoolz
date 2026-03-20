import React, { useRef, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { FileJson, Download, Upload, AlertCircle, Layers } from "lucide-react";
import { toast } from "sonner";
import { validateSvgId } from "@/lib/utils/svgIdValidator";
import type { SvgPatch } from "@/types";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PatchManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patches: SvgPatch[];
  onImportPatches?: (patches: SvgPatch[]) => void;
  templateName?: string;
}

const PatchManager: React.FC<PatchManagerProps> = ({ 
  open,
  onOpenChange,
  patches, 
  onImportPatches,
  templateName = "template"
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [pendingPatches, setPendingPatches] = useState<SvgPatch[]>([]);
  const [validationErrors, setValidationErrors] = useState<{id: string, error: string}[]>([]);

  // Smart Grouping Logic
  // We want to group patches by their "Final Identity"
  const groupedPatches = useMemo(() => {
    // 1. Map to track ID renames: currentId -> originalId
    // If a patch says: {id: 'A', attribute: 'id', value: 'B'}
    // Then 'B' maps back to 'A'.
    const idMap: Record<string, string> = {};
    
    // First pass: identify ID changes to build the mapping
    patches.forEach(p => {
      if (p.attribute === 'id' && typeof p.value === 'string') {
        idMap[p.value] = p.id;
      }
    });

    // Helper to find the "root" or "identity" ID
    const getIdentityId = (currentId: string): string => {
      let id = currentId;
      // Follow the chain back if multiple renames occurred
      while (idMap[id]) {
        id = idMap[id];
      }
      return id;
    };

    const groups: Record<string, SvgPatch[]> = {};
    
    patches.forEach(p => {
      // Find the identity this patch belongs to
      // If the patch itself is changing the ID, the "target" is the identity
      const identity = p.attribute === 'id' ? p.id : getIdentityId(p.id);
      
      if (!groups[identity]) groups[identity] = [];
      groups[identity].push(p);
    });
    
    return groups;
  }, [patches]);

  const handleExport = () => {
    if (patches.length === 0) {
      toast.info("No patches to export");
      return;
    }

    const blob = new Blob([JSON.stringify(patches, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${templateName.replace(/\s+/g, "_")}_patches.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${patches.length} patches`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const imported = JSON.parse(content);

        if (!Array.isArray(imported)) {
          toast.error("Invalid file format: Expected an array of patches");
          return;
        }

        const errors: {id: string, error: string}[] = [];
        const validatedPatches = imported.filter((p: any) => {
          if (!p.id || !p.attribute) return false;
          const result = validateSvgId(p.id);
          if (!result.valid) {
            errors.push({ id: p.id, error: result.error || "Invalid ID syntax" });
          }
          return true;
        });

        if (errors.length > 0) {
          setValidationErrors(errors);
          setPendingPatches(validatedPatches);
          setShowValidationDialog(true);
        } else {
          onImportPatches?.(validatedPatches);
          toast.success(`Imported ${validatedPatches.length} patches successfully`);
        }
      } catch (err) {
        toast.error("Failed to parse JSON file");
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    onImportPatches?.(pendingPatches);
    toast.success(`Imported ${pendingPatches.length} patches`);
    setShowValidationDialog(false);
    setPendingPatches([]);
    setValidationErrors([]);
  };

  const identityIds = Object.keys(groupedPatches);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f0f12] border-white/10 text-white max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden shadow-2xl rounded-3xl">
        <DialogHeader className="p-7 pb-5 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-[0_0_20px_rgba(206,232,140,0.1)]">
                <FileJson className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight uppercase leading-none mb-1 text-white/95">Patch Manager</DialogTitle>
                <DialogDescription className="text-white/30 text-[10px] font-bold uppercase tracking-[0.12em] flex items-center gap-2">
                  <Layers className="h-3 w-3" />
                  {patches.length} Changes • {identityIds.length} Layers
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleImportClick}
                className="h-8 bg-white/5 border-white/10 hover:bg-white/10 text-[9px] font-bold uppercase tracking-widest gap-2 rounded-xl px-3"
              >
                <Upload className="h-3 w-3" />
                Import
              </Button>
              <Button 
                variant="vibrant" 
                size="sm" 
                onClick={handleExport}
                className="h-8 text-[9px] font-bold uppercase tracking-widest gap-2 px-5 rounded-xl shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)]"
              >
                <Download className="h-3 w-3" />
                Export
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col relative bg-[#0a0a0c]">
          {identityIds.length > 0 ? (
            <ScrollArea className="flex-1 px-7 py-5">
              <div className="space-y-6">
                {identityIds.map((identityId) => {
                  // Find if there was a rename to show the "Final" ID in the header
                  const identityPatches = groupedPatches[identityId];
                  const idPatch = identityPatches.find(p => p.attribute === 'id');
                  const displayId = idPatch ? String(idPatch.value) : identityId;
                  const isRenamed = !!idPatch;

                  return (
                    <div key={identityId} className="relative group">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors duration-300 shadow-[0_0_8px_rgba(206,232,140,0.4)]" />
                        <h3 className="text-[11px] font-black text-white/90 uppercase tracking-widest truncate max-w-[400px] flex items-center gap-2">
                          {displayId}
                          {isRenamed && <span className="text-[8px] text-white/20 font-bold lowercase tracking-normal"> (renamed from {identityId})</span>}
                        </h3>
                        <div className="h-px flex-1 bg-white/5" />
                      </div>
                      
                      <div className="ml-4 space-y-2">
                        {identityPatches.map((patch, pIdx) => (
                          <div key={`${pIdx}`} className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.03] hover:border-white/10 hover:bg-white/[0.05] transition-all duration-300">
                            <div className="flex items-center justify-between">
                              <span className="text-[8px] font-black uppercase text-primary tracking-[0.2em] bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">
                                {patch.attribute}
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-white/50 leading-relaxed break-all bg-black/20 p-2 rounded-lg border border-white/5 mx-[-2px]">
                              {typeof patch.value === 'object' ? JSON.stringify(patch.value) : String(patch.value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-16 text-white/10">
              <div className="w-20 h-20 rounded-[2.5rem] bg-white/[0.02] border border-dashed border-white/10 flex items-center justify-center mb-6">
                <FileJson className="h-10 w-10 opacity-10" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.2em]">No Active Changes</p>
              <p className="text-[10px] opacity-40 mt-3 max-w-[240px] leading-relaxed font-medium">
                Edits made in the inspector will appear here, grouped by element for clarity.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 bg-black/60 border-t border-white/5 backdrop-blur-md">
           <p className="text-[9px] text-white/15 font-bold uppercase tracking-widest text-center italic">
             All incremental patches are synchronized with the backend upon save.
           </p>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: "none" }} 
          accept=".json"
          onChange={handleFileChange}
        />

        <AlertDialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
          <AlertDialogContent className="bg-[#111] border-white/10 max-w-md rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <span>ID Syntax Warnings</span>
              </AlertDialogTitle>
              <AlertDialogDescription className="text-white/60 text-xs">
                The following patches contain IDs that do not follow the mandatory DSL rules.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <ScrollArea className="max-h-[180px] mt-4 rounded-xl border border-white/5 bg-black/20 p-3">
              <div className="space-y-3">
                {validationErrors.map((err, i) => (
                  <div key={i} className="text-[10px] border-b border-white/5 pb-2 last:border-0 last:pb-0">
                    <div className="font-mono text-white/80 truncate mb-1">{err.id}</div>
                    <div className="text-red-400/80 font-bold uppercase tracking-tighter">{err.error}</div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <AlertDialogFooter className="mt-6 flex gap-2">
              <AlertDialogCancel onClick={() => setShowValidationDialog(false)} className="bg-white/5 text-white border-0 rounded-xl h-10">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmImport} className="bg-yellow-600 text-white border-0 font-black uppercase tracking-widest rounded-xl h-10 text-[9px] flex-1">Import Anyway</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};

export default PatchManager;
