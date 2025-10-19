import React, { useState } from "react";
import { HelpCircle, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface FieldHelperProps {
  fieldName: string;
  helperText: string;
  tutorialUrl?: string;
}

const FieldHelper: React.FC<FieldHelperProps> = ({
  fieldName,
  helperText,
  tutorialUrl,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <HelpCircle
        className="inline-block w-4 h-4 ml-1 text-white/60 hover:text-white cursor-pointer transition-colors"
        onClick={() => setIsOpen(true)}
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-gray-900 border-white/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">{fieldName} Help</DialogTitle>
          </DialogHeader>
          
          <DialogDescription className="text-white/80 text-base leading-relaxed">
            {helperText}
          </DialogDescription>

          {tutorialUrl && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <Button
                onClick={() => window.open(tutorialUrl, "_blank")}
                className="w-full bg-primary/60 hover:bg-primary/50 text-white"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Still confused? Watch Tutorial
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FieldHelper;
