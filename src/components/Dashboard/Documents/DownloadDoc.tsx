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
// import { toast } from "sonner";
import { CustomDialog } from "@/components/ui/CustomDialog";

interface DownloadDocDialogProps {
  svg: string;
}

export const DownloadDocDialog: React.FC<DownloadDocDialogProps> = ({
  svg,
}) => {
  
  const [type, setType] = React.useState<"pdf" | "png">("pdf");
  const [loading, setLoading] = React.useState(false);



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
          <Button disabled={loading}>
            {loading ? "Generating..." : `Download as ${type.toUpperCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </CustomDialog>
  );
};
