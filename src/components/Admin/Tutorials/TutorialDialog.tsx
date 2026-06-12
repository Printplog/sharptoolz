import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";

import { getTemplates, getTools } from "@/api/apiEndpoints";
import type { Template, Tool, Tutorial } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DebouncedInput } from "@/components/ui/debounced-inputs";

export type TutorialScope = "general" | "tool" | "template";

export type TutorialFormValues = {
  url: string;
  title: string;
  is_featured: boolean;
  tool: string | null;
  template: string | null;
};

type TutorialDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tutorial: Tutorial | null; // null = create mode
  onSubmit: (values: TutorialFormValues) => void;
  isSubmitting: boolean;
};

const scopeOf = (tutorial: Tutorial | null): TutorialScope => {
  if (tutorial?.template) return "template";
  if (tutorial?.tool) return "tool";
  return "general";
};

// Match the styling used across admin dialogs (BuilderDialog, ToolDialog, etc.)
const fieldClass =
  "bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0";
const dropdownClass = "bg-background border border-white/10 z-[300]";

export default function TutorialDialog({
  open,
  onOpenChange,
  tutorial,
  onSubmit,
  isSubmitting,
}: TutorialDialogProps) {
  const [scope, setScope] = useState<TutorialScope>("general");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [toolId, setToolId] = useState<string>("");
  const [templateId, setTemplateId] = useState<string>("");
  const [templateSearch, setTemplateSearch] = useState("");

  // Re-seed form state each time the dialog opens
  useEffect(() => {
    if (!open) return;
    setScope(scopeOf(tutorial));
    setUrl(tutorial?.url ?? "");
    setTitle(tutorial?.title ?? "");
    setIsFeatured(tutorial?.is_featured ?? false);
    setToolId(tutorial?.tool ?? "");
    setTemplateId(tutorial?.template ?? "");
    setTemplateSearch("");
  }, [open, tutorial]);

  const { data: tools, isLoading: toolsLoading } = useQuery<Tool[]>({
    queryKey: ["tools"],
    queryFn: getTools,
    enabled: open && scope === "tool",
  });

  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ["tutorialDialogTemplates", templateSearch],
    queryFn: () => getTemplates({ search: templateSearch, page_size: 20 }),
    enabled: open && scope === "template",
  });
  const templates: Template[] = templatesData?.results ?? [];

  const canSubmit =
    url.trim().length > 0 &&
    (scope === "general" ||
      (scope === "tool" && !!toolId) ||
      (scope === "template" && !!templateId));

  // Auto-fill the title from the picked tool/template if the admin
  // hasn't typed one yet.
  const autoFillTitle = (suggested: string) => {
    setTitle((prev) => (prev.trim() ? prev : suggested));
  };

  const handleToolChange = (id: string) => {
    setToolId(id);
    const tool = tools?.find((t) => t.id === id);
    if (tool) autoFillTitle(`How to use the ${tool.name} tool`);
  };

  const handleTemplateChange = (id: string) => {
    setTemplateId(id);
    const template = templates.find((t) => t.id === id);
    if (template) autoFillTitle(`How to use the ${template.name} template`);
  };

  const handleSubmit = () => {
    onSubmit({
      url: url.trim(),
      title: title.trim(),
      is_featured: isFeatured,
      tool: scope === "tool" ? toolId : null,
      template: scope === "template" ? templateId : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{tutorial ? "Edit Tutorial" : "Add Tutorial"}</DialogTitle>
          <DialogDescription>
            Link a video tutorial to a tool, a specific template, or keep it
            general (shown on the tutorials page only).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Scope</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as TutorialScope)}>
              <SelectTrigger className={`w-full ${fieldClass}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={dropdownClass}>
                <SelectItem value="general">General (not tied to anything)</SelectItem>
                <SelectItem value="tool">Tool</SelectItem>
                <SelectItem value="template">Template</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {scope === "tool" && (
            <div className="space-y-2">
              <Label>Tool</Label>
              <Select value={toolId} onValueChange={handleToolChange}>
                <SelectTrigger className={`w-full ${fieldClass}`}>
                  <SelectValue placeholder="Select a tool" />
                </SelectTrigger>
                <SelectContent className={dropdownClass}>
                  {toolsLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading tools...
                    </SelectItem>
                  ) : (
                    tools?.map((tool) => (
                      <SelectItem key={tool.id} value={tool.id}>
                        {tool.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-white/50">
                A tool can have one tutorial. It shows on templates of this tool
                that don't have their own tutorial.
              </p>
            </div>
          )}

          {scope === "template" && (
            <div className="space-y-2">
              <Label>Template</Label>
              <DebouncedInput
                value={templateSearch}
                onChange={(v) => setTemplateSearch(String(v))}
                placeholder="Search templates..."
                className={fieldClass}
              />
              <Select value={templateId} onValueChange={handleTemplateChange}>
                <SelectTrigger className={`w-full ${fieldClass}`}>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent className={dropdownClass}>
                  {templatesLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading templates...
                    </SelectItem>
                  ) : templates.length === 0 ? (
                    <SelectItem value="empty" disabled>
                      No templates found
                    </SelectItem>
                  ) : (
                    templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-white/50">
                A template can have one tutorial. It overrides the tool's
                tutorial on the usage page.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Tutorial URL</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className={fieldClass}
            />
          </div>

          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="How to use..."
              className={fieldClass}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <div>
              <Label>Featured</Label>
              <p className="text-xs text-white/50">
                Featured tutorials show at the top of the tutorials page.
              </p>
            </div>
            <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
              {isSubmitting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              {tutorial ? "Save Changes" : "Add Tutorial"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
