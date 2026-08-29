import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Lock, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/obe/app-shell";
import { RequireAuth } from "@/components/obe/require-auth";
import {
  BasicInfoForm,
  emptyBasicInfo,
  validateBasicInfo,
  type BasicInfoValue,
} from "@/components/obe/course-setup/basic-info-form";
import { ApprovalTab } from "@/components/obe/course-setup/approval-tab";
import { CourseOutcomesTab } from "@/components/obe/course-setup/course-outcomes-tab";
import { WeeklyScheduleTab } from "@/components/obe/course-setup/weekly-schedule-tab";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/mock-auth";
import {
  STATUS_LABEL,
  canEditOffering,
  useCurrentUserId,
  useReferenceData,
  type CourseOffering,
} from "@/lib/course-setup";

export const Route = createFileRoute("/course-setup/$id")({
  head: () => ({
    meta: [
      { title: "Course Details Form · OBE Suite" },
      {
        name: "description",
        content:
          "Edit a course offering: basic info, course outcomes with CO-PO mapping, weekly schedule and the approval workflow.",
      },
      { property: "og:title", content: "Course Details Form · OBE Suite" },
      {
        property: "og:description",
        content: "Basic info, course outcomes, CO-PO mapping, weekly schedule and approval signatures.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CourseOfferingDetailRoute,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-10 text-sm text-destructive">
      {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-10 text-sm text-muted-foreground">Course offering not found.</div>,
});

function CourseOfferingDetailRoute() {
  return (
    <RequireAuth>
      <CourseOfferingDetail />
    </RequireAuth>
  );
}

function CourseOfferingDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const userId = useCurrentUserId();
  const queryClient = useQueryClient();
  const { courses, semesters } = useReferenceData();

  const offering = useQuery({
    queryKey: ["course-setup", "offering", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("course_offerings").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return (data ?? null) as CourseOffering | null;
    },
  });

  const slots = useConsultationSlots(id);
  const [form, setForm] = useState<BasicInfoValue>(emptyBasicInfo);
  const loadedAt = offering.data?.updated_at;
  const slotsKey = (slots.data ?? []).map((s) => s.id).join(",");

  useEffect(() => {
    const o = offering.data;
    if (!o) return;
    const course = courses.find((c) => c.id === o.curriculum_course_id);
    setForm({
      department_id: course?.department_id ?? "",
      curriculum_course_id: o.curriculum_course_id,
      academic_year: o.academic_year,
      semester_type_id: o.semester_type_id,
      section: o.section,
      course_type: o.course_type,
      course_category: o.course_category ?? "Core",
      credit_hours: Number(o.credit_hours),
      instructor_id: o.instructor_id,
      consultation_hours: o.consultation_hours ?? "",
      programme: o.programme ?? "",
      faculty_name: o.faculty_name ?? "",
      level_year: o.level_year ?? 1,
      level_semester: o.level_semester ?? 1,
      synopsis: o.synopsis ?? "",
      prerequisites: o.prerequisites ?? "",
      consultation_slots: (slots.data ?? []).map((s) => ({
        key: s.id,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
      })),
      grading_weight_class_performance: Number(o.grading_weight_class_performance),
      grading_weight_quiz_assignment: Number(o.grading_weight_quiz_assignment),
      grading_weight_final: Number(o.grading_weight_final),
      co_attainment_target_percent: Number(o.co_attainment_target_percent),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedAt, courses.length, slotsKey]);

  const saveBasics = useMutation({
    mutationFn: async () => {
      const problem = validateBasicInfo(form);
      if (problem) throw new Error(problem);
      const { error } = await supabase.from("course_offerings").update(basicInfoPayload(form)).eq("id", id);
      if (error) throw error;
      await saveConsultationSlots(id, form.consultation_slots);
    },
    onSuccess: () => {
      toast.success("Basic info saved");
      void queryClient.invalidateQueries({ queryKey: ["course-setup", "offering", id] });
      void queryClient.invalidateQueries({ queryKey: ["course-setup", "offerings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (offering.isLoading) {
    return (
      <AppShell title="Course Details Form">
        <Skeleton className="h-64 w-full" />
      </AppShell>
    );
  }

  if (offering.error) {
    return (
      <AppShell title="Course Details Form">
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
          Could not load this course offering: {(offering.error as Error).message}
        </div>
      </AppShell>
    );
  }

  const o = offering.data;
  if (!o) {
    return (
      <AppShell title="Course Details Form">
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm font-medium">Course offering not found</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/course-setup">Back to Course Setup</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const editable = canEditOffering(o, user?.role, userId);
  const readOnly = !editable;
  const course = courses.find((c) => c.id === o.curriculum_course_id);
  const semester = semesters.find((s) => s.id === o.semester_type_id);

  return (
    <AppShell
      title={course ? `${course.course_code} — ${course.course_title}` : "Course Details Form"}
      subtitle={`${semester?.code ?? ""} ${o.academic_year} · Section ${o.section} · ${o.course_type}`}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/course-setup">
              <ArrowLeft className="mr-2 size-4" /> All offerings
            </Link>
          </Button>
          <Badge variant={o.status === "approved" ? "default" : o.status === "checked" ? "secondary" : "outline"}>
            {STATUS_LABEL[o.status]}
          </Badge>
          {readOnly && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="size-3.5" />
              {o.status === "approved"
                ? "Approved and locked — a super admin can reopen it from the Approval tab."
                : "Read-only for your role at this status."}
            </span>
          )}
        </div>

        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="outcomes">Course Outcomes</TabsTrigger>
            <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
            <TabsTrigger value="approval">Approval</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <BasicInfoForm value={form} onChange={setForm} disabled={readOnly} />
            {!readOnly && (
              <div className="flex justify-end">
                <Button onClick={() => saveBasics.mutate()} disabled={saveBasics.isPending}>
                  <Save className="mr-2 size-4" /> {saveBasics.isPending ? "Saving…" : "Save basic info"}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="outcomes">
            <CourseOutcomesTab offeringId={o.id} readOnly={readOnly} />
          </TabsContent>

          <TabsContent value="schedule">
            <WeeklyScheduleTab offeringId={o.id} readOnly={readOnly} />
          </TabsContent>

          <TabsContent value="approval">
            <ApprovalTab offering={o} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
