import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface BlurImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    blurSrc?: string;
    className?: string;
}

export default function BlurImage({ src, blurSrc, className, alt, ...props }: BlurImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isInView, setIsInView] = useState(false);
    const [currentSrc, setCurrentSrc] = useState(blurSrc || src);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "100px" }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isInView) return;

        const img = new Image();
        img.src = src;
        img.onload = () => {
            setCurrentSrc(src);
            setIsLoading(false);
        };
    }, [src, isInView]);

    return (
        <div ref={containerRef} className={cn("relative overflow-hidden bg-white/5", className)}>
            {isInView && (
                <img
                    {...props}
                    src={currentSrc}
                    alt={alt}
                    className={cn(
                        "w-full h-full object-cover transition-all duration-700 ease-in-out",
                        isLoading ? "scale-110 blur-xl grayscale" : "scale-100 blur-0 grayscale-0"
                    )}
                    loading="lazy"
                />
            )}
            {isLoading && (
                <div className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center" />
            )}
        </div>
    );
}
