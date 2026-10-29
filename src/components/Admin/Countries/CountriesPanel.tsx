import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { Eye, Loader, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { deleteCountry, getCountries } from "@/api/apiEndpoints";
import { ConfirmAction } from "@/components/ConfirmAction";
import TableSkeleton from "@/components/Admin/Layouts/TableSkeleton";
import { Button } from "@/components/ui/button";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { DataTable } from "@/components/ui/data-table";
import { PremiumButton } from "@/components/ui/PremiumButton";
import type { Country } from "@/types";
import AddCountriesDialog from "./AddCountriesDialog";

const countryPath = (id: string) => `/admin/tools/countries/${id}`;

/** Admin list of countries templates are grouped under. */
export default function CountriesPanel() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: countries = [], isLoading } = useQuery<Country[]>({
    queryKey: ["countries"],
    queryFn: getCountries,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCountry,
    onSuccess: () => {
      toast.success("Country removed. Its templates are kept.");
      queryClient.invalidateQueries({ queryKey: ["countries"] });
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: () => toast.error("Failed to remove country"),
  });

  if (isLoading) return <TableSkeleton />;

  const columns: ColumnDef<Country>[] = [
    {
      accessorKey: "name",
      header: "Country",
      cell: ({ row }) => (
        <Link to={countryPath(row.original.id)} className="flex items-center gap-3 py-1">
          <CountryFlag code={row.original.code} className="h-5 w-7" />
          <span className="font-bold tracking-tight text-white">{row.original.name}</span>
          <span className="font-mono text-[11px] text-white/35">{row.original.code}</span>
        </Link>
      ),
      filterFn: (row, _id, value) => {
        const needle = (value as string)?.toLowerCase?.() ?? "";
        if (!needle) return true;
        return (
          row.original.name.toLowerCase().includes(needle) || row.original.code.toLowerCase() === needle
        );
      },
    },
    {
      accessorKey: "templates_count",
      header: "Templates",
      cell: ({ row }) => {
        const count = row.original.templates_count ?? 0;
        return (
          <Link
            to={countryPath(row.original.id)}
            className={`inline-flex min-w-9 items-center justify-center rounded-full border px-2.5 py-1 font-mono text-xs transition-colors ${
              count
                ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
                : "border-white/10 text-white/35 hover:text-white/60"
            }`}
            title={`${count} template${count === 1 ? "" : "s"} in ${row.original.name}`}
          >
            {count}
          </Link>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Added",
      cell: ({ row }) => (
        <span className="hidden text-white/60 md:inline">
          {new Date(row.original.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const isDeleting = deletingId === row.original.id && deleteMutation.isPending;
        return (
          <div className="flex items-center justify-end gap-2">
            <Link to={countryPath(row.original.id)}>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:bg-white/10 hover:text-white"
                title="View templates"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <ConfirmAction
              title="Remove country"
              description={`Remove "${row.original.name}"? Its templates are kept, they just won't be under a country.`}
              onConfirm={() => {
                setDeletingId(row.original.id);
                deleteMutation.mutate(row.original.id, { onSettled: () => setDeletingId(null) });
              }}
              trigger={
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full border-red-500/20 bg-red-500/5 text-red-400 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                  title="Remove country"
                  disabled={isDeleting}
                >
                  {isDeleting ? <Loader className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              }
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-white/60">
          Group templates by the country they&apos;re for. Users can filter All Tools by country.
        </p>
        <PremiumButton onClick={() => setAddOpen(true)} text="Add Country" icon={Plus} className="h-11 shrink-0 px-6" />
      </div>

      <DataTable
        columns={columns}
        data={countries}
        filterKey="name"
        searchPlaceholder="Search countries..."
        emptyMessage="No countries yet. Add the countries your templates are for."
        hideColumnToggle
      />

      <AddCountriesDialog open={addOpen} onOpenChange={setAddOpen} existing={countries} />
    </div>
  );
}
