import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import type { WeeklyScheduleRow } from "@/lib/course-setup";
import { useCourseOutcomes } from "./course-outcomes-tab";

type DraftWeek = {
  key: string;
  week_number: number;
  topic: string;
  course_outcome_id: string;
  delivery_method: string;
};

export function useWeeklySchedule(offeringId: string) {
  return useQuery({
    queryKey: ["course-setup", "schedule", offeringId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_weekly_schedule")
        .select("id, course_offering_id, week_number, topic, course_outcome_id, delivery_method")
        .eq("course_offering_id", offeringId)
        .order("week_number");
      if (error) throw error;
      return (data ?? []) as WeeklyScheduleRow[];
    },
  });
}

export function WeeklyScheduleTab({
  offeringId,
  readOnly,
}: {
  offeringId: string;
  readOnly: boolean;
}) {
  const queryClient = useQueryClient();
  const schedule = useWeeklySchedule(offeringId);
  const outcomes = useCourseOutcomes(offeringId);
  const [rows, setRows] = useState<DraftWeek[]>([]);

  const loadedKey = (schedule.data ?? []).map((r) => r.id).join(",");
  useEffect(() => {
    setRows(
      (schedule.data ?? []).map((r) => ({
        key: r.id,
        week_number: r.week_number,
        topic: r.topic,
        course_outcome_id: r.course_outcome_id ?? "",
        delivery_method: r.delivery_method ?? "",
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedKey]);

  const save = useMutation({
    mutationFn: async () => {
      const seen = new Set<number>();
      for (const r of rows) {
        if (!Number.isInteger(r.week_number) || r.week_number < 1)
          throw new Error("Week number must be a positive whole number");
        if (seen.has(r.week_number)) throw new Error(`Week ${r.week_number} is listed more than once`);
        seen.add(r.week_number);
        if (!r.topic.trim()) throw new Error(`Week ${r.week_number} needs a topic`);
      }

      const { error: delError } = await supabase
        .from("course_weekly_schedule")
        .delete()
        .eq("course_offering_id", offeringId);
      if (delError) throw delError;

      if (rows.length) {
        const { error } = await supabase.from("course_weekly_schedule").insert(
          rows.map((r) => ({
            course_offering_id: offeringId,
            week_number: r.week_number,
            topic: r.topic.trim(),
            course_outcome_id: r.course_outcome_id || null,
            delivery_method: r.delivery_method.trim() || null,
          })),
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Weekly schedule saved");
      void queryClient.invalidateQueries({ queryKey: ["course-setup", "schedule", offeringId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (schedule.isLoading) return <Skeleton className="h-48 w-full" />;

  if (schedule.error) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
        Could not load the weekly schedule: {(schedule.error as Error).message}
      </div>
    );
  }

  const coList = outcomes.data ?? [];

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Week</TableHead>
              <TableHead>Topic</TableHead>
              <TableHead className="w-40">Course outcome</TableHead>
              <TableHead className="w-48">Delivery method</TableHead>
              {!readOnly && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={readOnly ? 4 : 5} className="text-sm text-muted-foreground">
                  No weeks added yet.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r, i) => (
              <TableRow key={r.key}>
                <TableCell>
                  <Input
                    type="number"
                    min={1}
                    value={r.week_number}
                    disabled={readOnly}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((x, xi) => (xi === i ? { ...x, week_number: Number(e.target.value) } : x)),
                      )
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={r.topic}
                    placeholder="Topic covered this week"
                    disabled={readOnly}
                    onChange={(e) =>
                      setRows((prev) => prev.map((x, xi) => (xi === i ? { ...x, topic: e.target.value } : x)))
                    }
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={r.course_outcome_id || "none"}
                    disabled={readOnly}
                    onValueChange={(v) =>
                      setRows((prev) =>
                        prev.map((x, xi) =>
                          xi === i ? { ...x, course_outcome_id: v === "none" ? "" : v } : x,
                        ),
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— none —</SelectItem>
                      {coList.map((co) => (
                        <SelectItem key={co.id} value={co.id}>
                          {co.co_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    value={r.delivery_method}
                    placeholder="Lecture, lab, project…"
                    disabled={readOnly}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((x, xi) => (xi === i ? { ...x, delivery_method: e.target.value } : x)),
                      )
                    }
                  />
                </TableCell>
                {!readOnly && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove week ${r.week_number}`}
                      onClick={() => setRows((prev) => prev.filter((_, xi) => xi !== i))}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="outline"
            onClick={() =>
              setRows((prev) => [
                ...prev,
                {
                  key: `new-${Date.now()}-${prev.length}`,
                  week_number: prev.length ? Math.max(...prev.map((p) => p.week_number)) + 1 : 1,
                  topic: "",
                  course_outcome_id: "",
                  delivery_method: "",
                },
              ])
            }
          >
            <Plus className="mr-2 size-4" /> Add week
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            <Save className="mr-2 size-4" /> {save.isPending ? "Saving…" : "Save schedule"}
          </Button>
        </div>
      )}
    </div>
  );
}
