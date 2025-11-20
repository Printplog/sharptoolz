import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type UnsavedChangesDialogProps = {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
  onSaveAndLeave: () => void;
  isSaving: boolean;
  disableActions?: boolean;
};

export function UnsavedChangesDialog({
  open,
  onStay,
  onLeave,
  onSaveAndLeave,
  isSaving,
  disableActions,
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(val) => !val && onStay()}>
      <AlertDialogContent className="border-white/10 bg-background text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
          <AlertDialogDescription className="text-white/70">
            You&apos;ve made changes to this document. Save them before leaving so your latest
            edits are included in future downloads.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onStay} disabled={isSaving}>
            Stay on page
          </Button>
          <Button
            variant="destructive"
            onClick={onLeave}
            disabled={isSaving}
          >
            Leave without saving
          </Button>
          <Button
            onClick={onSaveAndLeave}
            disabled={isSaving || disableActions}
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              "Save & Leave"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

