import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  nextCoNumber,
  useReferenceData,
  type AssessmentTool,
  type CourseOutcome,
} from "@/lib/course-setup";

type DraftTool = {
  key: string;
  tool_name: string;
  max_marks: number;
  rubric_notes: string;
};

export function useCourseOutcomes(offeringId: string) {
  return useQuery({
    queryKey: ["course-setup", "outcomes", offeringId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_outcomes")
        .select("id, course_offering_id, co_number, co_statement, bloom_taxonomy_level_id, display_order")
        .eq("course_offering_id", offeringId)
        .order("display_order");
      if (error) throw error;
      return (data ?? []) as CourseOutcome[];
    },
  });
}

export function useCoDetails(outcomeIds: string[]) {
  const key = outcomeIds.slice().sort().join(",");
  return useQuery({
    queryKey: ["course-setup", "co-details", key],
    enabled: outcomeIds.length > 0,
    queryFn: async () => {
      const [po, kp, pa, tools] = await Promise.all([
        supabase.from("co_po_mapping").select("course_outcome_id, program_outcome_id").in("course_outcome_id", outcomeIds),
        supabase
          .from("co_knowledge_profile_mapping")
          .select("course_outcome_id, knowledge_profile_id")
          .in("course_outcome_id", outcomeIds),
        supabase
          .from("co_problem_attribute_mapping")
          .select("course_outcome_id, complex_problem_attribute_id")
          .in("course_outcome_id", outcomeIds),
        supabase
          .from("co_assessment_tools")
          .select("id, course_outcome_id, tool_name, max_marks, rubric_notes, display_order")
          .in("course_outcome_id", outcomeIds)
          .order("display_order"),
      ]);
      const err = po.error || kp.error || pa.error || tools.error;
      if (err) throw err;
      return {
        po: (po.data ?? []) as { course_outcome_id: string; program_outcome_id: string }[],
        kp: (kp.data ?? []) as { course_outcome_id: string; knowledge_profile_id: string }[],
        pa: (pa.data ?? []) as { course_outcome_id: string; complex_problem_attribute_id: string }[],
        tools: (tools.data ?? []) as AssessmentTool[],
      };
    },
  });
}

