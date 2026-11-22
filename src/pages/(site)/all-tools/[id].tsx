import { Navigate, useParams } from "react-router-dom";
import SvgFormTranslator from "@/components/Dashboard/SVGFormTranslator/SvgFormTranslator";
import SectionPadding from "@/layouts/SectionPadding";

export default function EditTool() {
  const { id } = useParams<{ id: string }>();

  if (id === "fernway" || id === "9fbbd7e1-b7bd-4786-8f1c-94c03a4a46d2") {
    return <Navigate to="/tools/fernway" replace />;
  }

  return (
    <SectionPadding >
        <SvgFormTranslator />
    </SectionPadding>
  )
}
