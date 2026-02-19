import * as React from "react";

interface VisualPreviewProps {
    svg: string;
    side: "front" | "back";
    direction: "horizontal" | "vertical";
}

export const VisualPreview: React.FC<VisualPreviewProps> = ({ svg, side, direction }) => {
    // Use a simplified preview if the SVG is too large, but for now we'll use the SVG itself
    // We'll wrap it in a container that applies the highlight

    return (
        <div className="relative w-full h-[220px] bg-black/40 rounded-xl border border-white/10 overflow-hidden flex items-center justify-center p-4 group/preview">
            {/* SVG Content Container with explicit sizing */}
            <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
                {/* Ghost/Dimmed Version of the SVG */}
                <div
                    className="max-w-full max-h-full opacity-20 flex items-center justify-center [&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:h-auto [&_svg]:w-auto"
                    dangerouslySetInnerHTML={{ __html: svg }}
                />
            </div>

            {/* Highlight Overlay */}
            <div className="absolute inset-2 z-10 pointer-events-none">
                <div
                    className={`absolute transition-all duration-300 border-2 border-primary bg-primary/20 shadow-[0_0_15px_rgba(255,79,24,0.3)] rounded-sm ${direction === "horizontal"
                        ? side === "front"
                            ? "top-0 left-0 w-full h-1/2"
                            : "top-1/2 left-0 w-full h-1/2"
                        : side === "front"
                            ? "top-0 left-0 w-1/2 h-full"
                            : "top-0 left-1/2 w-1/2 h-full"
                        }`}
                >
                    {/* Label indicating the selection */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                        {side}
                    </div>
                </div>
            </div>

            {/* Background divider line for clarity */}
            <div
                className={`absolute inset-2 border-white/20 pointer-events-none ${direction === "horizontal"
                    ? "border-b h-1/2"
                    : "border-r w-1/2"
                    }`}
            />
        </div>
    );
};
