import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";

export default function AllToolsLayout() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/tools");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div>
      <Outlet />
    </div>
  );
}
