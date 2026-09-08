import * as React from "react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface ConfirmActionProps {
  title?: string;
  description?: string;
  onConfirm: () => void | Promise<void>;
  trigger: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

export const ConfirmAction: React.FC<ConfirmActionProps> = ({
  title = "Are you absolutely sure?",
  description = "This action cannot be undone.",
  onConfirm,
  trigger,
  confirmText = "Continue",
  cancelText = "Cancel",
  variant = "default",
}) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent className="p-8">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full px-6 h-11 bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              await onConfirm();
            }}
            className={
              variant === "destructive"
                ? "h-11 rounded-full border-0 bg-red-500 px-6 font-bold text-white shadow-none transition-colors hover:bg-red-400 hover:text-white"
                : "h-11 rounded-full border-0 bg-[#cee88c] px-6 font-bold text-black shadow-none transition-all hover:opacity-90"
            }
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
