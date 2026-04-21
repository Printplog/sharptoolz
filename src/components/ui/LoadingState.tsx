import { cn } from "@/lib/utils";

interface LoadingStateProps {
  className?: string;
  dotClassName?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingState({ className, dotClassName, size = "md" }: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-1 w-1",
    md: "h-1.5 w-1.5",
    lg: "h-2 w-2",
  };

  return (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "rounded-full bg-current animate-bounce",
            sizeClasses[size],
            dotClassName
          )}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: "0.8s",
          }}
        />
      ))}
    </div>
  );
}
