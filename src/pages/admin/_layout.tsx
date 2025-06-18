import Navbar from "@/components/Admin/Layouts/Navbar";
import Sidebar from "@/components/Admin/Layouts/Sidebar";
import BuilderDialog from "@/components/Admin/ToolBuilder/BuilderDialog";
import ProtectedLayout from "@/layouts/ProtectedLayout";
import { useDialogStore } from "@/store/dialogStore";
import { useEffect } from "react";
import { Outlet, useSearchParams } from "react-router-dom"; // or next/router if using Next.js

export default function AdminLayout() {
  const [params] = useSearchParams();
  const dialog = params.get("dialog") as string;
  const { openDialog } = useDialogStore();

  useEffect(() => {
    openDialog(dialog);
  }, [dialog, openDialog]);

  return (
    <ProtectedLayout>
      <div className="flex h-screen text-white">
        <Sidebar />
        <main className="flex-1 overflow-auto px-3 sm:px-6 md:px-10 bg-background/70 pb-30">
          <Navbar />
          <Outlet />
        </main>
        <BuilderDialog />
      </div>
    </ProtectedLayout>
  );
}
