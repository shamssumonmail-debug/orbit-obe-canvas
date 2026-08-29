import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, RotateCcw, ShieldCheck, Undo2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import {
  isAdmin,
  isCoordinator,
  profileLabel,
  useCurrentUserId,
  useReferenceData,
  type CourseOffering,
} from "@/lib/course-setup";
import { useCoDetails, useCourseOutcomes } from "./course-outcomes-tab";
import { useWeeklySchedule } from "./weekly-schedule-tab";

function fmt(ts: string | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}

export function ApprovalTab({ offering }: { offering: CourseOffering }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = useCurrentUserId();
  const { profiles, courses, semesters, bloom, programOutcomes, knowledgeProfiles, problemAttributes } =
    useReferenceData();
  const outcomes = useCourseOutcomes(offering.id);
  const details = useCoDetails((outcomes.data ?? []).map((c) => c.id));
  const schedule = useWeeklySchedule(offering.id);
  const [comment, setComment] = useState(offering.review_comment ?? "");

  const course = courses.find((c) => c.id === offering.curriculum_course_id);
  const semester = semesters.find((s) => s.id === offering.semester_type_id);
  const findProfile = (id: string | null) => profiles.find((p) => p.id === id);

  const coordinator = isCoordinator(user?.role);
  const admin = isAdmin(user?.role);

  const transition = useMutation({
    mutationFn: async (
      action: "check" | "approve" | "send-back" | "reopen",
    ): Promise<void> => {
      if (action === "send-back" && !comment.trim()) {
        throw new Error("A review comment is required when sending an offering back to draft");
      }
      const base = { review_comment: comment.trim() || null };
      const now = new Date().toISOString();
      const patch =
        action === "check"
          ? { ...base, status: "checked" as const, checked_by: userId, checked_at: now }
          : action === "approve"
            ? { ...base, status: "approved" as const, approved_by: userId, approved_at: now }
            : {
                ...base,
                status: "draft" as const,
                checked_by: null,
                checked_at: null,
                approved_by: null,
                approved_at: null,
              };

      const { error } = await supabase.from("course_offerings").update(patch).eq("id", offering.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status updated");
      void queryClient.invalidateQueries({ queryKey: ["course-setup", "offering", offering.id] });
      void queryClient.invalidateQueries({ queryKey: ["course-setup", "offerings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const coList = outcomes.data ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Course details summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Course" value={course ? `${course.course_code} — ${course.course_title}` : "—"} />
          <Field label="Term" value={`${semester?.code ?? "—"} ${offering.academic_year}`} />
          <Field label="Section" value={offering.section} />
          <Field label="Course type" value={offering.course_type} />
          <Field label="Credit hours" value={String(offering.credit_hours)} />
          <Field label="Faculty" value={profileLabel(findProfile(offering.instructor_id))} />
          <Field label="Consultation hours" value={offering.consultation_hours || "—"} />
          <Field
            label="Grading weights"
            value={`Class ${offering.grading_weight_class_performance}% · Quiz/Assign ${offering.grading_weight_quiz_assignment}% · Final ${offering.grading_weight_final}%`}
          />
          <Field label="CO attainment target" value={`${offering.co_attainment_target_percent}%`} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Course outcomes &amp; mapping</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">CO</TableHead>
                <TableHead>Statement</TableHead>
                <TableHead className="w-40">Bloom's</TableHead>
                <TableHead>PO</TableHead>
                <TableHead>K-profile</TableHead>
                <TableHead>Attributes</TableHead>
                <TableHead className="w-28">Marks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-sm text-muted-foreground">
                    No course outcomes defined yet.
                  </TableCell>
                </TableRow>
              )}
              {coList.map((co) => {
                const b = bloom.find((x) => x.id === co.bloom_taxonomy_level_id);
                const po = (details.data?.po ?? [])
                  .filter((m) => m.course_outcome_id === co.id)
                  .map((m) => programOutcomes.find((p) => p.id === m.program_outcome_id)?.code)
                  .filter(Boolean);
                const kp = (details.data?.kp ?? [])
                  .filter((m) => m.course_outcome_id === co.id)
                  .map((m) => knowledgeProfiles.find((p) => p.id === m.knowledge_profile_id)?.code)
                  .filter(Boolean);
                const pa = (details.data?.pa ?? [])
                  .filter((m) => m.course_outcome_id === co.id)
                  .map((m) => problemAttributes.find((p) => p.id === m.complex_problem_attribute_id)?.code)
                  .filter(Boolean);
                const marks = (details.data?.tools ?? [])
                  .filter((t) => t.course_outcome_id === co.id)
                  .reduce((s, t) => s + Number(t.max_marks), 0);
                return (
                  <TableRow key={co.id}>
                    <TableCell className="font-medium">{co.co_number}</TableCell>
                    <TableCell className="min-w-64 text-sm">{co.co_statement}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {b ? `${b.domain} — ${b.level}` : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{po.join(", ") || "—"}</TableCell>
                    <TableCell className="text-sm">{kp.join(", ") || "—"}</TableCell>
                    <TableCell className="text-sm">{pa.join(", ") || "—"}</TableCell>
                    <TableCell className="text-sm">{marks || "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weekly schedule</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Week</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead className="w-24">CO</TableHead>
                <TableHead className="w-48">Delivery</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(schedule.data ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-sm text-muted-foreground">
                    No weeks added yet.
                  </TableCell>
                </TableRow>
              )}
              {(schedule.data ?? []).map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.week_number}</TableCell>
                  <TableCell className="text-sm">{r.topic}</TableCell>
                  <TableCell className="text-sm">
                    {coList.find((c) => c.id === r.course_outcome_id)?.co_number ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.delivery_method || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Approval workflow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <TimelineStep
              label="Prepared by"
              name={profileLabel(findProfile(offering.created_by))}
              at={fmt(offering.created_at)}
              done
            />
            <TimelineStep
              label="Checked by"
              name={offering.checked_by ? profileLabel(findProfile(offering.checked_by)) : "Pending"}
              at={fmt(offering.checked_at)}
              done={!!offering.checked_at}
            />
            <TimelineStep
              label="Approved by"
              name={offering.approved_by ? profileLabel(findProfile(offering.approved_by)) : "Pending"}
              at={fmt(offering.approved_at)}
              done={!!offering.approved_at}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="review_comment">Review comment</Label>
            <Textarea
              id="review_comment"
              rows={3}
              value={comment}
              placeholder="Notes for the faculty member — required when sending back to draft."
              disabled={!coordinator}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {!coordinator ? (
            <p className="text-sm text-muted-foreground">
              Only an OBE coordinator or super admin can move this offering through the workflow.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {offering.status === "draft" && (
                <Button onClick={() => transition.mutate("check")} disabled={transition.isPending}>
                  <CheckCircle2 className="mr-2 size-4" /> Mark as Checked
                </Button>
              )}
              {offering.status === "checked" && admin && (
                <Button onClick={() => transition.mutate("approve")} disabled={transition.isPending}>
                  <ShieldCheck className="mr-2 size-4" /> Approve
                </Button>
              )}
              {offering.status === "checked" && (
                <Button
                  variant="outline"
                  onClick={() => transition.mutate("send-back")}
                  disabled={transition.isPending}
                >
                  <Undo2 className="mr-2 size-4" /> Send back to Draft
                </Button>
              )}
              {offering.status === "approved" && admin && (
                <Button
                  variant="outline"
                  onClick={() => transition.mutate("reopen")}
                  disabled={transition.isPending}
                >
                  <RotateCcw className="mr-2 size-4" /> Reopen for editing
                </Button>
              )}
              {offering.status === "approved" && !admin && (
                <p className="text-sm text-muted-foreground">
                  This offering is approved and locked. A super admin can reopen it for editing.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  );
}

function TimelineStep({
  label,
  name,
  at,
  done,
}: {
  label: string;
  name: string;
  at: string;
  done: boolean;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <Badge variant={done ? "default" : "outline"} className="text-[10px]">
          {done ? "Done" : "Pending"}
        </Badge>
      </div>
      <p className="mt-1 text-sm font-medium">{name}</p>
      <p className="text-xs text-muted-foreground">{at}</p>
    </div>
  );
}
