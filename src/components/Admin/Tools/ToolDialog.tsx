// Tool Add/Edit Dialog Component
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Tool } from "@/types";

interface ToolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool?: Tool | null; // null for add, Category for edit
  onSave: (data: { name: string; description?: string; price: number }) => void;
  isLoading?: boolean;
}

export default function ToolDialog({
  open,
  onOpenChange,
  tool,
  onSave,
  isLoading = false,
}: ToolDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("5");

  const isEditing = !!tool;

  // Reset form when dialog opens/closes or tool changes
  useEffect(() => {
    if (open) {
      setName(tool?.name || "");
      setDescription(tool?.description || "");
      setPrice(tool?.price?.toString() || "5");
    } else {
      setName("");
      setDescription("");
      setPrice("5");
    }
  }, [open, tool]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      price: parseFloat(price) || 0,
    });
  };

  const handlePriceChange = (value: string) => {
    // Only allow positive numbers and a single decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setPrice(value);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🔧 {isEditing ? "Edit Tool" : "Add New Tool"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the tool details below."
              : "Create a new tool to organize your templates."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tool Name */}
          <div className="space-y-2">
            <Label htmlFor="tool-name" className="text-sm font-medium">
              Tool Name *
            </Label>
            <Input
              id="tool-name"
              placeholder="e.g., Shipping Labels, Business Cards, Invoices"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0"
              maxLength={100}
              required
            />
            <div className="text-xs text-white/60">
              {name.length}/100 characters
            </div>
          </div>

          {/* Tool Description */}
          <div className="space-y-2">
            <Label htmlFor="tool-description" className="text-sm font-medium">
              Description <span className="text-white/60">(optional)</span>
            </Label>
            <Textarea
              id="tool-description"
              placeholder="Brief description of what templates belong in this tool..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0 min-h-[80px]"
              rows={3}
            />
            <div className="text-xs text-white/60">
              Help users understand what types of templates belong in this tool.
            </div>
          </div>

          {/* Tool Price */}
          <div className="space-y-2">
            <Label htmlFor="tool-price" className="text-sm font-medium">
              Price (USD) *
            </Label>
            <Input
              id="tool-price"
              type="text"
              inputMode="decimal"
              placeholder="5.00"
              value={price}
              onChange={(e) => handlePriceChange(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0"
              required
            />
            <div className="text-xs text-white/60">
              The amount users will be charged to remove the watermark from templates in this tool.
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isLoading}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {isEditing ? "Updating..." : "Creating..."}
                </div>
              ) : (
                isEditing ? "Update Tool" : "Create Tool"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
