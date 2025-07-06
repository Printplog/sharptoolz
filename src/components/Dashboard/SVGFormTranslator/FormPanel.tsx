import { Button } from "@/components/ui/button";
import {
  Upload,
  RotateCcw,
  Download,
  Loader2,
  ArrowUpRightFromCircle,
  Copy,
} from "lucide-react";
import useToolStore from "@/store/formStore";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import FormFieldComponent from "./FormField";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { purchaseTemplate, updatePurchasedTemplate } from "@/api/apiEndpoints";
import type { PurchasedTemplate } from "@/types";
import errorMessage from "@/lib/utils/errorMessage";
import { Input } from "@/components/ui/input";
import updateSvgFromFormData from "@/lib/utils/updateSvgFromFormData";
import { DownloadDocDialog } from "../Documents/DownloadDoc";

export default function FormPanel() {
  const {
    fields,
    resetForm,
    name,
    svgRaw,
    status,
    statusMessage,
    getFieldValue,
    setName,
    downloadSvg
  } = useToolStore();
  const { id } = useParams();
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const isPurchased = pathname.includes("documents");
  const queryClient = useQueryClient();

  const { mutate: create, isPending: createPending } = useMutation({
    mutationFn: (data: Partial<PurchasedTemplate>) => purchaseTemplate(data),
    onSuccess: (data) => {
      toast.success("Doc created successfully, you can download it now");
      navigate(`/documents/${data?.id}`);
    },
    onError: (error: Error) => {
      toast.error(errorMessage(error));
      console.log(error);
    },
  });

  const { mutate: update, isPending: updatePending } = useMutation({
    mutationFn: (data: Partial<PurchasedTemplate>) =>
      updatePurchasedTemplate(data),
    onSuccess: () => {
      toast.success("Doc updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["purchased-template"],
      });
    },
    onError: (error: Error) => {
      toast.error(errorMessage(error));
      console.log(error);
    },
  });

  const createDocument = () => {
    const mutateFn = isPurchased ? update : create;
    if (pathname.includes("all-tools")) {
      navigate("/auth/login?next=" + encodeURIComponent(`/tools/${id}`));
      return;
    }
    const tracking_id = getFieldValue("Tracking_ID");
    const data = {
      id: id,
      ...(isPurchased ? {} : { name: name }),
      ...(isPurchased ? {} : { template: id }),
      svg: updateSvgFromFormData(svgRaw, fields),
      tracking_id: tracking_id as string,
      ...(!status ? {} : { status: status }),
      error_message: statusMessage,
    };
    console.log(data)
    mutateFn(data);
  };

  const downloadDoc = () => {
    if (pathname.includes("all-tools") || pathname.includes("tools")) {
      toast.warning(
        `You're yet to create the ${name}. Create the ${name} first, then download.`
      );
      return;
    }
    downloadSvg(name)
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-6">
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

      {isPurchased && (
        <div className="mb-10 pb-4 border-b border-white/10">
          <div className="">
            {getFieldValue("Tracking_ID") && (
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <span className="text-white font-medium">Tracking ID:</span>
                  <div className="flex gap-2 items-center">
                    <span className="text-primary py-1 px-3 border border-primary bg-primary/10 rounded-full text-sm shrink overflow-hidden">
                      {getFieldValue("Tracking_ID")}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="ml-1"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          getFieldValue("Tracking_ID") as string
                        );
                        toast.success("Tracking ID copied!");
                      }}
                      aria-label="Copy Tracking ID"
                    >
                      <Copy />
                    </Button>
                  </div>
                </div>
                <Button asChild size="sm" className="">
                  <a
                    href={`https://order-tracker-demo.vercel.app/`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Track
                    <ArrowUpRightFromCircle className="ml-2" />
                  </a>
                </Button>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="" className="text-primary">
              Document Name
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
      )}

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
            {createPending || updatePending
              ? isPurchased
                ? "Updating Document"
                : "Creating Document"
              : isPurchased
              ? "Update Document"
              : "Create Document"}
            {createPending || updatePending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Upload className="w-4 h-4 ml-1" />
            )}
          </>
        </Button>
        <Link to="?dialog=download-doc">
          <Button className="py-6 px-10">
            <>
              Download Document
              <Download className="w-4 h-4 ml-1" />
            </>
          </Button>
        </Link>
        <DownloadDocDialog svg={svgRaw} />
      </div>
    </div>
  );
}

