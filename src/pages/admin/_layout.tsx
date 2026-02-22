import BottomBar from "@/components/Admin/Layouts/BottomBar";
import Navbar from "@/components/Admin/Layouts/Navbar";
import Sidebar from "@/components/Admin/Layouts/Sidebar";
import GlobalAnnouncement from "@/components/Dashboard/Layouts/GlobalAnnouncement";
import BuilderDialog from "@/components/Admin/ToolBuilder/BuilderDialog";
import ProtectedLayout from "@/layouts/ProtectedLayout";
import { useDialogStore } from "@/store/dialogStore";
import { useEffect } from "react";
import { Outlet, useSearchParams, useNavigate, useLocation } from "react-router-dom"; // or next/router if using Next.js

export default function AdminLayout() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dialog = params.get("dialog") as string;
  const { openDialog, dialogs } = useDialogStore();

  useEffect(() => {
    if (dialog) {
      openDialog(dialog);
    }
  }, [dialog, openDialog]);

  // Clear URL parameters when dialog is closed
  useEffect(() => {
    if (!dialogs.toolBuilder && dialog === "toolBuilder") {
      const newParams = new URLSearchParams(params);
      newParams.delete("dialog");
      const newSearch = newParams.toString();
      const newUrl = `${location.pathname}${newSearch ? `?${newSearch}` : ""}`;
      navigate(newUrl, { replace: true });
    }
  }, [dialogs.toolBuilder, dialog, params, location.pathname, navigate]);

  return (
    <ProtectedLayout isAdmin={true}>
      <div className="flex h-screen text-white">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-background pb-30">
          <GlobalAnnouncement />
          <Navbar />
          <div className="px-3 sm:px-6 md:px-10 py-5">
            <Outlet />
          </div>
        </main>
        <BuilderDialog />
        <BottomBar />
      </div>
    </ProtectedLayout>
  );
}
