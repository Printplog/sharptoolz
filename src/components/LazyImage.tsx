import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from 'lucide-react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    className?: string;
    placeholderColor?: string;
}

export const LazyImage = ({ src, alt, className, placeholderColor = "transparent", ...props }: LazyImageProps) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const [isError, setIsError] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect();
                    }
                });
            },
            {
                rootMargin: '50px', // Start loading slightly before it comes into view
                threshold: 0.1
            }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            observer.disconnect();
        };
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
                    className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setIsLoaded(true)}
                    onError={() => setIsError(true)}
                    decoding="async"
                    {...props}
                />
            )}
        </div>
    );
};
