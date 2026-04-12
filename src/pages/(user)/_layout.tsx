import BottomBar from "@/components/Dashboard/Layouts/BottomBar";
import Navbar from "@/components/Dashboard/Layouts/Navbar";
import Sidebar from "@/components/Dashboard/Layouts/Sidebar";
import GlobalAnnouncement from "@/components/Dashboard/Layouts/GlobalAnnouncement";
import Disclaimer from "@/components/Disclaimer";
import { AdminConsole } from "@/components/Admin/Layouts/AdminConsole";
import ProtectedLayout from "@/layouts/ProtectedLayout";
import { useDialogStore } from "@/store/dialogStore";
import { useEffect } from "react";
import { Outlet, useSearchParams, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function DashboardLayout() {
  const [params] = useSearchParams();
  const location = useLocation();
  const dialog = params.get("dialog") as string;
  const { openDialog } = useDialogStore();

  const isSharpGuy = location.pathname.startsWith("/sharp-guy");

  useEffect(() => {
    openDialog(dialog);
  }, [dialog, openDialog]);

  return (
    <ProtectedLayout>
      <div className="flex h-screen text-white">
        <Sidebar />
        <main className={cn(
          "flex-1 bg-background transition-all duration-300",
          isSharpGuy ? "overflow-hidden pb-0 md:pb-30" : "overflow-auto pb-30"
        )}>
          {!isSharpGuy && <GlobalAnnouncement />}
          <div className={cn(isSharpGuy && "hidden md:block")}>
            <Navbar />
          </div>
          <div className={cn(
            "transition-all duration-300",
            isSharpGuy ? "py-0 px-0 md:px-10 md:py-5" : "py-5 px-3 sm:px-6 md:px-10"
          )}>
            <Outlet />
            {!isSharpGuy && <Disclaimer />}
          </div>
        </main>
        <div className={cn(isSharpGuy && "hidden md:block")}>
          <BottomBar />
        </div>
        <AdminConsole />
      </div>
    </ProtectedLayout>
  );
}
