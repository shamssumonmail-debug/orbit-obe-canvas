import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ArrowUpDown, Ban, Pencil, Plus, RotateCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/mock-auth";
import { PAGE_SIZE, canManageMasterData, type FieldDef, type ResourceDef } from "@/lib/master-data";

type Row = Record<string, unknown>;

/**
 * The generated Supabase types are per-table literals; this module is generic over
 * the master-data tables, so queries go through a loosely typed accessor.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = (table: string) => (supabase as any).from(table) as any;

function emptyForm(fields: FieldDef[], defaults?: Row): Row {
  const out: Row = {};
  for (const f of fields) {
    const preset = defaults?.[f.name];
    if (preset !== undefined) {
      out[f.name] = preset;
      continue;
    }
    out[f.name] = f.type === "boolean" ? true : f.type === "number" ? 0 : "";
  }
  return out;
}

function validate(fields: FieldDef[], values: Row): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    const raw = values[f.name];
    if (f.type === "boolean") continue;
    const isEmpty = raw === "" || raw === null || raw === undefined;
    if (f.required && isEmpty) {
      errors[f.name] = `${f.label} is required`;
      continue;
    }
    if (f.type === "number" && !isEmpty) {
      const n = Number(raw);
      if (Number.isNaN(n)) errors[f.name] = `${f.label} must be a number`;
      else if (f.min !== undefined && n < f.min) errors[f.name] = `${f.label} must be at least ${f.min}`;
      else if (f.max !== undefined && n > f.max) errors[f.name] = `${f.label} must be at most ${f.max}`;
    }
  }
  if ("min_score" in values && "max_score" in values) {
    const min = Number(values["min_score"]);
    const max = Number(values["max_score"]);
    if (!Number.isNaN(min) && !Number.isNaN(max) && min > max) {
      errors["max_score"] = "Max score must be greater than or equal to min score";
    }
  }
  return errors;
}

function toPayload(fields: FieldDef[], values: Row): Row {
  const out: Row = {};
  for (const f of fields) {
    const raw = values[f.name];
    if (f.type === "number") out[f.name] = Number(raw);
    else if (f.type === "boolean") out[f.name] = Boolean(raw);
    else out[f.name] = raw === "" ? (f.required ? "" : null) : raw;
  }
  return out;
}

export function MasterDataTable({
  resource,
  filter,
  optionLabels,
  toolbar,
}: {
  resource: ResourceDef;
  /** Extra equality filter, e.g. { department_id: "..." }. */
  filter?: Record<string, string> | undefined;
  /** Human labels for select values, keyed by field name then value. */
  optionLabels?: Record<string, Record<string, string>> | undefined;
  toolbar?: React.ReactNode | undefined;
}) {
  const { user } = useAuth();
  const canManage = canManageMasterData(user?.role);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(resource.defaultSort);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [values, setValues] = useState<Row>(() => emptyForm(resource.fields));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filterKey = JSON.stringify(filter ?? {});
  const queryKey = ["master-data", resource.table, filterKey];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = db(resource.table).select("*");
      for (const [k, v] of Object.entries(filter ?? {})) query = query.eq(k, v);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const tableFields = resource.fields.filter((f) => f.inTable !== false);
  const searchFields = resource.fields.filter((f) => f.searchable);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = data ?? [];
    if (term) {
      list = list.filter((row) =>
        searchFields.some((f) => {
          const value = row[f.name];
          const label = optionLabels?.[f.name]?.[String(value)];
          return `${String(value ?? "")} ${label ?? ""}`.toLowerCase().includes(term);
        }),
      );
    }
    return [...list].sort((a, b) => {
      const av = a[sort.column];
      const bv = b[sort.column];
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sort.ascending ? cmp : -cmp;
    });
  }, [data, search, searchFields, sort, optionLabels]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const saveMutation = useMutation({
    mutationFn: async (payload: Row) => {
      if (editing) {
        const { error } = await db(resource.table)
          .update(payload)
          .eq("id", editing["id"] as string);
        if (error) throw error;
      } else {
        const { error } = await db(resource.table).insert({ ...payload, ...(filter ?? {}) });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(`${resource.singular} ${editing ? "updated" : "created"}`);
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: { message?: string }) =>
      toast.error(err?.message ?? `Could not save ${resource.singular.toLowerCase()}`),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (row: Row) => {
      const { error } = await db(resource.table)
        .update({ is_active: !row["is_active"] })
        .eq("id", row["id"] as string);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: { message?: string }) => toast.error(err?.message ?? "Could not update status"),
  });

  const openCreate = () => {
    setEditing(null);
    setValues(emptyForm(resource.fields, filter));
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (row: Row) => {
    setEditing(row);
    setValues(emptyForm(resource.fields, row));
    setErrors({});
    setDialogOpen(true);
  };

  const submit = () => {
    const nextErrors = validate(resource.fields, values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    saveMutation.mutate(toPayload(resource.fields, values));
  };

  const toggleSort = (column: string) =>
    setSort((s) => (s.column === column ? { column, ascending: !s.ascending } : { column, ascending: true }));

  const hasIsActive = resource.fields.some((f) => f.name === "is_active");

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{resource.title}</CardTitle>
            <CardDescription>{resource.description}</CardDescription>
          </div>
          {canManage ? (
            <Button onClick={openCreate}>
              <Plus className="mr-2 size-4" /> Add New
            </Button>
          ) : (
            <Badge variant="secondary">Read-only access</Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {toolbar}
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={`Search ${resource.title.toLowerCase()}…`}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm">
            <p className="font-medium text-destructive">Could not load {resource.title.toLowerCase()}</p>
            <p className="mt-1 text-muted-foreground">
              {(error as { message?: string }).message ??
                "This reference data is only readable by signed-in accounts."}
            </p>
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center">
            <p className="text-sm font-medium">
              {search ? `No ${resource.title.toLowerCase()} match “${search}”` : `No ${resource.title.toLowerCase()} yet`}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search
                ? "Try a different search term."
                : canManage
                  ? `Use “Add New” to create the first ${resource.singular.toLowerCase()}.`
                  : "An administrator has not added any records yet."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {tableFields.map((f) => (
                      <TableHead key={f.name} className={f.className}>
                        {f.sortable ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(f.name)}
                            className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                          >
                            {f.label}
                            {sort.column === f.name ? (
                              sort.ascending ? (
                                <ArrowUp className="size-3.5" />
                              ) : (
                                <ArrowDown className="size-3.5" />
                              )
                            ) : (
                              <ArrowUpDown className="size-3.5 opacity-40" />
                            )}
                          </button>
                        ) : (
                          f.label
                        )}
                      </TableHead>
                    ))}
                    {canManage && <TableHead className="w-36 text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((row) => (
                    <TableRow key={String(row["id"])} className={row["is_active"] === false ? "opacity-60" : undefined}>
                      {tableFields.map((f) => {
                        const value = row[f.name];
                        return (
                          <TableCell key={f.name} className={f.className}>
                            {f.type === "boolean" ? (
                              f.name === "is_active" ? (
                                <Badge variant={value ? "default" : "secondary"}>
                                  {value ? "Active" : "Inactive"}
                                </Badge>
                              ) : (
                                <Badge variant={value ? "default" : "outline"}>{value ? "Yes" : "No"}</Badge>
                              )
                            ) : (
                              <span className={f.type === "textarea" ? "line-clamp-2 text-muted-foreground" : undefined}>
                                {optionLabels?.[f.name]?.[String(value)] ?? (value === null || value === "" ? "—" : String(value))}
                              </span>
                            )}
                          </TableCell>
                        );
                      })}
                      {canManage && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                              <Pencil className="mr-1 size-3.5" /> Edit
                            </Button>
                            {hasIsActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleActiveMutation.mutate(row)}
                                disabled={toggleActiveMutation.isPending}
                              >
                                {row["is_active"] === false ? (
                                  <>
                                    <RotateCcw className="mr-1 size-3.5" /> Restore
                                  </>
                                ) : (
                                  <>
                                    <Ban className="mr-1 size-3.5" /> Deactivate
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <p>
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, rows.length)} of{" "}
                {rows.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${resource.singular}` : `Add ${resource.singular}`}
            </DialogTitle>
            <DialogDescription>
              Fields marked required must be filled in. Codes must stay unique.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {resource.fields.map((f) => (
              <div key={f.name} className="space-y-2">
                <Label htmlFor={`field-${f.name}`}>
                  {f.label}
                  {f.required && <span className="ml-1 text-destructive">*</span>}
                </Label>

                {f.type === "boolean" ? (
                  <div className="flex items-center gap-3">
                    <Switch
                      id={`field-${f.name}`}
                      checked={Boolean(values[f.name])}
                      onCheckedChange={(checked) => setValues((v) => ({ ...v, [f.name]: checked }))}
                    />
                    <span className="text-sm text-muted-foreground">
                      {Boolean(values[f.name]) ? "Yes" : "No"}
                    </span>
                  </div>
                ) : f.type === "select" ? (
                  <Select
                    value={String(values[f.name] ?? "")}
                    onValueChange={(val) => setValues((v) => ({ ...v, [f.name]: val }))}
                  >
                    <SelectTrigger id={`field-${f.name}`}>
                      <SelectValue placeholder={`Select ${f.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {(f.options ?? []).map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {optionLabels?.[f.name]?.[opt] ?? opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : f.type === "textarea" ? (
                  <Textarea
                    id={`field-${f.name}`}
                    value={String(values[f.name] ?? "")}
                    rows={3}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  />
                ) : (
                  <Input
                    id={`field-${f.name}`}
                    type={f.type === "number" ? "number" : "text"}
                    min={f.min}
                    max={f.max}
                    value={String(values[f.name] ?? "")}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  />
                )}

                {errors[f.name] ? (
                  <p className="text-xs text-destructive">{errors[f.name]}</p>
                ) : f.hint ? (
                  <p className="text-xs text-muted-foreground">{f.hint}</p>
                ) : null}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving…" : editing ? "Save changes" : `Create ${resource.singular}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
