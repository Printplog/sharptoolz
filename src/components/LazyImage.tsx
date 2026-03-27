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

// Global set to track images that have already been loaded in the current session
// This allows for "instant" appearance on subsequent mounts of the same URL
const loadedImages = new Set<string>();

export const LazyImage = ({ 
    src, 
    alt, 
    className, 
    imgClassName, 
    placeholderColor = "transparent", 
    priority = false, 
    onLoad, 
    onError, 
    ...props 
}: LazyImageProps) => {
    // If the image is already in our session cache, start as loaded
    const isInitiallyLoaded = loadedImages.has(src);
    const [isLoaded, setIsLoaded] = useState(isInitiallyLoaded);
    const [isError, setIsError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        // Check if the image is already complete (cached by browser) on mount
        if (imgRef.current?.complete && !isLoaded) {
            loadedImages.add(src);
            setIsLoaded(true);
        }
    }, [src, isLoaded]);

    const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        loadedImages.add(src);
        setIsLoaded(true);
        onLoad?.(e);
    };

    return (
        <div
            className={`relative overflow-hidden ${className}`}
            style={{ backgroundColor: placeholderColor }}
        >
            <AnimatePresence>
                {/* 
                   Only show shimmer/placeholder if:
                   1. Not loaded yet
                   2. Not a priority image
                   3. Not already in our session cache
                */}
                {!isLoaded && !priority && !isInitiallyLoaded && !isError && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-white/5 overflow-hidden z-10 flex items-center justify-center"
                    >
                        <div
                            className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent"
                            style={{ animation: 'shimmer 1.5s infinite' }}
                        />
                    </motion.div>
                )}
                
                {isError && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-white/5 z-10 flex flex-col items-center justify-center gap-2 opacity-20"
                    >
                        <Layout className="w-12 h-12" />
                        <span className="text-[10px] uppercase font-black tracking-tighter">Preview Error</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <img
                ref={imgRef}
                src={src}
                alt={alt}
                loading={priority ? "eager" : "lazy"}
                decoding="async"
                className={`
                    ${imgClassName ?? 'w-full h-full object-cover'} 
                    ${isLoaded ? 'opacity-100' : 'opacity-0'}
                    ${!isInitiallyLoaded ? 'transition-opacity duration-200 ease-out' : ''}
                `}
                onLoad={handleLoad}
                onError={(e) => { setIsError(true); onError?.(e); }}
                {...props}
            />
        </div>
    );
};
