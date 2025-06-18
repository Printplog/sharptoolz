import Navbar from "@/components/Admin/Layouts/Navbar";
import Sidebar from "@/components/Admin/Layouts/Sidebar";
import BuilderDialog from "@/components/Admin/ToolBuilder/BuilderDialog";
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
    <div className="flex h-screen text-white">
      <Sidebar />
      <main className="flex-1 overflow-auto px-6 md:px-10 py-5 bg-background/70 pb-30">
        <Navbar />
        <Outlet /> 
      </main>
      <BuilderDialog />
    </div>
  );
}
