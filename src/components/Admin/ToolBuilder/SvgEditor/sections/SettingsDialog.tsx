import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings, RefreshCw, AlertTriangle } from "lucide-react";
import MetadataSection from "./MetadataSection";
import FontSelection from "./FontSelection";
import ToolSelection from "./ToolSelection";
import TutorialSection from "./TutorialSection";
import TemplateToggles from "./TemplateToggles";
import BannerUpload from "../BannerUpload";
import type { Font, Tool } from "@/types";
import type { UseMutationResult } from "@tanstack/react-query";
import { forceReparseTemplate } from "@/api/apiEndpoints";
import { toast } from "sonner";

interface SettingsDialogProps {
  templateId?: string; // Optional because new templates don't have IDs yet
  name: string;
  keywords: string[];
  onNameChange: (name: string) => void;
  onKeywordsChange: (keywords: string[]) => void;
  fonts: Font[];
  selectedFontIds: string[];
  onFontSelect: (id: string) => void;
  onFontRemove: (id: string) => void;
  fontUploadMutation: UseMutationResult<Font, Error, FormData, unknown>;
  tools: Tool[];
  selectedTool: string;
  onToolChange: (tool: string) => void;
  tutorialUrl: string;
  tutorialTitle: string;
  onUrlChange: (url: string) => void;
  onTitleChange: (title: string) => void;
  isHot: boolean;
  isActive: boolean;
  onHotChange: (val: boolean) => void;
  onActiveChange: (val: boolean) => void;
  bannerImage: string;
  onBannerUpload: (file: File) => void;
}

export default function SettingsDialog({
  templateId,
  name,
  keywords,
  onNameChange,
  onKeywordsChange,
  fonts,
  selectedFontIds,
  onFontSelect,
  onFontRemove,
  fontUploadMutation,
  tools,
  selectedTool,
  onToolChange,
  tutorialUrl,
  tutorialTitle,
  onUrlChange,
  onTitleChange,
  isHot,
  isActive,
  onHotChange,
  onActiveChange,
  bannerImage,
  onBannerUpload,
}: SettingsDialogProps) {
  const [isReparsing, setIsReparsing] = useState(false);

  const handleForceReparse = async () => {
    if (!templateId) return;
    setIsReparsing(true);
    try {
      await forceReparseTemplate(templateId);
      toast.success("Template re-parsed successfully. Form fields synced.");
    } catch (error) {
      console.error("Reparse failed", error);
      toast.error("Failed to re-parse template.");
    } finally {
      setIsReparsing(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings className="h-4 w-4" />
          Template Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle>Template Configuration</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <MetadataSection
            name={name}
            keywords={keywords}
            onNameChange={onNameChange}
            onKeywordsChange={onKeywordsChange}
          />
          <TemplateToggles
            isHot={isHot}
            isActive={isActive}
            onHotChange={onHotChange}
            onActiveChange={onActiveChange}
          />
          <ToolSelection
            tools={tools}
            selectedTool={selectedTool}
            onToolChange={onToolChange}
          />
          <FontSelection
            fonts={fonts}
            selectedFontIds={selectedFontIds}
            onFontSelect={onFontSelect}
            onFontRemove={onFontRemove}
            fontUploadMutation={fontUploadMutation}
          />
          <TutorialSection
            tutorialUrl={tutorialUrl}
            tutorialTitle={tutorialTitle}
            onUrlChange={onUrlChange}
            onTitleChange={onTitleChange}
          />
          <BannerUpload
            bannerImage={bannerImage}
            onUpload={onBannerUpload}
          />

          {/* Advanced / Danger Zone */}
          {templateId && (
            <div className="pt-6 border-t border-white/10">
              <h3 className="text-sm font-medium mb-3 text-white/80 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Advanced Actions
              </h3>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-white">Device Sync / Re-Parse</p>
                    <p className="text-xs text-white/60 max-w-[300px]">
                      Force the server to re-read the SVG file and update form fields.
                      Use this if you've updated the backend parser logic.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleForceReparse}
                    disabled={isReparsing}
                    className="border-amber-500/30 hover:bg-amber-500/20 text-amber-500"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isReparsing ? 'animate-spin' : ''}`} />
                    {isReparsing ? 'Syncing...' : 'Force Re-Parse'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
