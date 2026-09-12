import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BarChart3, Check, Eye, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/obe/app-shell";
import { RequireAuth } from "@/components/obe/require-auth";
import { CoAttainmentReport } from "@/components/obe/co-assessment/co-attainment-chart";
import { ScoreEntryTable } from "@/components/obe/co-assessment/score-entry-table";
import { ScoreImport } from "@/components/obe/co-assessment/score-import";
import { ScorePreviewDialog } from "@/components/obe/co-assessment/score-preview-dialog";
import { StructureStep } from "@/components/obe/co-assessment/structure-step";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  batchOptions,
  courseOptions,
  defaultSections,
  grandMaxScore,
  levelOptions,
  mockStudents,
  structureValid,
  type ScoreSection,
  type StudentRow,
} from "@/lib/co-assessment";
import {
  getAssessment,
  newAssessmentId,
  saveAssessment,
  type AssessmentRecord,
} from "@/lib/co-assessment-store";
import { useSemesterTypeOptions } from "@/lib/semester-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/assessment/co-assessment/new")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === "string" ? search.id : undefined,
    step: typeof search.step === "number" ? search.step : undefined,
  }),
  head: () => ({
    meta: [
      { title: "New CO Assessment · OBE Suite" },
      {
        name: "description",
        content:
          "Three-step wizard to configure a CO assessment, map quiz, assignment and exam questions, and enter scores.",
      },
      { property: "og:title", content: "New CO Assessment · OBE Suite" },
      {
        property: "og:description",
        content: "Configure, structure and score a CO assessment in one guided flow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewCoAssessmentRoute,
});

const STEPS = ["Configuration", "Score Structure Setup", "Score Entry"] as const;

function NewCoAssessmentRoute() {
  const navigate = useNavigate();
  const { id: editId, step: initialStep } = Route.useSearch();
  const semesterOptions = useSemesterTypeOptions();
  const existing = getAssessment(editId);

  const [id] = useState(() => existing?.id ?? newAssessmentId());
  const [step, setStep] = useState(initialStep ?? 0);
  const [batchLabel, setBatchLabel] = useState(existing?.batchLabel ?? "");
  const [levelLabel, setLevelLabel] = useState(existing?.levelLabel ?? "");
  const [courseLabel, setCourseLabel] = useState(existing?.courseLabel ?? "");
  const [semesterLabel, setSemesterLabel] = useState(existing?.semesterLabel ?? "");
  const [sections, setSections] = useState<ScoreSection[]>(existing?.sections ?? defaultSections);
  const [students, setStudents] = useState<StudentRow[]>(existing?.students ?? mockStudents);
  const [dirty, setDirty] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [completed, setCompleted] = useState(existing?.status === "Complete");
  const [draftAsk, setDraftAsk] = useState(false);

  const step1Complete = Boolean(batchLabel && levelLabel && courseLabel && semesterLabel);
  const step2Complete = structureValid(sections);
  const total = grandMaxScore(sections);

  const record = (status: AssessmentRecord["status"]): AssessmentRecord => ({
    id,
    batchLabel,
    levelLabel,
    courseLabel,
    semesterLabel,
    sections,
    students,
    status,
    updatedAt: new Date().toISOString(),
  });

  const handleScoreChange = (studentId: string, leafId: string, value: number) => {
    setDirty(true);
    setStudents((prev) =>
      prev.map((s) =>
        s.studentId === studentId ? { ...s, scores: { ...s.scores, [leafId]: value } } : s,
      ),
    );
  };

  const leaveWizard = () => navigate({ to: "/assessment/co-assessment" });

  return (
    <RequireAuth>
      <AppShell
        title={existing ? "CO Assessment" : "New CO Assessment"}
        subtitle="Configure structure, then score students live"
      >
        <div className="space-y-6">
          <ol className="flex flex-wrap items-center gap-3">
            {STEPS.map((label, index) => {
              const reachable =
                index === 0 ||
                (index === 1 && step1Complete) ||
                (index === 2 && step1Complete && step2Complete);
              const done = index < step && reachable;
              return (
                <li key={label} className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={!reachable}
                    onClick={() => reachable && setStep(index)}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all duration-200",
                      index === step
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : reachable
                          ? "border-border hover:bg-muted"
                          : "cursor-not-allowed border-dashed text-muted-foreground",
                    )}
                  >
                    <span className="grid h-5 w-5 place-items-center rounded-full border text-xs">
                      {done ? <Check className="h-3 w-3" /> : index + 1}
                    </span>
                    {label}
                  </button>
                  {index < STEPS.length - 1 ? <span className="h-px w-6 bg-border" /> : null}
                </li>
              );
            })}
          </ol>

          <div key={step} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {step === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Configuration</CardTitle>
                  <CardDescription>Pin down the exact student group for this assessment.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <Field label="Batch" value={batchLabel} onChange={setBatchLabel} options={batchOptions} />
                  <Field label="Level / Term" value={levelLabel} onChange={setLevelLabel} options={levelOptions} />
                  <Field label="Course" value={courseLabel} onChange={setCourseLabel} options={courseOptions} />
                  <Field
                    label="Semester Type"
                    value={semesterLabel}
                    onChange={setSemesterLabel}
                    options={semesterOptions}
                  />
                </CardContent>
              </Card>
            ) : null}

            {step === 1 ? <StructureStep sections={sections} onChange={setSections} /> : null}

            {step === 2 ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Score Entry
                        {completed ? <Badge>Completed</Badge> : null}
                      </CardTitle>
                      <CardDescription>
                        {batchLabel} · {levelLabel} · {courseLabel} · {semesterLabel}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <ScoreImport
                        sections={sections}
                        students={students}
                        fileBase={`co-assessment-${(courseLabel.split(" ")[0] || "scores").toLowerCase()}`}
                        onImport={(next) => {
                          setStudents(next);
                          setDirty(true);
                        }}
                      />
                      <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
                        <Eye className="mr-1 h-4 w-4" /> Preview
                      </Button>
                      <Button
                        size="sm"
                        disabled={!dirty}
                        onClick={() => {
                          setDirty(false);
                          saveAssessment(record(completed ? "Complete" : "Scoring In Progress"));
                          toast.success("Scores saved");
                        }}
                      >
                        <Save className="mr-1 h-4 w-4" /> Save
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScoreEntryTable
                      sections={sections}
                      students={students}
                      onScoreChange={handleScoreChange}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" /> CO Attainment Report
                    </CardTitle>
                    <CardDescription>
                      Live attainment per course outcome for {courseLabel || "this course"} — updates
                      as you enter marks.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CoAttainmentReport sections={sections} students={students} />
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => (step === 0 ? setDraftAsk(true) : setStep(step - 1))}
            >
              {step === 0 ? "Cancel" : "Back"}
            </Button>
            {step === 1 ? (
              <div className="flex items-center gap-3">
                {!step2Complete ? (
                  <p className="text-xs text-destructive">
                    {total !== 100
                      ? `Sections total ${total}/100 — map exactly 100 marks to continue.`
                      : "Fix the section mapping totals to continue."}
                  </p>
                ) : null}
                <Button variant="ghost" onClick={() => setDraftAsk(true)}>
                  Cancel
                </Button>
                <Button
                  disabled={!step2Complete}
                  onClick={() => {
                    saveAssessment(record("Structure Configured"));
                    toast.success("Structure saved");
                    setStep(2);
                  }}
                >
                  Save &amp; Create
                </Button>
              </div>
            ) : step === 0 ? (
              <div className="flex items-center gap-3">
                {!step1Complete ? (
                  <p className="text-xs text-muted-foreground">
                    Complete all four fields to continue.
                  </p>
                ) : null}
                <Button disabled={!step1Complete} onClick={() => setStep(1)}>
                  Next
                </Button>
              </div>
            ) : (
              <Button variant="secondary" onClick={leaveWizard}>
                Back to list
              </Button>
            )}
          </div>
        </div>

        <ScorePreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          sections={sections}
          students={students}
          meta={{ batchLabel, levelLabel, courseLabel, sectionLabel: semesterLabel }}
          completed={completed}
          onMarkCompleted={() => {
            setCompleted(true);
            setDirty(false);
            saveAssessment(record("Complete"));
            toast.success("Assessment marked as completed");
          }}
        />

        <AlertDialog open={draftAsk} onOpenChange={setDraftAsk}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Keep this as a draft?</AlertDialogTitle>
              <AlertDialogDescription>
                Save it as a draft so it shows in your CO Assessment list, or discard it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={leaveWizard}>Discard</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  saveAssessment(record("Draft"));
                  toast.success("Saved as draft");
                  leaveWizard();
                }}
              >
                Yes, save as draft
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AppShell>
    </RequireAuth>
  );
}

function Field({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