export function CourseOutcomesTab({
  offeringId,
  readOnly,
}: {
  offeringId: string;
  readOnly: boolean;
}) {
  const queryClient = useQueryClient();
  const { bloom, programOutcomes, knowledgeProfiles, problemAttributes } = useReferenceData();
  const outcomes = useCourseOutcomes(offeringId);
  const ids = useMemo(() => (outcomes.data ?? []).map((c) => c.id), [outcomes.data]);
  const details = useCoDetails(ids);
  const [expanded, setExpanded] = useState<string | null>(null);

  const addCo = useMutation({
    mutationFn: async () => {
      const list = outcomes.data ?? [];
      const firstBloom = bloom.find((b) => b.is_active !== false) ?? bloom[0];
      if (!firstBloom) throw new Error("Add at least one Bloom's taxonomy level in Master Data first");
      const { data, error } = await supabase
        .from("course_outcomes")
        .insert({
          course_offering_id: offeringId,
          co_number: nextCoNumber(list),
          co_statement: "New course outcome — replace this statement.",
          bloom_taxonomy_level_id: firstBloom.id,
          display_order: list.length,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      toast.success("Course outcome added");
      setExpanded(id);
      void queryClient.invalidateQueries({ queryKey: ["course-setup", "outcomes", offeringId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeCo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("course_outcomes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Course outcome removed");
      void queryClient.invalidateQueries({ queryKey: ["course-setup", "outcomes", offeringId] });
      void queryClient.invalidateQueries({ queryKey: ["course-setup", "co-details"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (outcomes.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (outcomes.error) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
        Could not load course outcomes: {(outcomes.error as Error).message}
      </div>
    );
  }

  const list = outcomes.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {list.length} course outcome{list.length === 1 ? "" : "s"} · expand a row to edit its mapping and
          assessment tools.
        </p>
        {!readOnly && (
          <Button onClick={() => addCo.mutate()} disabled={addCo.isPending}>
            <Plus className="mr-2 size-4" /> Add CO
          </Button>
        )}
      </div>

      {list.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm font-medium">No course outcomes yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first CO — numbering (CO1, CO2…) is assigned automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((co) => {
            const isOpen = expanded === co.id;
            const coPo = (details.data?.po ?? []).filter((m) => m.course_outcome_id === co.id);
            const coKp = (details.data?.kp ?? []).filter((m) => m.course_outcome_id === co.id);
            const coPa = (details.data?.pa ?? []).filter((m) => m.course_outcome_id === co.id);
            const coTools = (details.data?.tools ?? []).filter((t) => t.course_outcome_id === co.id);
            const bloomLevel = bloom.find((b) => b.id === co.bloom_taxonomy_level_id);

            return (
              <Card key={co.id}>
                <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mt-0.5 shrink-0"
                    aria-label={isOpen ? `Collapse ${co.co_number}` : `Expand ${co.co_number}`}
                    onClick={() => setExpanded(isOpen ? null : co.id)}
                  >
                    <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
                  </Button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{co.co_number}</Badge>
                      {bloomLevel && (
                        <span className="text-xs text-muted-foreground">
                          {bloomLevel.domain} · {bloomLevel.level}
                        </span>
                      )}
                    </div>
                    <p className={cn("mt-1 text-sm", !isOpen && "line-clamp-2")}>{co.co_statement}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {coPo.map((m) => {
                        const po = programOutcomes.find((p) => p.id === m.program_outcome_id);
                        return po ? (
                          <Badge key={m.program_outcome_id} variant="outline" className="text-[10px]">
                            {po.code}
                          </Badge>
                        ) : null;
                      })}
                      {coKp.map((m) => {
                        const kp = knowledgeProfiles.find((p) => p.id === m.knowledge_profile_id);
                        return kp ? (
                          <Badge key={m.knowledge_profile_id} variant="secondary" className="text-[10px]">
                            {kp.code}
                          </Badge>
                        ) : null;
                      })}
                      {coPa.map((m) => {
                        const pa = problemAttributes.find((p) => p.id === m.complex_problem_attribute_id);
                        return pa ? (
                          <Badge key={m.complex_problem_attribute_id} className="text-[10px]">
                            {pa.code}
                          </Badge>
                        ) : null;
                      })}
                      {coTools.length > 0 && (
                        <span className="text-[11px] text-muted-foreground">
                          {coTools.length} tool{coTools.length === 1 ? "" : "s"} ·{" "}
                          {coTools.reduce((s, t) => s + Number(t.max_marks), 0)} marks
                        </span>
                      )}
                    </div>
                  </div>
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive"
                      aria-label={`Delete ${co.co_number}`}
                      onClick={() => removeCo.mutate(co.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </CardHeader>
                {isOpen && (
                  <CardContent>
                    <CoEditor
                      co={co}
                      offeringId={offeringId}
                      readOnly={readOnly}
                      initialPo={coPo.map((m) => m.program_outcome_id)}
                      initialKp={coKp.map((m) => m.knowledge_profile_id)}
                      initialPa={coPa.map((m) => m.complex_problem_attribute_id)}
                      initialTools={coTools}
                    />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CheckboxGroup({
  title,
  options,
  selected,
  onToggle,
  disabled,
}: {
  title: string;
  options: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>{title}</Label>
      <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border border-border p-3">
        {options.length === 0 && <p className="text-xs text-muted-foreground">Nothing configured yet.</p>}
        {options.map((o) => (
          <label key={o.id} className="flex cursor-pointer items-start gap-2 text-sm">
            <Checkbox
              checked={selected.includes(o.id)}
              disabled={disabled}
              onCheckedChange={() => onToggle(o.id)}
            />
            <span className="leading-snug">{o.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function CoEditor({
  co,
  offeringId,
  readOnly,
  initialPo,
  initialKp,
  initialPa,
  initialTools,
}: {
  co: CourseOutcome;
  offeringId: string;
  readOnly: boolean;
  initialPo: string[];
  initialKp: string[];
  initialPa: string[];
  initialTools: AssessmentTool[];
}) {
  const queryClient = useQueryClient();
  const { bloom, programOutcomes, knowledgeProfiles, problemAttributes } = useReferenceData();

  const [statement, setStatement] = useState(co.co_statement);
  const [bloomId, setBloomId] = useState(co.bloom_taxonomy_level_id);
  const [poIds, setPoIds] = useState<string[]>(initialPo);
  const [kpIds, setKpIds] = useState<string[]>(initialKp);
  const [paIds, setPaIds] = useState<string[]>(initialPa);
  const [tools, setTools] = useState<DraftTool[]>(() =>
    initialTools.map((t) => ({
      key: t.id,
      tool_name: t.tool_name,
      max_marks: Number(t.max_marks),
      rubric_notes: t.rubric_notes ?? "",
    })),
  );

  const initialKey = `${initialPo.join()}|${initialKp.join()}|${initialPa.join()}|${initialTools.map((t) => t.id).join()}`;
  useEffect(() => {
    setPoIds(initialPo);
    setKpIds(initialKp);
    setPaIds(initialPa);
    setTools(
      initialTools.map((t) => ({
        key: t.id,
        tool_name: t.tool_name,
        max_marks: Number(t.max_marks),
        rubric_notes: t.rubric_notes ?? "",
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey]);

  const toggle = (setter: (fn: (prev: string[]) => string[]) => void) => (id: string) =>
    setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const totalMarks = tools.reduce((s, t) => s + Number(t.max_marks || 0), 0);

  const save = useMutation({
    mutationFn: async () => {
      if (!statement.trim()) throw new Error("CO statement is required");
      if (!bloomId) throw new Error("Select a Bloom's taxonomy level");
      for (const t of tools) {
        if (!t.tool_name.trim()) throw new Error("Every assessment tool needs a name");
        if (!Number.isFinite(t.max_marks) || t.max_marks <= 0)
          throw new Error("Assessment tool max marks must be greater than 0");
      }

      const { error: coError } = await supabase
        .from("course_outcomes")
        .update({ co_statement: statement.trim(), bloom_taxonomy_level_id: bloomId })
        .eq("id", co.id);
      if (coError) throw coError;

      // Mapping rows are small — replace them wholesale.
      const del = await Promise.all([
        supabase.from("co_po_mapping").delete().eq("course_outcome_id", co.id),
        supabase.from("co_knowledge_profile_mapping").delete().eq("course_outcome_id", co.id),
        supabase.from("co_problem_attribute_mapping").delete().eq("course_outcome_id", co.id),
        supabase.from("co_assessment_tools").delete().eq("course_outcome_id", co.id),
      ]);
      const delErr = del.find((r) => r.error)?.error;
      if (delErr) throw delErr;

      if (poIds.length) {
        const { error } = await supabase
          .from("co_po_mapping")
          .insert(poIds.map((id) => ({ course_outcome_id: co.id, program_outcome_id: id })));
        if (error) throw error;
      }
      if (kpIds.length) {
        const { error } = await supabase
          .from("co_knowledge_profile_mapping")
          .insert(kpIds.map((id) => ({ course_outcome_id: co.id, knowledge_profile_id: id })));
        if (error) throw error;
      }
      if (paIds.length) {
        const { error } = await supabase
          .from("co_problem_attribute_mapping")
          .insert(paIds.map((id) => ({ course_outcome_id: co.id, complex_problem_attribute_id: id })));
        if (error) throw error;
      }
      if (tools.length) {
        const { error } = await supabase.from("co_assessment_tools").insert(
          tools.map((t, i) => ({
            course_outcome_id: co.id,
            tool_name: t.tool_name.trim(),
            max_marks: t.max_marks,
            rubric_notes: t.rubric_notes.trim() || null,
            display_order: i,
          })),
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(`${co.co_number} saved`);
      void queryClient.invalidateQueries({ queryKey: ["course-setup", "outcomes", offeringId] });
      void queryClient.invalidateQueries({ queryKey: ["course-setup", "co-details"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5 border-t border-border pt-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor={`stmt-${co.id}`}>CO statement *</Label>
          <Textarea
            id={`stmt-${co.id}`}
            rows={3}
            value={statement}
            disabled={readOnly}
            onChange={(e) => setStatement(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Bloom's taxonomy level *</Label>
          <Select value={bloomId} onValueChange={setBloomId} disabled={readOnly}>
            <SelectTrigger>
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              {bloom.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.domain} — {b.level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <CheckboxGroup
          title="Program Outcomes (PO / PSO)"
          disabled={readOnly}
          options={programOutcomes.map((p) => ({ id: p.id, label: `${p.code} — ${p.title}` }))}
          selected={poIds}
          onToggle={toggle(setPoIds)}
        />
        <CheckboxGroup
          title="Knowledge Profiles"
          disabled={readOnly}
          options={knowledgeProfiles.map((p) => ({ id: p.id, label: `${p.code} — ${p.title}` }))}
          selected={kpIds}
          onToggle={toggle(setKpIds)}
        />
        <CheckboxGroup
          title="Problem / Activity Attributes"
          disabled={readOnly}
          options={problemAttributes.map((p) => ({
            id: p.id,
            label: `${p.code} (${p.category})${p.title ? ` — ${p.title}` : ""}`,
          }))}
          selected={paIds}
          onToggle={toggle(setPaIds)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>Assessment tools</Label>
          <span className="text-sm font-medium text-muted-foreground">Total max marks: {totalMarks}</span>
        </div>
        <div className="overflow-x-auto rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead className="w-28">Max marks</TableHead>
                <TableHead>Rubric notes</TableHead>
                {!readOnly && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tools.length === 0 && (
                <TableRow>
                  <TableCell colSpan={readOnly ? 3 : 4} className="text-sm text-muted-foreground">
                    No assessment tools yet.
                  </TableCell>
                </TableRow>
              )}
              {tools.map((t, i) => (
                <TableRow key={t.key}>
                  <TableCell>
                    <Input
                      value={t.tool_name}
                      placeholder="e.g. Quiz/Assignment, Final Q1-Q3"
                      disabled={readOnly}
                      onChange={(e) =>
                        setTools((prev) =>
                          prev.map((x, xi) => (xi === i ? { ...x, tool_name: e.target.value } : x)),
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step="0.5"
                      value={t.max_marks}
                      disabled={readOnly}
                      onChange={(e) =>
                        setTools((prev) =>
                          prev.map((x, xi) => (xi === i ? { ...x, max_marks: Number(e.target.value) } : x)),
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={t.rubric_notes}
                      disabled={readOnly}
                      onChange={(e) =>
                        setTools((prev) =>
                          prev.map((x, xi) => (xi === i ? { ...x, rubric_notes: e.target.value } : x)),
                        )
                      }
                    />
                  </TableCell>
                  {!readOnly && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove tool"
                        onClick={() => setTools((prev) => prev.filter((_, xi) => xi !== i))}
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
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setTools((prev) => [
                ...prev,
                { key: `new-${Date.now()}-${prev.length}`, tool_name: "", max_marks: 10, rubric_notes: "" },
              ])
            }
          >
            <Plus className="mr-2 size-4" /> Add tool
          </Button>
        )}
      </div>

      {!readOnly && (
        <div className="flex justify-end">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            <Save className="mr-2 size-4" /> {save.isPending ? "Saving…" : `Save ${co.co_number}`}
          </Button>
        </div>
      )}
    </div>
  );
}
