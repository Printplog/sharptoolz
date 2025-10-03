import { useState, useEffect, useRef } from 'react';

/**
 * Hook to measure the height of a DOM element
 * @returns An object with ref to attach to the element and the measured height
 */
export function useHeight<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!ref.current) return;

    const updateHeight = () => {
      if (ref.current) {
        const newHeight = ref.current.getBoundingClientRect().height;
        setHeight(newHeight);
      }
    };

    // Set initial height
    updateHeight();

    // Update height on resize
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(ref.current);

    // Cleanup
    return () => {
      if (ref.current) {
        resizeObserver.unobserve(ref.current);
      }
      resizeObserver.disconnect();
    };
  }, []);

  return { ref, height };
}
