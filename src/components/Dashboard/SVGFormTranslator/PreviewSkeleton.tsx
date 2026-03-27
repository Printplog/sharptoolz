

interface PreviewSkeletonProps {
  progress: number;
}

export default function PreviewSkeleton({ progress }: PreviewSkeletonProps) {
  // Ensure progress is between 0 and 100
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div className="w-full overflow-hidden p-2 sm:p-5 bg-[#0f1620]/20 border border-white/5 rounded-2xl backdrop-blur-sm">
      <div className="w-full min-h-[400px] sm:min-h-[600px] relative flex flex-col items-center justify-center space-y-8">
        
        <div className="relative">
          {/* Simple, Clean Circular Progress */}
          <svg className="w-24 h-24 sm:w-28 sm:h-28 transform -rotate-90">
            {/* Minimalist Background Track */}
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="4"
              fill="transparent"
            />
            {/* Primary Progress Ring - No Glow */}
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              stroke="#cee88c"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={circumference}
              style={{
                strokeDashoffset: offset,
                transition: "stroke-dashoffset 0.6s ease-out",
              }}
              strokeLinecap="round"
            />
          </svg>

          {/* Centered Percentage - Smaller Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl sm:text-2xl font-fancy font-bold text-white tabular-nums">
              {clampedProgress}<span className="text-xs sm:text-sm text-white/40 ml-0.5">%</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-3 relative z-10">
          <h3 className="text-sm sm:text-base font-medium text-white/80 tracking-tight">
            Rendering Preview...
          </h3>
          
          <div className="flex items-center space-x-2">
            {[0, 1, 2].map((i) => (
              <div 
                key={i}
                className="w-1 h-1 bg-[#cee88c]/60 rounded-full animate-pulse" 
                style={{ animationDelay: `${i * 0.2}s` }} 
              />
            ))}
          </div>
          
          <p className="text-xs text-white/30 max-w-[240px] text-center font-normal leading-relaxed">
            Finalizing document assets and <br />
            preparing high-fidelity preview
          </p>
        </div>
      </div>
    </div>
  );
}

