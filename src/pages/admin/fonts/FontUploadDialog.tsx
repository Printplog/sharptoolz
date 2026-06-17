import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import type { UseMutationResult } from "@tanstack/react-query";

interface FontUploadDialogProps {
    dialogOpen: boolean;
    setDialogOpen: (open: boolean) => void;
    uploadMutation: UseMutationResult<unknown, Error, FormData>;
}

export default function FontUploadDialog({
    dialogOpen,
    setDialogOpen,
    uploadMutation,
}: FontUploadDialogProps) {
    const [fontName, setFontName] = useState("");
    const [fontFamily, setFontFamily] = useState("");
    const [fontWeight, setFontWeight] = useState("normal");
    const [fontStyle, setFontStyle] = useState("normal");
    const [fontFile, setFontFile] = useState<File | null>(null);

    const resetForm = () => {
        setFontName("");
        setFontFamily("");
        setFontWeight("normal");
        setFontStyle("normal");
        setFontFile(null);
        setDialogOpen(false);
    };

    const handleUpload = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!fontName.trim()) {
            toast.error("Font name is required");
            return;
        }
        if (!fontFile) {
            toast.error("Choose a font file");
            return;
        }

        const formData = new FormData();
        formData.append("name", fontName.trim());
        if (fontFamily.trim()) {
            formData.append("family", fontFamily.trim());
        }
        formData.append("weight", fontWeight.trim() || "normal");
        formData.append("style", fontStyle.trim() || "normal");
        formData.append("font_file", fontFile);

        uploadMutation.mutate(formData, {
            onSuccess: () => resetForm(),
        });
    };

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <PremiumButton 
                    text="Add Font"
                    icon={Upload}
                />
            </DialogTrigger>
            <DialogContent className="max-w-lg p-8">
                <DialogHeader>
                    <DialogTitle>Upload a new font</DialogTitle>
                    <DialogDescription>
                        Supported formats: .ttf, .otf, .woff, .woff2
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpload} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="font-name">Font name</Label>
                        <Input
                            id="font-name"
                            placeholder="e.g., Inter Bold"
                            value={fontName}
                            onChange={(event) => setFontName(event.target.value)}
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0"
                            disabled={uploadMutation.isPending}
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2 sm:col-span-1">
                            <Label htmlFor="font-family">Family</Label>
                            <Input
                                id="font-family"
                                placeholder="Inter"
                                value={fontFamily}
                                onChange={(event) => setFontFamily(event.target.value)}
                                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0"
                                disabled={uploadMutation.isPending}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="font-weight">Weight</Label>
                            <Input
                                id="font-weight"
                                placeholder="700"
                                value={fontWeight}
                                onChange={(event) => setFontWeight(event.target.value)}
                                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0"
                                disabled={uploadMutation.isPending}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="font-style">Style</Label>
                            <Input
                                id="font-style"
                                placeholder="normal"
                                value={fontStyle}
                                onChange={(event) => setFontStyle(event.target.value)}
                                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0"
                                disabled={uploadMutation.isPending}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="font-file">Font file</Label>
                        <Input
                            id="font-file"
                            type="file"
                            accept=".ttf,.otf,.woff,.woff2"
                            onChange={(event) => {
                                setFontFile(event.target.files?.[0] || null);
                            }}
                            className="bg-white/10 border-white/20 text-white file:text-white/50 file:border-0 file:bg-transparent outline-0"
                            disabled={uploadMutation.isPending}
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={resetForm}
                            disabled={uploadMutation.isPending}
                            className="rounded-full px-6 h-11 bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
                        >
                            Cancel
                        </Button>
                        <PremiumButton
                            type="submit"
                            isLoading={uploadMutation.isPending}
                            text="Upload Font"
                            icon={Upload}
                        />
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
