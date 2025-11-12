import * as React from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { CustomDialog } from "@/components/ui/CustomDialog";
import { useMutation } from "@tanstack/react-query";
import type { DownloadData } from "@/types";
import { downloadDoc } from "@/api/apiEndpoints";
import errorMessage from "@/lib/utils/errorMessage";

interface DownloadDocDialogProps {
  svg: string;
  purchasedTemplateId?: string;
  templateName?: string;
}

export const DownloadDocDialog: React.FC<DownloadDocDialogProps> = ({
  svg,
  purchasedTemplateId,
  templateName,
}) => {
  const [type, setType] = React.useState<"pdf" | "png">("pdf");

  const { mutate, isPending } = useMutation({
    mutationFn: (data: DownloadData) => downloadDoc(data),

    onSuccess: async (blob) => {
      // Check if it's a zip file (split download)
      const contentType = blob.type || '';
      if (contentType === 'application/zip' || blob.type === 'application/x-zip-compressed') {
        try {
          // Try to extract zip and download both files
          try {
            const JSZip = (await import('jszip')).default;
            const zip = await JSZip.loadAsync(blob);
            
            // Download front.png
            const frontFile = zip.file('front.png');
            if (frontFile) {
              const frontBlob = await frontFile.async('blob');
              const frontUrl = URL.createObjectURL(frontBlob);
              const frontLink = document.createElement("a");
              frontLink.href = frontUrl;
              frontLink.download = templateName ? `${templateName}_front.png` : "front.png";
              frontLink.click();
              frontLink.remove();
              URL.revokeObjectURL(frontUrl);
            }
            
            // Download back.png
            const backFile = zip.file('back.png');
            if (backFile) {
              const backBlob = await backFile.async('blob');
              const backUrl = URL.createObjectURL(backBlob);
              const backLink = document.createElement("a");
              backLink.href = backUrl;
              backLink.download = templateName ? `${templateName}_back.png` : "back.png";
              backLink.click();
              backLink.remove();
              URL.revokeObjectURL(backUrl);
            }
            
            toast.success("Downloaded front and back images");
          } catch (importError) {
            // Fallback: download zip file directly if jszip is not available
            console.warn("jszip not available, downloading zip file directly");
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = templateName ? `${templateName}_split.zip` : "document_split.zip";
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            toast.success("Downloaded zip file - extract to get front.png and back.png");
          }
        } catch (error) {
          console.error("Error handling zip:", error);
          toast.error("Failed to handle split download");
        }
      } else {
        // Normal single file download
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = templateName ? `${templateName}.${type}` : `document.${type}`;
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        toast.success("Download complete");
      }
    },

    onError: (error: Error) => {
      toast.error(errorMessage(error));
    },
  });

  return (
    <CustomDialog dialogName="download-doc">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Download Document</DialogTitle>
          <DialogDescription>
            Choose the format and download your document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Label>Format</Label>
          <RadioGroup
            value={type}
            onValueChange={(val) => setType(val as "pdf" | "png")}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pdf" id="pdf" />
              <Label htmlFor="pdf">PDF (High quality vector)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="png" id="png" />
              <Label htmlFor="png">PNG (Image export)</Label>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button onClick={() => mutate({ svg, type, purchased_template_id: purchasedTemplateId, template_name: templateName })} disabled={isPending}>
            {isPending ? "Downloading..." : `Download as ${type.toUpperCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </CustomDialog>
  );
};
