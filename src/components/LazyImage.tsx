import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from 'lucide-react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    className?: string;
    placeholderColor?: string;
}

/** Detect iPhone / iOS Safari — very memory-constrained, needs JS lazy loading */
const isIOS = () =>
    typeof navigator !== 'undefined' &&
    /iphone|ipad|ipod/i.test(navigator.userAgent);

export const LazyImage = ({ src, alt, className, placeholderColor = "transparent", onLoad, onError, ...props }: LazyImageProps) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isError, setIsError] = useState(false);

    // iOS-only: intersection-observer gated loading to prevent memory crashes
    const [isInView, setIsInView] = useState(!isIOS());
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isIOS()) return; // only need observer on iOS

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect();
                    }
                });
            },
            { rootMargin: '80px', threshold: 0.1 }
        );

        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden ${className}`}
            style={{ backgroundColor: placeholderColor }}
        >
            <AnimatePresence>
                {(!isLoaded || isError) && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 bg-white/5 animate-pulse z-10 flex items-center justify-center"
                    >
                        {isError && (
                            <div className="flex flex-col items-center gap-2 opacity-20">
                                <Layout className="w-12 h-12" />
                                <span className="text-[10px] uppercase font-black tracking-tighter">Preview Error</span>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {isInView && !isError && (
                <img
                    src={src}
                    alt={alt}
                    // Non-iOS: rely on native browser lazy loading (no JS overhead)
                    loading={isIOS() ? undefined : "lazy"}
                    decoding="async"
                    className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={(e) => { setIsLoaded(true); onLoad?.(e); }}
                    onError={(e) => { setIsError(true); onError?.(e); }}
                    {...props}
                />
            )}
        </div>
    );
};
