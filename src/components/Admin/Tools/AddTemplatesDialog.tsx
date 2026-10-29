import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import {
  addTemplatesToCountry,
  addTemplatesToTool,
  getCountries,
  getTemplatesForAdmin,
  getTools,
} from "@/api/apiEndpoints";
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
import type { Country, Template, Tool } from "@/types";

/** Templates are grouped two ways: by tool and by country. */
export type TemplateGroupKind = "tool" | "country";

const groupIdOf = (template: Template, kind: TemplateGroupKind) => {
  if (kind === "country") return template.country ?? null;
  return typeof template.tool === "string" ? template.tool : template.tool?.id ?? null;
};

type Props = {
  kind?: TemplateGroupKind;
  /** The tool or country the templates go into */
  group: { id: string; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Search all templates and move the chosen ones into `group`, from another tool/country or from none. */
export default function AddTemplatesDialog({ kind = "tool", group, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const noGroupLabel = kind === "country" ? "No country" : "No tool";
  const otherGroupLabel = kind === "country" ? "another country" : "another tool";
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  // Remember the picked templates themselves, so they stay selected across searches
  const [selected, setSelected] = useState<Map<string, Template>>(new Map());

  const { data: tools = [] } = useQuery<Tool[]>({
    queryKey: ["tools"],
    queryFn: getTools,
    enabled: open && kind === "tool",
  });
  const { data: countries = [] } = useQuery<Country[]>({
    queryKey: ["countries"],
    queryFn: getCountries,
    enabled: open && kind === "country",
  });
  const groupNames = useMemo(
    () => new Map<string, string>((kind === "country" ? countries : tools).map((g) => [g.id, g.name])),
    [kind, countries, tools],
  );

  const { data, isFetching } = useQuery({
    queryKey: ["templates", "admin-picker", { search: debouncedSearch }],
    queryFn: () => getTemplatesForAdmin({ search: debouncedSearch.trim() || undefined, page_size: 50 }),
    enabled: open,
    placeholderData: (previous) => previous,
  });
  const candidates = (data?.results ?? []).filter((template) => groupIdOf(template, kind) !== group.id);

  const reset = () => {
    setSearch("");
    setSelected(new Map());
  };

  const moveMutation = useMutation({
    mutationFn: (): Promise<{ moved: number }> =>
      (kind === "country" ? addTemplatesToCountry : addTemplatesToTool)(group.id, [...selected.keys()]),
    onSuccess: (result) => {
      toast.success(`${result.moved} template${result.moved === 1 ? "" : "s"} added to ${group.name}`);
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: [kind === "country" ? "countries" : "tools"] });
      queryClient.invalidateQueries({ queryKey: [kind, group.id] });
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

  const movingFromOthers = [...selected.values()].filter((template) => groupIdOf(template, kind));
  const fromNames = [
    ...new Set(movingFromOthers.map((t) => groupNames.get(groupIdOf(t, kind)!) ?? otherGroupLabel)),
  ];

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
          <DialogTitle className="text-white">Add templates to {group.name}</DialogTitle>
          <DialogDescription className="text-white/45">
            {kind === "country"
              ? `Pick templates from other countries or with no country. They'll move into ${group.name}.`
              : `Pick templates from other tools or with no tool. They'll move into ${group.name}.`}
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
              {search ? `No other templates match "${search}"` : `Every template is already in ${group.name}.`}
            </p>
          ) : (
            candidates.map((template) => {
              const fromId = groupIdOf(template, kind);
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
                      {fromId ? `In ${groupNames.get(fromId) ?? otherGroupLabel}` : noGroupLabel}
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
              : movingFromOthers.length
                ? `${movingFromOthers.length} will leave ${fromNames.join(", ")}.`
                : `${selected.size} selected.`}
          </p>
          <Button
            onClick={() => moveMutation.mutate()}
            disabled={selected.size === 0 || moveMutation.isPending}
            className="bg-primary font-semibold text-black hover:bg-primary/90"
          >
            {moveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Add {selected.size || ""} to {group.name}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
