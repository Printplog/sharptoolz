import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type TestDocumentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTest: () => void;
  onCreatePaid: () => void;
  isSubmitting: boolean;
};

export function TestDocumentDialog({
  open,
  onOpenChange,
  onCreateTest,
  onCreatePaid,
  isSubmitting,
}: TestDocumentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center space-y-4">
        <h2 className="text-lg font-semibold">Create Document</h2>
        <p>
          Do you want to create a{" "}
          <strong className="text-primary">test document</strong> (with watermark) or pay{" "}
          <strong className="text-primary">$5</strong> for the final version?
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
      </DialogContent>
    </Dialog>
  );
}

