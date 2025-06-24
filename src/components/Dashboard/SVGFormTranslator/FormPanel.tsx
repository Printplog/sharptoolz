import { Button } from "@/components/ui/button";
import { Upload, RotateCcw, Download } from "lucide-react";
import useToolStore from "@/store/formStore";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import FormFieldComponent from "./FormField";
import { useMutation } from "@tanstack/react-query";
import { purchaseTemplate } from "@/api/apiEndpoints";
import type { PurchasedTemplate } from "@/types";
import errorMessage from "@/lib/utils/errorMessage";



export default function FormPanel() {
  const { fields, resetForm, name, svgRaw, status, statusMessage, getFieldValue } = useToolStore();
  const { id } = useParams();
  const navigate = useNavigate();
  const pathname = useLocation().pathname;

  const { mutate, isPending } = useMutation({
    mutationFn: (data: Partial<PurchasedTemplate>) => purchaseTemplate(data),
    onSuccess: () => {

    },
    onError: (error: Error) =>  {
      toast(errorMessage(error))
      console.log(error)
    }
  })

  const createDocument = () => {
    if (pathname.includes("all-tools")) {
      navigate("/auth/login?next=" + encodeURIComponent(`/tools/${id}`));
      return;
    }
    const tracking_id = getFieldValue("Tracking_ID")
    const data = {
      template: id,
      svg: svgRaw,
      tracking_id: tracking_id as string,
      status: status,
      status_message: statusMessage,
    }
    mutate(data)
  };

  const downloadDoc = () => {
    if (pathname.includes("all-tools") || pathname.includes("tools")) {
      toast.warning(
        `You're yet to create the ${name}. Create the ${name} first, then download.`
      );
    }
  };

  return (
    <div className="bg-white/10 border border-white/20 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Form Fields</h2>
        <Button
          onClick={resetForm}
          variant="outline"
          size="sm"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      <div className="space-y-4">
        {fields?.map((field) => (
          <FormFieldComponent key={field.id} field={field} />
        ))}
      </div>

      <div className="pt-4 border-t border-white/20 flex flex-col sm:flex-row justify-end gap-5 ">
        <Button
          variant={"outline"}
          onClick={createDocument}
          className="py-6 px-10 hover:bg-black/50 hover:text-white"
        >
          <>
            { isPending ? "Creating Document..." :  "Create Document"}
            <Upload className="w-4 h-4 ml-1" />
          </>
        </Button>
        <Button onClick={downloadDoc} className="py-6 px-10">
          <>
            Download Document
            <Download className="w-4 h-4 ml-1" />
          </>
        </Button>
      </div>
    </div>
  );
}
