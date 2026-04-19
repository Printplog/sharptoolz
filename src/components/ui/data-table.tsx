import { useMemo, useState } from "react";
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  Table as TanstackTable,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Loader,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { DebouncedInput } from "@/components/ui/debounced-inputs";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface DataTableFilterOption {
  label: string;
  value: string;
}

export interface DataTableFilter {
  key: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: DataTableFilterOption[];
  placeholder?: string;
  className?: string;
}

export interface DataTablePagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  className?: string;
  filterKey?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  toolbarActions?: (table: TanstackTable<TData>) => React.ReactNode;
  onRowClick?: (row: TData) => void;
  hideColumnToggle?: boolean;
  enableSelection?: boolean;
  selectionActions?: (
    selectedRows: TData[],
    table: TanstackTable<TData>
  ) => React.ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchDebounce?: number;
  filters?: DataTableFilter[];
  pagination?: DataTablePagination;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  className,
  filterKey,
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  isLoading,
  toolbarActions,
  onRowClick,
  hideColumnToggle = false,
  enableSelection = true,
  selectionActions,
  searchValue,
  onSearchChange,
  searchDebounce = 350,
  filters = [],
  pagination,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const selectionColumn = useMemo<ColumnDef<TData>>(() => {
    return {
      id: "__select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all rows"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    };
  }, []);

  const selectionEnabled = enableSelection && Boolean(selectionActions);

  const tableColumns = useMemo(
    () => (selectionEnabled ? [selectionColumn, ...columns] : columns),
    [columns, selectionColumn, selectionEnabled]
  );

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    manualPagination: Boolean(pagination),
    pageCount: pagination?.totalPages,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: pagination ? undefined : getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const usesServerSearch = Boolean(onSearchChange);

  const filterColumn = useMemo(() => {
    if (!filterKey || usesServerSearch) return undefined;
    return table.getColumn(filterKey);
  }, [filterKey, table, usesServerSearch]);

  const selectedRows = selectionEnabled
    ? table.getFilteredSelectedRowModel().rows.map((row) => row.original)
    : [];
  const selectedCount = selectedRows.length;
  const totalRows = pagination?.totalItems ?? table.getFilteredRowModel().rows.length;
  const currentPage = pagination?.page ?? table.getState().pagination.pageIndex + 1;
  const totalPages = Math.max(
    pagination?.totalPages ?? table.getPageCount() ?? 1,
    1
  );
  const pageSize = pagination?.pageSize ?? table.getState().pagination.pageSize;
  const showingFrom = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingTo = totalRows === 0 ? 0 : Math.min(currentPage * pageSize, totalRows);
  const canPreviousPage = pagination
    ? currentPage > 1
    : table.getCanPreviousPage();
  const canNextPage = pagination
    ? currentPage < totalPages
    : table.getCanNextPage();
  const activeServerSearch = (searchValue ?? "").trim().length > 0;
  const activeFiltersCount = filters.filter(
    (filter) => filter.value && filter.value !== "all"
  ).length;
  const showToolbar =
    Boolean(filterColumn) ||
    usesServerSearch ||
    filters.length > 0 ||
    toolbarActions ||
    !hideColumnToggle;

  const clearFilters = () => {
    if (filterColumn) {
      filterColumn.setFilterValue("");
    }

    onSearchChange?.("");
    filters.forEach((filter) => filter.onChange("all"));
  };

  return (
    <div className={cn("w-full flex flex-col gap-3", className)}>
      <div
        className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_28px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl"
      >
        {showToolbar && (
          <div
            className="bg-transparent p-4 border-b border-white/10"
          >
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              {(usesServerSearch || filterColumn) && (
                <div className="relative min-w-[260px] flex-1 xl:max-w-md">
                  <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-white/25" />
                  {usesServerSearch ? (
                    <DebouncedInput
                      value={searchValue ?? ""}
                      onChange={(value) => onSearchChange?.(String(value))}
                      debounce={searchDebounce}
                      placeholder={searchPlaceholder}
                      className="h-11 border-white/10 bg-white/5 pl-11 text-white placeholder:text-white/25 focus-visible:border-white/20 focus-visible:ring-white/10"
                    />
                  ) : (
                    <Input
                      placeholder={searchPlaceholder}
                      value={(filterColumn?.getFilterValue() as string) ?? ""}
                      onChange={(event) =>
                        filterColumn?.setFilterValue(event.target.value)
                      }
                      className="h-11 border-white/10 bg-white/5 pl-11 text-white placeholder:text-white/25 focus-visible:border-white/20 focus-visible:ring-white/10"
                    />
                  )}
                </div>
              )}

              {filters.map((filter) => (
                <div
                  key={filter.key}
                  className={cn("min-w-[180px] xl:w-auto", filter.className)}
                >
                  <Select value={filter.value} onValueChange={filter.onChange}>
                    <SelectTrigger className="h-11 w-full border-white/10 bg-white/5 text-white focus-visible:border-white/20 focus-visible:ring-white/10">
                      <div className="flex items-center gap-2 truncate">
                        <SlidersHorizontal className="h-3.5 w-3.5 text-white/35" />
                        <SelectValue
                          placeholder={filter.placeholder ?? filter.label ?? "Select"}
                        />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-white/5 text-white">
                      {filter.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}

              {(activeServerSearch || activeFiltersCount > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-11 px-4 text-white/55 hover:bg-white/[0.06] hover:text-white"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-start gap-2 xl:justify-end">
              {toolbarActions?.(table)}
              {!hideColumnToggle && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-11 gap-2 border-white/10 bg-white/5 px-4 text-white/70 hover:bg-white/10 hover:text-white"
                    >
                      <Columns3 className="h-4 w-4" />
                      Columns
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="border-white/10 bg-white/5 text-white"
                  >
                    <DropdownMenuLabel className="text-white/50">
                      Toggle columns
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {table
                      .getAllLeafColumns()
                      .filter((column) => column.getCanHide())
                      .map((column) => (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                        >
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      )}

        <Table>
          <TableHeader className="bg-background [&_tr]:border-white/10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="[&_tr:last-child]:border-0">
            {isLoading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={tableColumns.length}
                  className="h-40 text-center text-white/60"
                >
                  <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                    <Loader className="h-4 w-4 animate-spin" />
                    Loading rows...
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onRowClick?.(row.original)}
                  className={cn(
                    "group",
                    onRowClick &&
                      "cursor-pointer hover:bg-white/[0.05] active:bg-white/[0.08]"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={tableColumns.length}
                  className="h-40 text-center text-white/45"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60 shadow-[0_20px_70px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-white/60">
            Showing {showingFrom}-{showingTo} of {totalRows}
          </span>
          {selectionEnabled && (
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">
              {selectedCount} selected
            </span>
          )}
          {selectionEnabled &&
            selectedCount > 0 &&
            selectionActions?.(selectedRows, table)}
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span className="text-sm text-white/45">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                pagination
                  ? pagination.onPageChange(currentPage - 1)
                  : table.previousPage()
              }
              disabled={!canPreviousPage}
              className="h-10 w-10 border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white disabled:opacity-35"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                pagination
                  ? pagination.onPageChange(currentPage + 1)
                  : table.nextPage()
              }
              disabled={!canNextPage}
              className="h-10 w-10 border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white disabled:opacity-35"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
