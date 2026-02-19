import * as React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface FormatSelectorProps {
    type: "pdf" | "png";
    setType: (type: "pdf" | "png") => void;
}

export const FormatSelector: React.FC<FormatSelectorProps> = ({ type, setType }) => {
    return (
        <div className="space-y-3">
            <Label className="text-base font-semibold">Format</Label>
            <RadioGroup
                value={type}
                onValueChange={(val) => setType(val as "pdf" | "png")}
                className="space-y-3"
            >
                <label
                    htmlFor="pdf"
                    className={`flex items-center space-x-3 border border-white/10 rounded-lg p-4 bg-white/5 cursor-pointer transition-colors hover:bg-white/10 ${type === "pdf" ? "border-primary bg-primary/10" : ""
                        }`}
                >
                    <RadioGroupItem value="pdf" id="pdf" />
                    <Label htmlFor="pdf" className="cursor-pointer flex-1">
                        PDF (High quality vector)
                    </Label>
                </label>
                <label
                    htmlFor="png"
                    className={`flex items-center space-x-3 border border-white/10 rounded-lg p-4 bg-white/5 cursor-pointer transition-colors hover:bg-white/10 ${type === "png" ? "border-primary bg-primary/10" : ""
                        }`}
                >
                    <RadioGroupItem value="png" id="png" />
                    <Label htmlFor="png" className="cursor-pointer flex-1">
                        PNG (Image export)
                    </Label>
                </label>
            </RadioGroup>
        </div>
    );
};
