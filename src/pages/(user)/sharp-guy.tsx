import SharpGuyChat from "@/components/Dashboard/SharpGuy";
import { useQuery } from "@tanstack/react-query";
import { getSiteSettings } from "@/api/apiEndpoints";
import { Navigate } from "react-router-dom";
import SvgFormTranslatorSkeleton from "@/components/Dashboard/SVGFormTranslator/SvgFormTranslatorSkeleton";

export default function SharpGuyPage() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ["siteSettings"],
    queryFn: getSiteSettings,
  });

  if (isLoading) return <SvgFormTranslatorSkeleton />;
  
  if (settings && !settings.enable_ai_features) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="sharp-guy-page">
      <SharpGuyChat />
    </div>
  );
}
