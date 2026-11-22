import { useParams } from "react-router-dom";
import { FernwayEditor } from "@/components/Dashboard/Tools/Fernway/FernwayEditor";

export default function EditOnlineBankingAccountPage() {
  const { id } = useParams<{ id: string }>();
  return <FernwayEditor profileId={id} />;
}
