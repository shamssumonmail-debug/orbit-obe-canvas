import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Eye, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/obe/app-shell";
import { RequireAuth } from "@/components/obe/require-auth";
import { ScoreEntryTable } from "@/components/obe/co-assessment/score-entry-table";
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
  sectionOptions,
  structureValid,
  type ScoreSection,
  type StudentRow,
} from "@/lib/co-assessment";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/assessment/co-assessment/new")({
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
  const [step, setStep] = useState(0);
  const [batchLabel, setBatchLabel] = useState("");
  const [levelLabel, setLevelLabel] = useState("");
  const [courseLabel, setCourseLabel] = useState("");
  const [sectionLabel, setSectionLabel] = useState("");
  const [sections, setSections] = useState<ScoreSection[]>(defaultSections);
  const [students, setStudents] = useState<StudentRow[]>(mockStudents);
  const [dirty, setDirty] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [draftAsk, setDraftAsk] = useState(false);

  const step1Complete = Boolean(batchLabel && levelLabel && courseLabel && sectionLabel);
  const step2Complete = structureValid(sections);
  const total = grandMaxScore(sections);

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
      <AppShell title="New CO Assessment" subtitle="Configure structure, then score students live">
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
                  <Field label="Section" value={sectionLabel} onChange={setSectionLabel} options={sectionOptions} />
                </CardContent>
              </Card>
            ) : null}

            {step === 1 ? <StructureStep sections={sections} onChange={setSections} /> : null}

            {step === 2 ? (
              <Card>
                <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Score Entry
                      {completed ? <Badge>Completed</Badge> : null}
                    </CardTitle>
                    <CardDescription>
                      {batchLabel} · {levelLabel} · {courseLabel} · {sectionLabel}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => setPreviewOpen(true)}>
                      <Eye className="mr-1 h-4 w-4" /> Preview
                    </Button>
                    <Button
                      disabled={!dirty}
                      onClick={() => {
                        setDirty(false);
                        toast.success("Scores saved for this session");
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
                <Button disabled={!step2Complete} onClick={() => setStep(2)}>
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
            ) : null}
          </div>
        </div>

        <ScorePreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          sections={sections}
          students={students}
          meta={{ batchLabel, levelLabel, courseLabel, sectionLabel }}
          completed={completed}
          onMarkCompleted={() => {
            setCompleted(true);
            toast.success("Assessment marked as completed");
          }}
        />

        <AlertDialog open={draftAsk} onOpenChange={setDraftAsk}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Keep this as a draft?</AlertDialogTitle>
              <AlertDialogDescription>
                The structure is not complete yet. Save it as a draft so it shows in your CO
                Assessment list, or discard it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={leaveWizard}>Discard</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
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
  options: string[];
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
