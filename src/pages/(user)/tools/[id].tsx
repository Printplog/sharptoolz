import { useParams, Navigate } from "react-router-dom";
import SvgFormTranslator from "@/components/Dashboard/SVGFormTranslator/SvgFormTranslator";

export default function CreateDocument() {
  const { id } = useParams<{ id: string }>();

  // If user opens the standalone Fernway Bank Simulator tool, redirect to the custom tool editor
  if (id === "fernway" || id === "9fbbd7e1-b7bd-4786-8f1c-94c03a4a46d2") {
    return <Navigate to="/tools/fernway" replace />;
  }

  return (
    <div className="dashboard-content">
      <SvgFormTranslator />
    </div>
  );
}
