import { useDialogStore } from "@/store/dialogStore";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export default function useDialog() {
    const [params] = useSearchParams();
    const dialog = params.get("dialog") as string;
    const { openDialog } = useDialogStore();
    
      useEffect(() => {
        openDialog(dialog);
      }, [dialog, openDialog]);
}