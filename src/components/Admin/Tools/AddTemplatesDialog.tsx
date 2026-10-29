import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { addTemplatesToTool, getTemplatesForAdmin, getTools } from "@/api/apiEndpoints";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import errorMessage from "@/lib/utils/errorMessage";
import type { Template, Tool } from "@/types";

const toolIdOf = (template: Template) =>
  typeof template.tool === "string" ? template.tool : template.tool?.id ?? null;

type Props = {
  tool: Tool;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Search all templates and move the chosen ones into `tool`, from another tool or from none. */
export default function AddTemplatesDialog({ tool, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  // Remember the picked templates themselves, so they stay selected across searches
  const [selected, setSelected] = useState<Map<string, Template>>(new Map());

  const { data: tools = [] } = useQuery<Tool[]>({ queryKey: ["tools"], queryFn: getTools, enabled: open });
  const toolNames = useMemo(() => new Map(tools.map((t) => [t.id, t.name])), [tools]);

  const { data, isFetching } = useQuery({
    queryKey: ["templates", "admin-picker", { search: debouncedSearch }],
    queryFn: () => getTemplatesForAdmin({ search: debouncedSearch.trim() || undefined, page_size: 50 }),
    enabled: open,
    placeholderData: (previous) => previous,
  });
  const candidates = (data?.results ?? []).filter((template) => toolIdOf(template) !== tool.id);

  const reset = () => {
    setSearch("");
    setSelected(new Map());
  };

  const moveMutation = useMutation({
    mutationFn: () => addTemplatesToTool(tool.id, [...selected.keys()]),
    onSuccess: (result) => {
      toast.success(`${result.moved} template${result.moved === 1 ? "" : "s"} added to ${tool.name}`);
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      queryClient.invalidateQueries({ queryKey: ["tool", tool.id] });
      reset();
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(errorMessage(error)),
  });

  const toggle = (template: Template) => {
    setSelected((current) => {
      const next = new Map(current);
      if (next.has(template.id)) next.delete(template.id);
      else next.set(template.id, template);
      return next;
    });
  };

  const movingFromOtherTools = [...selected.values()].filter((template) => toolIdOf(template));
  const fromNames = [...new Set(movingFromOtherTools.map((t) => toolNames.get(toolIdOf(t)!) ?? "another tool"))];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-xl flex-col gap-0 overflow-hidden rounded-xl border-white/10 bg-[#101721] p-0">
        <DialogHeader className="border-b border-white/10 px-6 pt-6 pb-4 pr-12 text-left">
          <DialogTitle className="text-white">Add templates to {tool.name}</DialogTitle>
          <DialogDescription className="text-white/45">
            Pick templates from other tools or with no tool. They&apos;ll move into {tool.name}.
          </DialogDescription>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search templates by name, keyword or tool..."
              aria-label="Search templates"
              className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pr-10 pl-10 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
            {isFetching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-white/40" />}
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2" role="list" aria-label="Templates">
          {candidates.length === 0 && !isFetching ? (
            <p className="px-4 py-10 text-center text-sm text-white/40">
              {search ? `No other templates match "${search}"` : "Every template is already in this tool."}
            </p>
          ) : (
            candidates.map((template) => {
              const fromId = toolIdOf(template);
              const checked = selected.has(template.id);
              return (
                <label
                  key={template.id}
                  role="listitem"
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-white/5",
                    checked && "bg-primary/[0.07] hover:bg-primary/10",
                  )}
                >
                  <Checkbox checked={checked} onCheckedChange={() => toggle(template)} aria-label={template.name} />
                  {template.banner ? (
                    <img
                      src={template.banner}
                      alt=""
                      loading="lazy"
                      onError={(event) => { event.currentTarget.style.visibility = "hidden"; }}
                      className="size-10 shrink-0 rounded-md bg-white/5 object-cover"
                    />
                  ) : (
                    <div className="size-10 shrink-0 rounded-md bg-white/5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-white/90">{template.name}</div>
                    <div className="truncate text-xs text-white/40">
                      {fromId ? `In ${toolNames.get(fromId) ?? "another tool"}` : "No tool"}
                    </div>
                  </div>
                </label>
              );
            })
          )}
        </div>

        <DialogFooter className="flex-col gap-3 border-t border-white/10 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-white/45">
            {selected.size === 0
              ? "Nothing selected yet."
              : movingFromOtherTools.length
                ? `${movingFromOtherTools.length} will leave ${fromNames.join(", ")}.`
                : `${selected.size} selected.`}
          </p>
          <Button
            onClick={() => moveMutation.mutate()}
            disabled={selected.size === 0 || moveMutation.isPending}
            className="bg-primary font-semibold text-black hover:bg-primary/90"
          >
            {moveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Add {selected.size || ""} to {tool.name}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
