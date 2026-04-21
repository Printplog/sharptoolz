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
}

export const ConfirmAction: React.FC<ConfirmActionProps> = ({
  title = "Are you absolutely sure?",
  description = "This action cannot be undone.",
  onConfirm,
  trigger,
  confirmText = "Continue",
  cancelText = "Cancel",
}) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent className="bg-[#0B0B0F] border-white/20 rounded-[2rem] p-8 text-white">
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
            className="rounded-full px-6 h-11 bg-[#cee88c] text-black font-bold hover:opacity-90 transition-all border-0 shadow-none"
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
