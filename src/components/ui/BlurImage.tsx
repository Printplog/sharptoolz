import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface BlurImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    blurSrc?: string;
    className?: string;
}

export default function BlurImage({ src, blurSrc, className, alt, ...props }: BlurImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [currentSrc, setCurrentSrc] = useState(blurSrc || src);

    useEffect(() => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            setCurrentSrc(src);
            setIsLoading(false);
        };
    }, [src]);

    return (
        <div className={cn("relative overflow-hidden bg-white/5", className)}>
            <img
                {...props}
                src={currentSrc}
                alt={alt}
                className={cn(
                    "w-full h-full object-cover transition-all duration-700 ease-in-out",
                    isLoading ? "scale-110 blur-xl grayscale" : "scale-100 blur-0 grayscale-0"
                )}
            />
            {isLoading && (
                <div className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center">
                    {/* Optional loader or empty space */}
                </div>
            )}
        </div>
    );
}
