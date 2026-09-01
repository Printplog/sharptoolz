import { AlertTriangle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PendingDepositChoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  onStartNew: () => Promise<void>;
  isStartingNew: boolean;
  canStartNew: boolean;
}

export default function PendingDepositChoiceDialog({
  open,
  onOpenChange,
  onContinue,
  onStartNew,
  isStartingNew,
  canStartNew,
}: PendingDepositChoiceDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isStartingNew) onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent className="max-w-md p-7 sm:p-8">
        <AlertDialogHeader className="gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10">
            <AlertTriangle className="h-5 w-5 text-amber-300" />
          </div>
          <div className="space-y-2">
            <AlertDialogTitle className="text-xl font-bold tracking-tight text-white">
              Deposit already in progress
            </AlertDialogTitle>
            <AlertDialogDescription className="leading-6 text-white/50">
              Continue with the current payment address, or close it before creating a new one.
              Funds already sent can still arrive after confirmation.
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-3 gap-3 sm:grid sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void onStartNew()}
            disabled={isStartingNew || !canStartNew}
            className="inline-flex h-12 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/5 px-4 text-xs font-semibold text-red-300 transition-colors hover:bg-red-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/60 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isStartingNew ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Cancel & start new
          </button>
          <AlertDialogCancel
            onClick={onContinue}
            disabled={isStartingNew}
            className="m-0 h-12 rounded-xl border-0 bg-white px-4 text-xs font-semibold text-black transition-colors hover:bg-white/90 hover:text-black focus-visible:ring-2 focus-visible:ring-white/60"
          >
            Continue deposit
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
