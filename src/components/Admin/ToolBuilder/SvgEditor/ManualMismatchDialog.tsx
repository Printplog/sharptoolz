
import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, ArrowRight, Tag } from 'lucide-react';
import { type MismatchReport } from '@/store/useSvgStore';

interface ManualMismatchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    report: MismatchReport | null;
    onConfirm: (manualMap: Record<string, string>) => void;
}

export const ManualMismatchDialog: React.FC<ManualMismatchDialogProps> = ({
    open,
    onOpenChange,
    report,
    onConfirm
}) => {
    const [manualMap, setManualMap] = useState<Record<string, string>>({});

    if (!report) return null;

    const handleMap = (newBaseId: string, oldBaseId: string) => {
        setManualMap(prev => ({
            ...prev,
            [newBaseId]: oldBaseId
        }));
    };

    const hasNew = report.unmatchedNew.length > 0;
    const hasOld = report.unmatchedOld.length > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#111] border-white/10 text-white max-w-2xl flex flex-col max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                        Resolve ID Mismatches
                    </DialogTitle>
                    <DialogDescription className="text-white/60">
                        Some elements in the new SVG don't match your existing IDs. You can manually link them below.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 pr-4 -mr-4">
                    <div className="space-y-6 py-4">
                        {hasNew && (
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                                    New Elements to Assign ({report.unmatchedNew.length})
                                </h4>
                                <div className="space-y-2">
                                    {report.unmatchedNew.map((item) => (
                                        <div 
                                            key={item.id} 
                                            className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] transition-all hover:bg-white/[0.05]"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Tag className="h-3 w-3 text-white/40" />
                                                    <span className="text-xs font-mono text-white/80 truncate">{item.id}</span>
                                                </div>
                                                <div className="text-[10px] text-white/30 uppercase font-bold">{item.tag} element</div>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-white/20 shrink-0" />
                                            <div className="w-56 shrink-0">
                                                <Select 
                                                    value={manualMap[item.id] || "skip"} 
                                                    onValueChange={(val) => handleMap(item.id, val)}
                                                >
                                                    <SelectTrigger className="h-9 bg-white/5 border-white/10 text-xs">
                                                        <SelectValue placeholder="Select ID to apply..." />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#151515] border-white/10 text-white">
                                                        <SelectItem value="skip" className="text-white/40">Keep Current ID</SelectItem>
                                                        {report.unmatchedOld.map(old => (
                                                            <SelectItem key={old.id} value={old.id}>
                                                                <span className="text-xs font-mono">{old.id}</span>
                                                                <span className="ml-2 text-[10px] text-white/30 uppercase">({old.tag})</span>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!hasNew && hasOld && (
                            <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/10">
                                <p className="text-xs text-amber-200/60 leading-relaxed">
                                    The following old IDs were not found and have no new elements to be assigned to:
                                    <span className="block mt-2 font-mono text-amber-500/80">
                                        {report.unmatchedOld.map(o => o.baseId).join(", ")}
                                    </span>
                                </p>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter className="pt-4 border-t border-white/5">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="text-white/40 hover:text-white hover:bg-white/5"
                    >
                        Skip Manual Sync
                    </Button>
                    <Button
                        onClick={() => onConfirm(manualMap)}
                        className="bg-vibrant hover:bg-vibrant/90 text-white font-bold px-8"
                    >
                        Apply Mappings
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
