import * as React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { VisualPreview } from "./VisualPreview";

interface SideSelectorProps {
    side: "front" | "back";
    setSide: (side: "front" | "back") => void;
    direction: "horizontal" | "vertical";
    svg: string;
}

export const SideSelector: React.FC<SideSelectorProps> = ({ side, setSide, direction, svg }) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Select Side</Label>
                <div className="text-[10px] text-white/40 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/10">
                    {direction} Split
                </div>
            </div>

            {/* Visual Preview Section */}
            <VisualPreview svg={svg} side={side} direction={direction} />

            <RadioGroup
                value={side}
                onValueChange={(val) => setSide(val as "front" | "back")}
                className="grid grid-cols-2 gap-3"
            >
                <label
                    htmlFor="front"
                    className={`flex items-center space-x-3 border border-white/10 rounded-lg p-3 bg-white/5 cursor-pointer transition-colors hover:bg-white/10 ${side === "front" ? "border-primary bg-primary/10" : ""
                        }`}
                >
                    <RadioGroupItem value="front" id="front" />
                    <Label htmlFor="front" className="cursor-pointer flex-1 text-sm">
                        {direction === "horizontal" ? "Top (Front)" : "Left (Front)"}
                    </Label>
                </label>
                <label
                    htmlFor="back"
                    className={`flex items-center space-x-3 border border-white/10 rounded-lg p-3 bg-white/5 cursor-pointer transition-colors hover:bg-white/10 ${side === "back" ? "border-primary bg-primary/10" : ""
                        }`}
                >
                    <RadioGroupItem value="back" id="back" />
                    <Label htmlFor="back" className="cursor-pointer flex-1 text-sm">
                        {direction === "horizontal" ? "Bottom (Back)" : "Right (Back)"}
                    </Label>
                </label>
            </RadioGroup>
        </div>
    );
};
