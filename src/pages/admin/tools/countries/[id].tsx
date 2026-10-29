import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FolderInput, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";

import { getAllTemplatesForAdmin, getCountry, removeTemplatesFromCountry } from "@/api/apiEndpoints";
import AddTemplatesDialog from "@/components/Admin/Tools/AddTemplatesDialog";
import ToolCard from "@/components/Admin/Tools/ToolCard";
import ToolGridSkeleton from "@/components/ToolGridSkeleton";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { useDebounce } from "@/hooks/useDebounce";
import errorMessage from "@/lib/utils/errorMessage";
import type { Country } from "@/types";

export default function CountryTemplates() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const debouncedSearch = useDebounce(searchInput, 300);

  const { data: country, isLoading: countryLoading } = useQuery<Country>({
    queryKey: ["country", id],
    queryFn: () => getCountry(id as string),
    enabled: !!id,
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["templates", "country", id, { search: debouncedSearch }],
    queryFn: () =>
      getAllTemplatesForAdmin({ country: id as string, search: debouncedSearch.trim() || undefined }),
    enabled: !!id,
    placeholderData: (previous) => previous,
  });

  const removeMutation = useMutation({
    mutationFn: (templateId: string) => removeTemplatesFromCountry(id as string, [templateId]),
    onSuccess: () => {
      toast.success(`Removed from ${country?.name ?? "country"}`);
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["countries"] });
      queryClient.invalidateQueries({ queryKey: ["country", id] });
    },
    onError: (error: Error) => toast.error(errorMessage(error)),
  });

  if (countryLoading || templatesLoading) return <ToolGridSkeleton />;

  if (!country) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Country not found</h3>
          <Link to="/admin/tools?tab=countries" className="text-white/60 underline">
            Back to countries
          </Link>
        </div>
      </div>
    );
  }

  const addButton = (
    <button
      type="button"
      onClick={() => setAddOpen(true)}
      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
    >
      <FolderInput className="h-4 w-4" />
      Add templates
    </button>
  );

  return (
    <div className="dashboard-content space-y-6">
      <Link
        to="/admin/tools?tab=countries"
        className="flex w-fit items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-white/60 transition-colors hover:text-white"
        aria-label="Back to countries"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>

      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <CountryFlag code={country.code} className="h-9 w-12 rounded-md" />
          <div>
            <h1 className="text-3xl font-bold italic tracking-tighter text-white">
              {country.name} <span className="text-primary">Templates</span>
            </h1>
            <p className="mt-1 text-white/60">
              {templates.length} template{templates.length === 1 ? "" : "s"} for {country.name}
            </p>
          </div>
        </div>
        {addButton}
      </div>

      <AddTemplatesDialog kind="country" group={country} open={addOpen} onOpenChange={setAddOpen} />

      {(templates.length > 0 || searchInput) && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pr-4 pl-10 text-white placeholder:text-white/40 transition-all focus:outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
      )}

      {templates.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => {
            const removing = removeMutation.isPending && removeMutation.variables === template.id;
            return (
              <div key={template.id} className="space-y-2">
                <ToolCard tool={template} />
                <button
                  type="button"
                  onClick={() => removeMutation.mutate(template.id)}
                  disabled={removing}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white/45 transition-colors hover:bg-white/5 hover:text-white/80 disabled:opacity-50"
                >
                  {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                  Remove from {country.name}
                </button>
              </div>
            );
          })}
        </div>
      ) : searchInput ? (
        <p className="py-12 text-center text-white/60">No templates found matching "{searchInput}"</p>
      ) : (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <h3 className="text-lg font-semibold">No templates yet</h3>
          <p className="text-white/60">Add the templates that are for {country.name}.</p>
          {addButton}
        </div>
      )}
    </div>
  );
}
