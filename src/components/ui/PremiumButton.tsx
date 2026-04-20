import * as React from "react";
import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface PremiumButtonProps extends HTMLMotionProps<"button"> {
  text: string;
  icon?: LucideIcon;
  variant?: "primary" | "ghost" | "outline";
   href?: string;
  iconRotation?: number;
  showIconBorder?: boolean;
  noShadow?: boolean;
  isLoading?: boolean;
}

const PremiumButton = React.forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ text, icon: Icon, variant = "primary", href, className, iconRotation = -45, showIconBorder = true, noShadow = false, isLoading = false, ...props }, ref) => {
    const isPrimary = variant === "primary";
    const isExternal = href?.startsWith("http");
    
    const innerContent = (
      <>
        <div className="relative z-10 flex items-center gap-6 w-full justify-between">
          <span className="text-sm md:text-base whitespace-nowrap">
            {isLoading ? "Please wait..." : text}
          </span>
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full bg-transparent transition-colors duration-300",
            isPrimary ? "border border-black/40" : "border border-white/60",
            !showIconBorder && "border-none"
          )}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : Icon && (
              <motion.div
                variants={{
                  initial: { rotate: 0, x: 0 },
                  hover: { rotate: iconRotation, x: 1 }
                }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center"
              >
                <Icon className="w-4 h-4" />
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Slide reveal background */}
        <motion.div
          variants={{
            initial: { x: "-100%" },
            hover: { x: "0%" }
          }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "absolute inset-0 z-0",
            isPrimary ? "bg-white/20" : "bg-white/10"
          )}
        />
      </>
    );

    const commonClasses = cn(
      "group relative pl-6 pr-1.5 py-1.5 rounded-full font-bold cursor-pointer overflow-hidden transition-all duration-300 flex items-center justify-between min-w-[140px]",
      !noShadow && "shadow-xl",
      (isLoading || props.disabled) && "opacity-70 cursor-not-allowed pointer-events-none",
      !className?.includes("bg-") && (
        isPrimary 
          ? cn("bg-[#cee88c] text-black", !noShadow && "shadow-[#cee88c]/10") 
          : cn("bg-white/5 border border-white/10 text-white", !noShadow && "shadow-white/5")
      ),
      className
    );

    if (isExternal) {
      return (
        <motion.a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          whileHover="hover"
          initial="initial"
          className={cn(commonClasses, "inline-flex")}
          {...(props as any)}
        >
          {innerContent}
        </motion.a>
      );
    }

    if (href) {
      return (
        <motion.div
          whileHover="hover"
          initial="initial"
          className="inline-block"
        >
          <Link 
            to={href} 
            className={commonClasses}
            {...(props as any)}
          >
            {innerContent}
          </Link>
        </motion.div>
      );
    }

    return (
      <motion.button
        ref={ref}
        whileHover={isLoading ? "" : "hover"}
        initial="initial"
        className={commonClasses}
        disabled={isLoading || (props.disabled as boolean)}
        {...props}
      >
        {innerContent}
      </motion.button>
    );
  }
);

PremiumButton.displayName = "PremiumButton";

export { PremiumButton };
