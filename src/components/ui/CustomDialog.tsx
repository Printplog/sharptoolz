// components/CustomDialog.tsx
import * as React from 'react';
import { Dialog as ShadcnDialog } from '@/components/ui/dialog'; // shadcn Dialog
import { useDialogStore } from '@/store/dialogStore';
import { useLocation, useNavigate } from 'react-router-dom';

// Define props for CustomDialog
interface CustomDialogProps
  extends Omit<React.ComponentProps<typeof ShadcnDialog>, 'open' | 'onOpenChange'> {
  dialogName: string;
}

const CustomDialog = React.forwardRef<
  React.ElementRef<typeof ShadcnDialog>,
  CustomDialogProps
>(({ dialogName, children, ...props }) => {
  const { dialogs, closeDialog } = useDialogStore();
  const navigate = useNavigate();
  const location = useLocation();



  return (
    <ShadcnDialog
      open={dialogs[dialogName]} // Controlled by store
      onOpenChange={(open) => {
        if (!open) {
          closeDialog(dialogName);
          navigate(location.pathname, { replace: true });
        } // Update store on close
      }}
      {...props}
    >
      {children}
    </ShadcnDialog>
  );
});

CustomDialog.displayName = 'CustomDialog';

export { CustomDialog };