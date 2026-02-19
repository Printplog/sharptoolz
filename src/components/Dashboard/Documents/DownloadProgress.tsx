import { useEffect, useState } from "react";
import type { ProgressStep } from "./DownloadDoc/hooks/useDownloadLogic";
import { FancyProgress } from "@/components/ui/FancyProgress";

interface DownloadProgressProps {
  outputType: "pdf" | "png";
  isDownloading: boolean;
  onComplete?: () => void;
  step?: ProgressStep;
}

export default function DownloadProgress({
  outputType,
  isDownloading,
  onComplete,
  step = 'idle',
}: DownloadProgressProps) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Preparing...");

  // Map progress steps to percentages and text
  useEffect(() => {
    switch (step) {
      case 'idle':
        setProgress(0);
        setStatusText("Ready");
        break;
      case 'fetching':
        setProgress(10);
        setStatusText("Fetching document data...");
        break;
      case 'processing-svg':
        setProgress(30);
        setStatusText("Processing SVG components...");
        break;
      case 'rendering':
        setProgress(60);
        setStatusText("Rendering document...");
        break;
      case 'generating':
        setProgress(85);
        setStatusText("Generating final file...");
        break;
      case 'complete':
        setProgress(100);
        setStatusText("Document ready!");
        setTimeout(() => onComplete?.(), 2000);
        break;
    }
  }, [step, onComplete]);

  if (!isDownloading && step === 'idle') {
    return null;
  }

  return (
    <FancyProgress
      value={progress}
      statusText={statusText}
      label={`${outputType.toUpperCase()} Export`}
      isComplete={step === 'complete'}
    />
  );
}
