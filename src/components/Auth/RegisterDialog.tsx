import Register from "@/pages/auth/register";
import { CustomDialog } from "../ui/CustomDialog";
import { DialogContent } from "../ui/dialog";

export default function RegisterDialog() {
  return (
    <CustomDialog dialogName="register">
      <DialogContent>
        <Register />
      </DialogContent>
    </CustomDialog>
  );
}
