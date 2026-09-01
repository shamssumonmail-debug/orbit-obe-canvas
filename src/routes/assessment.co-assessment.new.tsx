import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/obe/app-shell";
import { RequireAuth } from "@/components/obe/require-auth";
import { ScoreEntryTable } from "@/components/obe/co-assessment/score-entry-table";
import { StructureStep } from "@/components/obe/co-assessment/structure-step";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  batchOptions,
  courseOptions,
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
        content: "Three-step wizard to configure a CO assessment, build its score structure and enter scores.",
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
  const [step, setStep] = useState(0);
  const [batchLabel, setBatchLabel] = useState("");
  const [levelLabel, setLevelLabel] = useState("");
  const [courseLabel, setCourseLabel] = useState("");
  const [sectionLabel, setSectionLabel] = useState("");
  const [sections, setSections] = useState<ScoreSection[]>([]);
  const [students, setStudents] = useState<StudentRow[]>(mockStudents);

  const step1Complete = Boolean(batchLabel && levelLabel && courseLabel && sectionLabel);
  const step2Complete = structureValid(sections);

  const handleScoreChange = (studentId: string, leafId: string, value: number) =>
    setStudents((prev) =>
      prev.map((s) =>
        s.studentId === studentId ? { ...s, scores: { ...s.scores, [leafId]: value } } : s,
      ),
    );

  return (
    <RequireAuth>
      <AppShell title="New CO Assessment" subtitle="Configure structure, then score students live">
        <div className="space-y-6">
          <ol className="flex flex-wrap items-center gap-3">
            {STEPS.map((label, index) => {
              const reachable = index === 0 || (index === 1 && step1Complete) || (index === 2 && step1Complete && step2Complete);
              const done = index < step && reachable;
              return (
                <li key={label} className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={!reachable}
                    onClick={() => reachable && setStep(index)}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition",
                      index === step
                        ? "border-primary bg-primary text-primary-foreground"
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
                  <CardTitle>Score Entry</CardTitle>
                  <CardDescription>
                    {batchLabel} · {levelLabel} · {courseLabel} · {sectionLabel}
                  </CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0}>
                        <Button disabled>Save</Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Backend not yet connected.</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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

          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" asChild={step === 0} onClick={step === 0 ? undefined : () => setStep(step - 1)}>
              {step === 0 ? <Link to="/assessment/co-assessment">Cancel</Link> : <span>Back</span>}
            </Button>
            {step < 2 ? (
              <div className="flex items-center gap-3">
                {step === 0 && !step1Complete ? (
                  <p className="text-xs text-muted-foreground">Complete all four fields to continue.</p>
                ) : null}
                {step === 1 && !step2Complete ? (
                  <p className="text-xs text-destructive">
                    Add at least one section and fix all item/part total errors to continue.
                  </p>
                ) : null}
                <Button
                  disabled={step === 0 ? !step1Complete : !step2Complete}
                  onClick={() => setStep(step + 1)}
                >
                  Next
                </Button>
              </div>
            ) : null}
          </div>
        </div>
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
