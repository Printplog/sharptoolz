import { Button } from "@/components/ui/button";
import {
  Upload,
  RotateCcw,
  Download,
  Loader2,
  ArrowUpRightFromCircle,
  Copy,
  PenLine,
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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";

export default function FormPanel({ test }: { test: boolean }) {
  const {
    fields,
    resetForm,
    name,
    svgRaw,
    status,
    statusMessage,
    getFieldValue,
    setName,
  } = useToolStore();
  const { id } = useParams();
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const isPurchased = pathname.includes("documents");
  const queryClient = useQueryClient();
  const [showTestDialog, setShowTestDialog] = useState(false);

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
    mutationFn: async (
      data: Partial<PurchasedTemplate> & { toastMessage?: string }
    ) => {
      const { toastMessage, ...payload } = data;
      await updatePurchasedTemplate(payload); // assume this is an async call
      return { toastMessage }; // return it so we can access it in onSuccess
    },
    onSuccess: (data) => {
      toast.success(data.toastMessage || "Doc updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["purchased-template"],
      });
    },
    onError: (error: Error) => {
      toast.error(errorMessage(error));
      console.error(error);
    },
  });

  const createDocument = (isTest: boolean) => {
    const mutateFn = isPurchased ? update : create;
    if (pathname.includes("all-tools")) {
      navigate("/auth/login?next=" + encodeURIComponent(`/tools/${id}`));
      return;
    }
    const tracking_id = getFieldValue("Tracking_ID");
    const toastMessage = test === isTest ? "Document updated successfully" : "Document is now watermark free";
    const data = {
      id: id,
      ...(!isPurchased ? {} : { name: name }),
      ...(isPurchased ? {} : { template: id }),
      ...(isPurchased ? {} : { svg: updateSvgFromFormData(svgRaw, fields) }),
      tracking_id: tracking_id as string,
      ...(!status ? {} : { status: status }),
      error_message: statusMessage,
      test: isTest,
      toastMessage: toastMessage,
    };
    console.log(data);
    mutateFn(data);
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

      <div className="space-y-3">
        {fields
          ?.filter((field) => field.type === "status")
          .map((field) => (
            <FormFieldComponent key={field.id} field={field} />
          ))}
        <fieldset disabled={isPurchased} className="m-0 p-0 border-0 space-y-3">
          {fields
            ?.filter((field) => field.type !== "status")
            .map((field) => (
              <FormFieldComponent key={field.id} field={field} />
            ))}
        </fieldset>
      </div>

      <div className="pt-4 border-t border-white/20 flex flex-col sm:flex-row justify-end gap-5 ">
        {isPurchased && test && (
          <Button
            variant={"outline"}
            disabled={createPending || updatePending}
            onClick={() => {
              createDocument(false);
            }}
            className="py-6 px-10 hover:bg-black/50 hover:text-white"
          >
            <>
              {updatePending ? "Removing Watermark" : "Remove Watermark"}
              {updatePending ? (
                <PenLine className="animate-spin" />
              ) : (
                <Upload className="w-4 h-4 ml-1" />
              )}
            </>
          </Button>
        )}

        {!isPurchased ? (
          <Button
            variant="outline"
            disabled={createPending || updatePending}
            onClick={() => setShowTestDialog(true)} // 👈 Show dialog instead
            className="py-6 px-10 hover:bg-black/50 hover:text-white"
          >
            <>
              {createPending ? "Creating Document" : "Create Document"}
              {createPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Upload className="w-4 h-4 ml-1" />
              )}
            </>
          </Button>
        ) : (
          <Button
            variant="outline"
            disabled={createPending || updatePending}
            onClick={() => createDocument(test)}
            className="py-6 px-10 hover:bg-black/50 hover:text-white"
          >
            <>
              {updatePending ? "Updating Document" : "Update Document"}
              {updatePending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Upload className="w-4 h-4 ml-1" />
              )}
            </>
          </Button>
        )}

        <Link to="?dialog=download-doc" className="w-full sm:w-auto">
          <Button
            disabled={createPending || updatePending}
            className="py-6 px-10 w-full"
          >
            <>
              Download Document
              <Download className="w-4 h-4 ml-1" />
            </>
          </Button>
        </Link>
        <DownloadDocDialog svg={svgRaw} />
        <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
          <DialogContent className="max-w-sm text-center space-y-4">
            <h2 className="text-lg font-semibold">Create Document</h2>
            <p>
              Do you want to create a <strong className="text-primary">test document</strong> (with
              watermark) or pay <strong className="text-primary">$5</strong>  for the final version?
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <Button
                onClick={() => {
                  createDocument(true);
                  setShowTestDialog(false);
                }}
                variant="outline"
              >
                Test Document
              </Button>
              <Button
                onClick={() => {
                  createDocument(false);
                  setShowTestDialog(false);
                }}
              >
                Pay & Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
