import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";

export default function PreviewSkeleton() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          return 90; // Stop at 90% until SVG loads
        }
        return prev + 10;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full overflow-auto p-5 bg-white/10 border border-white/20 rounded-xl">
      <div className="w-full min-h-[600px] bg-white/5 border border-white/10 rounded-lg p-8 flex flex-col items-center justify-center space-y-6">
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center justify-between text-sm text-white/60">
            <span>Loading preview...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <p className="text-sm text-white/40 text-center">
          Preparing your document preview
        </p>
      </div>
    </div>
  );
}

