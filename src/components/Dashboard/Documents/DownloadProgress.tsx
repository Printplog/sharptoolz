import { useEffect, useState, useRef } from "react";
import { Settings } from "lucide-react";
import {
  calculateSvgSize,
  estimateOutputSize,
  estimateConversionTime,
  formatTimeRemaining,
} from "@/lib/utils/downloadProgress";

interface DownloadProgressProps {
  svg: string;
  outputType: "pdf" | "png";
  isDownloading: boolean;
  onComplete?: () => void;
}

export default function DownloadProgress({
  svg,
  outputType,
  isDownloading,
  onComplete,
}: DownloadProgressProps) {
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [completedTime, setCompletedTime] = useState<string>("");
  const [isComplete, setIsComplete] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const lastProgressRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const estimatedOutputSizeRef = useRef<number>(0);
  const conversionTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isDownloading) {
      // Only reset if we're not showing completion message
      if (!isComplete) {
        setProgress(0);
        setTimeRemaining("");
        lastProgressRef.current = 0;
        lastTimeRef.current = 0;
      }
      return;
    }
    
    // Reset completion state when new download starts
    setIsComplete(false);
    setCompletedTime("");

    // Calculate initial estimates
    const svgSizeMB = calculateSvgSize(svg);
    const estimatedOutputSizeMB = estimateOutputSize(svgSizeMB, outputType);
    const conversionTime = estimateConversionTime(svgSizeMB, outputType);
    
    estimatedOutputSizeRef.current = estimatedOutputSizeMB;
    conversionTimeRef.current = conversionTime;

    const startTime = Date.now();
    startTimeRef.current = startTime;
    lastTimeRef.current = startTime;

    // Dynamic progress tracking
    const interval = setInterval(() => {
      if (!startTimeRef.current) return;
      
      const now = Date.now();
      const elapsed = (now - startTimeRef.current) / 1000; // seconds
      const timeSinceLastUpdate = (now - lastTimeRef.current) / 1000;
      
      // Calculate progress based on elapsed time and estimated phases
      let progressPercent: number;
      
      if (elapsed < conversionTimeRef.current) {
        // Conversion phase: 0-30% progress
        progressPercent = (elapsed / conversionTimeRef.current) * 30;
      } else {
        // Download phase: 30-95% progress
        const downloadElapsed = elapsed - conversionTimeRef.current;
        // Estimate download time based on file size and adaptive speed
        const estimatedDownloadTime = estimatedOutputSizeRef.current / 10; // Start with 10 MB/s estimate
        const downloadProgress = Math.min(95, 30 + (downloadElapsed / estimatedDownloadTime) * 65);
        progressPercent = downloadProgress;
      }
      
      progressPercent = Math.min(95, Math.max(0, progressPercent));
      
      // Calculate actual speed based on progress change
      const progressDelta = progressPercent - lastProgressRef.current;
      let currentSpeedMBps = 8; // Default conservative estimate (MB/s)
      
      if (progressDelta > 0 && timeSinceLastUpdate > 0.1) {
        // Calculate speed based on how much data we've "downloaded" (based on progress)
        // Only count download phase progress (after 30%)
        if (progressPercent > 30) {
          const downloadProgressDelta = progressDelta; // This is download phase progress
          const dataDownloadedMB = (downloadProgressDelta / 65) * estimatedOutputSizeRef.current; // 65% is download phase (30-95%)
          currentSpeedMBps = dataDownloadedMB / timeSinceLastUpdate;
          
          // Clamp speed to reasonable values (0.5 MB/s to 50 MB/s)
          currentSpeedMBps = Math.max(0.5, Math.min(50, currentSpeedMBps));
        }
      }
      
      // Calculate time remaining based on actual speed and progress
      let remainingTime = 0;
      if (progressPercent < 30) {
        // Still in conversion phase
        remainingTime = Math.max(0, conversionTimeRef.current - elapsed);
      } else {
        // In download phase - calculate based on remaining data and current speed
        const remainingProgress = 95 - progressPercent;
        const remainingDataMB = (remainingProgress / 65) * estimatedOutputSizeRef.current; // 65% is download phase
        remainingTime = remainingDataMB / Math.max(currentSpeedMBps, 0.5); // At least 0.5 MB/s
      }
      
      // Add 10 second buffer to remaining time
      remainingTime = remainingTime + 10;
      
      setProgress(progressPercent);
      setTimeRemaining(formatTimeRemaining(Math.max(0, remainingTime)));
      
      lastProgressRef.current = progressPercent;
      lastTimeRef.current = now;

      // If we've made significant progress but time is running out, show "almost done"
      if (progressPercent >= 90) {
        setTimeRemaining("Almost done...");
      }
    }, 300); // Update every 300ms

    return () => clearInterval(interval);
  }, [isDownloading, svg, outputType]);

  // When download completes, set to 100% and show completion time
  useEffect(() => {
    if (!isDownloading && progress > 0 && !isComplete) {
      setIsComplete(true);
      setProgress(100);
      
      // Calculate actual completion time
      if (startTimeRef.current) {
        const totalTime = (Date.now() - startTimeRef.current) / 1000;
        setCompletedTime(formatTimeRemaining(totalTime));
        setTimeRemaining(`Completed in ${formatTimeRemaining(totalTime)}`);
      } else {
        setTimeRemaining("Complete!");
      }
      
      setTimeout(() => {
        onComplete?.();
      }, 2000); // Show completion message for 2 seconds
    }
  }, [isDownloading, progress, onComplete, isComplete]);

  if (!isDownloading && !isComplete) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Message text */}
      <div className="text-center">
        <p className="text-xl text-muted-foreground max-[70%] mx-auto">
          Please wait while we create your document
        </p>
      </div>
      
      {/* Modern custom progress bar */}
      <div className="relative w-full py-3">
        {/* Outer container with glow effect - overflow hidden for animations */}
        <div className="relative h-6 w-full rounded-full bg-white/5 overflow-hidden border border-white/10">
          {/* Progress fill with animated gradient */}
          <div
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out overflow-hidden"
            style={{ width: `${progress}%` }}
          >
            {/* Main gradient fill */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/80 rounded-full" />
            
            {/* Animated shine effect */}
            {!isComplete && progress > 0 && (
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full"
                style={{
                  width: '50%',
                  animation: 'shimmer 1.5s infinite',
                }}
              />
            )}
            
            {/* Glow effect at the end */}
            <div 
              className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-primary to-transparent opacity-60 rounded-full"
            />
          </div>
        </div>
        
        {/* Rotating Settings icon - positioned outside the overflow container */}
        {progress > 0 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 transition-all duration-500 ease-out pointer-events-none z-10"
            style={{
              left: `max(0px, min(calc(${progress}% - 16px), calc(100% - 32px)))`,
            }}
          >
            <Settings
              className={`size-8 text-white fill-primary ${
                isComplete ? '' : 'animate-spin'
              }`}
              style={{
                animationDuration: isComplete ? '0s' : '1s',
              }}
            />
          </div>
        )}
      </div>
      
      {/* Minimal text - just time */}
      <div className="flex items-center justify-end">
        <span className={`text-xs font-medium ${
          isComplete ? 'text-primary' : 'text-muted-foreground'
        }`}>
          {isComplete && completedTime 
            ? `✓ ${completedTime}` 
            : timeRemaining}
        </span> 
      </div>
    </div>
  );
}

