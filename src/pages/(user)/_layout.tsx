import BottomBar from "@/components/Dashboard/Layouts/BottomBar";
import Navbar from "@/components/Dashboard/Layouts/Navbar";
import Sidebar from "@/components/Dashboard/Layouts/Sidebar";
import ProtectedLayout from "@/layouts/ProtectedLayout";
import { Outlet } from "react-router-dom"; // or next/router if using Next.js

export default function DashboardLayout() {
  return (
    <ProtectedLayout>
      <div className="flex h-screen text-white">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-background pb-30">
          <Navbar />
          <div className="px-3 sm:px-6 md:px-10 py-5">
            <Outlet />
          </div> {/* Renders child routes like dashboard, wallet, etc. */}
        </main>
        <BottomBar />
      </div>
    </ProtectedLayout>
  );
}
