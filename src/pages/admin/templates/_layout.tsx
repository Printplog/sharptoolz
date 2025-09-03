import { Outlet } from "react-router-dom";
import AdminLayout from "@/layouts/ProtectedLayout";

export default function TemplatesLayout() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
