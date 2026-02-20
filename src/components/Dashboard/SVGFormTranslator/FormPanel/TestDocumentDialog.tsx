import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";

type TestDocumentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTest: () => void;
  onCreatePaid: () => void;
  isSubmitting: boolean;
  price?: number;
};

export function TestDocumentDialog({
  open,
  onOpenChange,
  onCreateTest,
  onCreatePaid,
  isSubmitting,
  price = 5,
}: TestDocumentDialogProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isSubmitting) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return 90;
          return prev + 20;
        });
      }, 300);
      return () => clearInterval(interval);
    } else {
      setProgress((prev) => (prev > 0 && prev < 100 ? 100 : prev));
    }
  }, [isSubmitting]);

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        // Prevent closing while submitting
        if (!isSubmitting) {
          onOpenChange(open);
        }
      }}
    >
      <DialogContent
        className="max-w-sm text-center space-y-4"
        showCloseButton={!isSubmitting}
        onInteractOutside={(e) => {
          // Prevent closing by clicking outside while submitting
          if (isSubmitting) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing with Escape key while submitting
          if (isSubmitting) {
            e.preventDefault();
          }
        }}
      >
        {isSubmitting ? (
          <>
            <h2 className="text-lg font-semibold">Creating Document...</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Processing your document</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Please wait while we create your document
              </p>
            </div>
          </>
        ) : progress === 100 ? (
          <>
            <h2 className="text-lg font-semibold text-green-600">Document Created!</h2>
            <p className="text-sm text-muted-foreground">
              Your document has been successfully created.
            </p>
            <Progress value={100} className="h-2" />
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold">Create Document</h2>
            <p>
              Do you want to create a{" "}
              <strong className="text-primary">test document</strong> (with watermark) or pay{" "}
              <strong className="text-primary">${price}</strong> for the final version?
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <Button
                onClick={onCreateTest}
                variant="outline"
                disabled={isSubmitting}
              >
                Test Document
              </Button>
              <Button onClick={onCreatePaid} disabled={isSubmitting}>
                Pay &amp; Create
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

