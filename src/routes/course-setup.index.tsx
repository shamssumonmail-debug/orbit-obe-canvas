import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/obe/app-shell";
import { RequireAuth } from "@/components/obe/require-auth";
import {
  BasicInfoForm,
  basicInfoPayload,
  emptyBasicInfo,
  validateBasicInfo,
  type BasicInfoValue,
} from "@/components/obe/course-setup/basic-info-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/mock-auth";
import {
  STATUS_LABEL,
  isCoordinator,
  profileLabel,
  saveConsultationSlots,
  useCurrentUserId,
  useReferenceData,
  type CourseOffering,
  type OfferingStatus,
} from "@/lib/course-setup";

export const Route = createFileRoute("/course-setup/")({
  head: () => ({
    meta: [
      { title: "Course Setup & CO-PO Mapping · OBE Suite" },
      {
        name: "description",
        content:
          "Create course offerings, define course outcomes with PO, knowledge profile and attribute mapping, and track the approval workflow.",
      },
      { property: "og:title", content: "Course Setup & CO-PO Mapping · OBE Suite" },
      {
        property: "og:description",
        content: "Course offerings, course outcomes, CO-PO mapping and the course details approval workflow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CourseSetupListRoute,
});

function CourseSetupListRoute() {
  return (
    <RequireAuth>
      <AppShell title="Course Setup" subtitle="Course offerings, course outcomes and CO-PO mapping">
        <CourseSetupList />
      </AppShell>
    </RequireAuth>
  );
}

const statusVariant: Record<OfferingStatus, "secondary" | "outline" | "default"> = {
  draft: "outline",
  checked: "secondary",
  approved: "default",
};

function CourseSetupList() {
  const { user } = useAuth();
  const userId = useCurrentUserId();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { courses, semesters, profiles } = useReferenceData();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [term, setTerm] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<BasicInfoValue>(emptyBasicInfo);

  const offerings = useQuery({
    queryKey: ["course-setup", "offerings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_offerings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CourseOffering[];
    },
  });

  const coCounts = useQuery({
    queryKey: ["course-setup", "co-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("course_outcomes").select("course_offering_id");
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const r of data ?? []) {
        const k = (r as { course_offering_id: string }).course_offering_id;
        map[k] = (map[k] ?? 0) + 1;
      }
      return map;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const problem = validateBasicInfo(form);
      if (problem) throw new Error(problem);
      if (!userId) throw new Error("Your session is still loading — try again in a moment");
      const { data, error } = await supabase
        .from("course_offerings")
        .insert({ ...basicInfoPayload(form), created_by: userId })
        .select("id")
        .single();
      if (error) throw error;
      await saveConsultationSlots(data.id as string, form.consultation_slots);
      return data.id as string;
    },
    onSuccess: (id) => {
      toast.success("Course offering created");
      setDialogOpen(false);
      setForm(emptyBasicInfo());
      void queryClient.invalidateQueries({ queryKey: ["course-setup", "offerings"] });
      void navigate({ to: "/course-setup/$id", params: { id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const terms = useMemo(() => {
    const set = new Map<string, string>();
    for (const o of offerings.data ?? []) {
      const sem = semesters.find((s) => s.id === o.semester_type_id);
      const key = `${o.semester_type_id}|${o.academic_year}`;
      set.set(key, `${sem?.code ?? "Semester"} ${o.academic_year}`);
    }
    return [...set.entries()].map(([id, label]) => ({ id, label }));
  }, [offerings.data, semesters]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (offerings.data ?? []).filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (term !== "all" && `${o.semester_type_id}|${o.academic_year}` !== term) return false;
      if (!q) return true;
      const course = courses.find((c) => c.id === o.curriculum_course_id);
      const instructor = profiles.find((p) => p.id === o.instructor_id);
      return [course?.course_code, course?.course_title, o.section, profileLabel(instructor)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [offerings.data, search, status, term, courses, profiles]);

  const canCreate = !!user;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Course Offerings</CardTitle>
            <CardDescription>
              One record per course, term, section and instructor — mirroring the printed Course Details Form.
            </CardDescription>
          </div>
          {canCreate && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 size-4" /> New Course Offering
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-56 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search course, section or instructor…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="checked">Checked</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All terms</SelectItem>
                {terms.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {offerings.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : offerings.error ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
              Could not load course offerings: {(offerings.error as Error).message}
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-10 text-center">
              <p className="text-sm font-medium">No course offerings found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create one to start defining course outcomes and CO-PO mapping.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead className="w-40">Term</TableHead>
                    <TableHead className="w-28">Section</TableHead>
                    <TableHead className="w-48">Instructor</TableHead>
                    <TableHead className="w-28">Status</TableHead>
                    <TableHead className="w-20">COs</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((o) => {
                    const course = courses.find((c) => c.id === o.curriculum_course_id);
                    const sem = semesters.find((s) => s.id === o.semester_type_id);
                    return (
                      <TableRow key={o.id}>
                        <TableCell>
                          <p className="font-medium">{course?.course_code ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{course?.course_title ?? ""}</p>
                        </TableCell>
                        <TableCell className="text-sm">
                          {sem?.code ?? "—"} {o.academic_year}
                        </TableCell>
                        <TableCell className="text-sm">{o.section}</TableCell>
                        <TableCell className="text-sm">
                          {profileLabel(profiles.find((p) => p.id === o.instructor_id))}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[o.status]}>{STATUS_LABEL[o.status]}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{coCounts.data?.[o.id] ?? 0}</TableCell>
                        <TableCell>
                          <Button asChild variant="ghost" size="sm">
                            <Link to="/course-setup/$id" params={{ id: o.id }}>
                              Open
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New course offering</DialogTitle>
            <DialogDescription>
              Fill in the basic info — you can add course outcomes and the weekly schedule next.
            </DialogDescription>
          </DialogHeader>
          <BasicInfoForm value={form} onChange={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create offering"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!isCoordinator(user?.role) && (
        <p className="text-xs text-muted-foreground">
          You can create and edit your own draft offerings. Checking and approving is handled by OBE
          coordinators and super admins.
        </p>
      )}
    </div>
  );
}
