import Navbar from "@/components/Dashboard/Layouts/Navbar";
import Sidebar from "@/components/Dashboard/Layouts/Sidebar";
import { Outlet } from "react-router-dom"; // or next/router if using Next.js

export default function DashboardLayout() {
  return (
    <div className="flex h-screen text-white">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6 bg-background/70">
        <Navbar />
        <Outlet /> {/* Renders child routes like dashboard, wallet, etc. */}
      </main>
    </div>
  );
}