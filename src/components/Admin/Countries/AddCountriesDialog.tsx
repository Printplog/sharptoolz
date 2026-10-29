import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { createCountry } from "@/api/apiEndpoints";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CountryFlag } from "@/components/ui/CountryFlag";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ALL_COUNTRIES, matchesCountry, type CountryOption } from "@/lib/countries";
import { cn } from "@/lib/utils";
import errorMessage from "@/lib/utils/errorMessage";
import type { Country } from "@/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Countries already added, shown as "Added" */
  existing: Country[];
};

/** Pick one or more countries from the full world list (with flags) and add them. */
export default function AddCountriesDialog({ open, onOpenChange, existing }: Props) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Map<string, CountryOption>>(new Map());

  const added = useMemo(() => new Set(existing.map((c) => c.code.toUpperCase())), [existing]);
  const results = ALL_COUNTRIES.filter((country) => matchesCountry(country, search));

  const reset = () => {
    setSearch("");
    setSelected(new Map());
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      const picked = [...selected.values()];
      const outcomes = await Promise.allSettled(picked.map((c) => createCountry({ code: c.code, name: c.name })));
      const saved = picked.filter((_, i) => outcomes[i].status === "fulfilled").map((c) => c.code);
      const failed = outcomes.filter((o) => o.status === "rejected") as PromiseRejectedResult[];
      return { saved, failed };
    },
    onSuccess: ({ saved, failed }) => {
      queryClient.invalidateQueries({ queryKey: ["countries"] });
      if (saved.length) toast.success(`${saved.length} countr${saved.length === 1 ? "y" : "ies"} added`);
      if (failed.length) {
        // Keep only the ones that failed selected, so trying again doesn't re-add the rest
        setSelected((current) => new Map([...current].filter(([code]) => !saved.includes(code))));
        toast.error(`${failed.length} couldn't be added: ${errorMessage(failed[0].reason as Error)}`);
        return;
      }
      reset();
      onOpenChange(false);
    },
  });

  const toggle = (country: CountryOption) => {
    setSelected((current) => {
      const next = new Map(current);
      if (next.has(country.code)) next.delete(country.code);
      else next.set(country.code, country);
      return next;
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg flex-col gap-0 overflow-hidden rounded-xl border-white/10 bg-[#101721] p-0">
        <DialogHeader className="border-b border-white/10 px-6 pt-6 pb-4 pr-12 text-left">
          <DialogTitle className="text-white">Add countries</DialogTitle>
          <DialogDescription className="text-white/45">
            Pick the countries your templates are for. You can pick several at once.
          </DialogDescription>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search countries, e.g. Nigeria, USA, UK..."
              aria-label="Search countries"
              className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pr-4 pl-10 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2" role="list" aria-label="Countries">
          {results.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-white/40">No country matches "{search}"</p>
          ) : (
            results.map((country) => {
              const isAdded = added.has(country.code);
              const checked = selected.has(country.code);
              return (
                <label
                  key={country.code}
                  role="listitem"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-2.5 transition-colors",
                    isAdded ? "cursor-default opacity-50" : "cursor-pointer hover:bg-white/5",
                    checked && "bg-primary/[0.07] hover:bg-primary/10",
                  )}
                >
                  {isAdded ? (
                    <Check className="h-4 w-4 text-primary" aria-hidden />
                  ) : (
                    <Checkbox checked={checked} onCheckedChange={() => toggle(country)} aria-label={country.name} />
                  )}
                  <CountryFlag code={country.code} />
                  <span className="min-w-0 flex-1 truncate text-sm text-white/90">{country.name}</span>
                  <span className="font-mono text-[11px] text-white/35">{isAdded ? "Added" : country.code}</span>
                </label>
              );
            })
          )}
        </div>

        <DialogFooter className="flex-col gap-3 border-t border-white/10 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 truncate text-xs leading-5 text-white/45">
            {selected.size === 0
              ? "Nothing selected yet."
              : [...selected.values()].map((c) => c.name).join(", ")}
          </p>
          <Button
            onClick={() => addMutation.mutate()}
            disabled={selected.size === 0 || addMutation.isPending}
            className="shrink-0 bg-primary font-semibold text-black hover:bg-primary/90"
          >
            {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add {selected.size || ""} {selected.size === 1 ? "country" : "countries"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
