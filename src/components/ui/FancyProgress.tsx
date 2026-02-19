import * as React from "react";
import { CheckCircle2, Settings } from "lucide-react";

interface FancyProgressProps {
    value: number;
    label?: string;
    statusText?: string;
    className?: string;
    isComplete?: boolean;
}

export const FancyProgress: React.FC<FancyProgressProps> = ({
    value,
    label,
    statusText,
    className = "",
    isComplete = false,
}) => {
    return (
        <div className={`space-y-4 py-2 ${className}`}>
            {/* Message text */}
            {(label || statusText) && (
                <div className="flex items-center gap-3">
                    <div className="relative">
                        {isComplete ? (
                            <CheckCircle2 className="size-6 text-primary animate-in zoom-in duration-300" />
                        ) : (
                            <Settings className="size-6 text-primary animate-spin" style={{ animationDuration: '3s' }} />
                        )}
                    </div>
                    <div className="flex-1">
                        {statusText && (
                            <p className="text-sm font-medium text-white/90">
                                {statusText}
                            </p>
                        )}
                        {label && (
                            <p className="text-[10px] text-white/40 uppercase tracking-wider">
                                {label}
                            </p>
                        )}
                    </div>
                    <span className="text-xs font-mono text-primary font-bold">
                        {Math.round(value)}%
                    </span>
                </div>
            )}

            {/* Modern custom progress bar */}
            <div className="relative h-2.5 w-full rounded-full bg-white/5 overflow-hidden border border-white/5">
                <div
                    className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-700 ease-in-out"
                    style={{ width: `${value}%` }}
                >
                    {/* Animated shimmer when active */}
                    {!isComplete && value > 0 && (
                        <div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                            style={{ backgroundSize: '200% 100%' }}
                        />
                    )}
                </div>

                {/* Secondary pulse effect for active generation */}
                {!isComplete && value > 0 && (
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="w-full h-full bg-primary animate-pulse" />
                    </div>
                )}
            </div>
        </div>
    );
};
