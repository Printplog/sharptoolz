import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from 'lucide-react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    className?: string;
    /** Classes applied to the inner <img> — overrides default 'w-full h-full object-cover' */
    imgClassName?: string;
    placeholderColor?: string;
    /** Skip lazy loading — use for above-the-fold / logo images */
    priority?: boolean;
}

export const LazyImage = ({ src, alt, className, imgClassName, placeholderColor = "transparent", priority = false, onLoad, onError, ...props }: LazyImageProps) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isError, setIsError] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Priority images load immediately — no observer needed
        if (priority) {
            setIsInView(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '500px', threshold: 0 }
        );

        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [priority]);

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
                        className="absolute inset-0 bg-white/5 overflow-hidden z-10 flex items-center justify-center"
                    >
                        {!isError && (
                            <div
                                className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent"
                                style={{ animation: 'shimmer 1.8s infinite' }}
                            />
                        )}
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
                    decoding="async"
                    className={`transition-opacity duration-500 ${imgClassName ?? 'w-full h-full object-cover'} ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={(e) => { setIsLoaded(true); onLoad?.(e); }}
                    onError={(e) => { setIsError(true); onError?.(e); }}
                    {...props}
                />
            )}
        </div>
    );
};
