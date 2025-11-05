import { useState } from "react";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import { CustomDialog } from "../ui/CustomDialog";
import { DialogContent } from "../ui/dialog";

export default function RegisterDialog() {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <CustomDialog dialogName="register">
      <DialogContent>
        {mode === "login" ? <Login dialog={true} /> : <Register dialog={true} />}
        <div className="mt-4 text-center">
          {mode === "login" ? (
            <div className="text-sm">
              <span className="text-muted-foreground">Don't have an account?</span>
              <button
                type="button"
                onClick={() => setMode("register")}
                className="ml-2 text-primary underline decoration-dotted cursor-pointer"
              >
                Register
              </button>
            </div>
          ) : (
            <div className="text-sm">
              <span className="text-muted-foreground">Already have an account?</span>
              <button
                type="button"
                onClick={() => setMode("login")}
                className="ml-2 text-primary underline decoration-dotted cursor-pointer"
              >
                Login
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </CustomDialog>
  );
}
