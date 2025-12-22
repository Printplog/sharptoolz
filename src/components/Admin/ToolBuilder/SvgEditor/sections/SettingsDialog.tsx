import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import MetadataSection from "./MetadataSection";
import FontSelection from "./FontSelection";
import ToolSelection from "./ToolSelection";
import TutorialSection from "./TutorialSection";
import TemplateToggles from "./TemplateToggles";
import BannerUpload from "../BannerUpload";
import type { Font, Tool } from "@/types";

interface SettingsDialogProps {
  name: string;
  keywords: string[];
  onNameChange: (name: string) => void;
  onKeywordsChange: (keywords: string[]) => void;
  fonts: Font[];
  selectedFontIds: string[];
  onFontSelect: (id: string) => void;
  onFontRemove: (id: string) => void;
  fontUploadMutation: any;
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
