import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RotateCcw, ArrowUpRightFromCircle, Copy } from "lucide-react";
import type { Tutorial } from "@/types";

type FormPanelHeaderProps = {
  isPurchased: boolean;
  tutorial?: Tutorial;
  onReset: () => void;
  trackingId?: string;
  trackingLink?: string;
  onCopyTracking?: () => void;
  name: string;
  onNameChange: (value: string) => void;
};

export function FormPanelHeader({
  isPurchased,
  tutorial,
  onReset,
  trackingId,
  trackingLink,
  onCopyTracking,
  name,
  onNameChange,
}: FormPanelHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Form Fields</h2>
        <Button
          onClick={onReset}
          variant="outline"
          size="sm"
          className="bg-white/10 border-white/20 text-white hover:text-white hover:bg-white/20"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      {tutorial && !isPurchased && (
        <div className="flex justify-end">
          <a href={tutorial.url} target="_blank" rel="noopener noreferrer">
            <Button
              variant="outline"
              className="gap-2 bg-white/10 border-white/20 text-white hover:text-white hover:bg-white/20"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Watch Tutorial
            </Button>
          </a>
        </div>
      )}

      {isPurchased && (
        <div className="mb-10 pb-4 border-b border-white/10">
          {trackingId && (
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <span className="text-white font-medium">Tracking ID:</span>
                <div className="flex gap-2 items-center">
                  <span className="text-primary py-1 px-3 border border-primary bg-primary/10 rounded-full text-sm shrink overflow-hidden">
                    {trackingId}
                  </span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="ml-1"
                    type="button"
                    onClick={onCopyTracking}
                    aria-label="Copy Tracking ID"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {trackingLink && (
                <Button asChild size="sm">
                  <a href={trackingLink} target="_blank" rel="noopener noreferrer">
                    Track
                    <ArrowUpRightFromCircle className="ml-2" />
                  </a>
                </Button>
              )}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className="text-primary">Document Name</label>
            <Input value={name} onChange={(e) => onNameChange(e.target.value)} />
          </div>
        </div>
      )}
    </>
  );
}

