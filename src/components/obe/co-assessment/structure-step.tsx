import { AlertCircle, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { CascadingSelectorDialog, type PickedGroup, type SelectorMode } from "./cascading-selector-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  grandMaxScore,
  groupMax,
  makeSection,
  sectionConfiguredScore,
  sectionStructureValid,
  uid,
  type ExamKind,
  type ScoreGroup,
  type ScoreSection,
} from "@/lib/co-assessment";
import { cn } from "@/lib/utils";

type Props = {
  sections: ScoreSection[];
  onChange: (sections: ScoreSection[]) => void;
};

type DialogState = { sectionId: string; mode: SelectorMode; bucket: "quizzes" | "assignments" | "questions" };

export function StructureStep({ sections, onChange }: Props) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const total = grandMaxScore(sections);

  const updateSection = (id: string, patch: Partial<ScoreSection>) =>
    onChange(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const mapGroups = (picked: PickedGroup[]) => {
    if (!dialog) return;
    const section = sections.find((s) => s.id === dialog.sectionId);
    if (!section) return;
    const groups: ScoreGroup[] = picked.map((p) => ({
      id: uid("grp"),
      label: p.label,
      coLabel: p.coLabel,
      sourceRef: p.sourceRef,
      leaves: p.leaves.map((l) => ({ id: uid("leaf"), label: l.label, maxScore: l.maxScore })),
    }));
    updateSection(section.id, {
      [dialog.bucket]: [...(section[dialog.bucket] as ScoreGroup[]), ...groups],
    } as Partial<ScoreSection>);
  };

  const updateGroups = (
    section: ScoreSection,
    bucket: "quizzes" | "assignments" | "questions",
    groups: ScoreGroup[],
  ) => updateSection(section.id, { [bucket]: groups } as Partial<ScoreSection>);

  const renderGroups = (
    section: ScoreSection,
    bucket: "quizzes" | "assignments" | "questions",
    emptyLabel: string,
  ) => {
    const groups = section[bucket] as ScoreGroup[];
    if (groups.length === 0)
      return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
    return (
      <div className="space-y-2">
        {groups.map((group) => (
          <div
            key={group.id}
            className="animate-in fade-in slide-in-from-top-1 rounded-md border bg-card p-3 duration-200"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{group.label}</p>
                {group.coLabel ? (
                  <Badge variant="secondary" className="mt-1 text-[10px]">
                    {group.coLabel.split("—")[0]?.trim()}
                  </Badge>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium tabular-nums">{groupMax(group)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove mapped item"
                  onClick={() =>
                    updateGroups(
                      section,
                      bucket,
                      groups.filter((g) => g.id !== group.id),
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="mt-2 space-y-2 border-l-2 pl-3">
              {group.leaves.map((leaf) => (
                <div key={leaf.id} className="flex items-center gap-2">
                  <span className="flex-1 truncate text-xs text-muted-foreground">{leaf.label}</span>
                  <Input
                    type="number"
                    min={0}
                    className="h-8 w-20 text-center"
                    value={leaf.maxScore}
                    onChange={(e) =>
                      updateGroups(
                        section,
                        bucket,
                        groups.map((g) =>
                          g.id !== group.id
                            ? g
                            : {
                                ...g,
                                leaves: g.leaves.map((l) =>
                                  l.id === leaf.id
                                    ? { ...l, maxScore: Number(e.target.value) || 0 }
                                    : l,
                                ),
                              },
                        ),
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const scoreRow = (section: ScoreSection, index: number) => {
    const configured = sectionConfiguredScore(section);
    const valid = sectionStructureValid(section);
    return (
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-28 space-y-1">
            <Label className="text-xs">Section score</Label>
            <Input
              type="number"
              min={0}
              value={section.maxScore}
              onChange={(e) => updateSection(section.id, { maxScore: Number(e.target.value) || 0 })}
            />
          </div>
          {section.kind === "quiz_assignment" ? (
            <div className="w-36 space-y-1">
              <Label className="text-xs">Count best</Label>
              <Select
                value={String(section.bestOf)}
                onValueChange={(v) => updateSection(section.id, { bestOf: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      Best {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          {section.kind === "exam" ? (
            <div className="w-40 space-y-1">
              <Label className="text-xs">Exam type</Label>
              <Select
                value={section.examKind}
                onValueChange={(v) =>
                  updateSection(section.id, {
                    examKind: v as ExamKind,
                    name: v === "midterm" ? "Mid-Term" : "Final",
                    maxScore: v === "midterm" ? 20 : section.maxScore,
                    questions: [],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="midterm">Mid-Term</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          {section.kind !== "attendance" ? (
            <p
              className={cn(
                "text-sm font-medium tabular-nums",
                valid ? "text-emerald-600" : "text-destructive",
              )}
            >
              Mapped: {configured} / {section.maxScore}
            </p>
          ) : null}
          {index > 2 ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Remove section"
              onClick={() => onChange(sections.filter((s) => s.id !== section.id))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card
        className={cn(
          "border-2 transition-colors duration-300",
          total === 100 ? "border-emerald-500/60" : "border-amber-500/60",
        )}
      >
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-base">Score structure</CardTitle>
            <p className="text-sm text-muted-foreground">
              Section 1 maps quizzes and assignments, Section 2 is attendance, Section 3 is your
              Mid-Term or Final exam. Sections must add up to exactly 100.
            </p>
          </div>
          <div className="text-right">
            <p
              className={cn(
                "flex items-center gap-2 text-2xl font-semibold tabular-nums",
                total === 100 ? "text-emerald-600" : "text-amber-600",
              )}
            >
              {total === 100 ? <CheckCircle2 className="h-5 w-5" /> : null}
              {total} / 100
            </p>
            {total !== 100 ? (
              <p className="text-xs text-amber-600">Sections do not add up to 100 yet.</p>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      {sections.map((section, index) => (
        <Card key={section.id} className="animate-in fade-in duration-300">
          <CardHeader className="space-y-3 pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">
                Section {index + 1} — {section.name}
              </CardTitle>
              {section.kind === "attendance" ? (
                <Badge variant="secondary">Independent column</Badge>
              ) : null}
            </div>
            {scoreRow(section, index)}
            {section.kind !== "attendance" && !sectionStructureValid(section) ? (
              <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {section.kind === "quiz_assignment"
                  ? `The best ${section.bestOf} mapped attempts must total exactly ${section.maxScore}.`
                  : `Mapped question scores must total exactly ${section.maxScore}.`}
              </div>
            ) : null}
          </CardHeader>

          {section.kind === "attendance" ? (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Attendance is entered directly as one column out of {section.maxScore}.
              </p>
            </CardContent>
          ) : section.kind === "quiz_assignment" ? (
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Quiz</p>
                  <Button
                    size="sm"
                    onClick={() =>
                      setDialog({ sectionId: section.id, mode: "quiz", bucket: "quizzes" })
                    }
                  >
                    <Plus className="mr-1 h-4 w-4" /> Add item from Quiz
                  </Button>
                </div>
                {renderGroups(section, "quizzes", "No quiz mapped yet.")}
              </div>
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Assignment</p>
                  <Button
                    size="sm"
                    onClick={() =>
                      setDialog({
                        sectionId: section.id,
                        mode: "assignment",
                        bucket: "assignments",
                      })
                    }
                  >
                    <Plus className="mr-1 h-4 w-4" /> Add item from Assignment
                  </Button>
                </div>
                {renderGroups(section, "assignments", "No assignment mapped yet.")}
              </div>
            </CardContent>
          ) : (
            <CardContent className="space-y-3">
              <Button
                size="sm"
                onClick={() =>
                  setDialog({
                    sectionId: section.id,
                    mode: section.examKind,
                    bucket: "questions",
                  })
                }
              >
                <Plus className="mr-1 h-4 w-4" /> Add Question {section.questions.length + 1}
              </Button>
              {renderGroups(section, "questions", "No question mapped yet.")}
            </CardContent>
          )}
        </Card>
      ))}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => onChange([...sections, makeSection("exam", "midterm")])}
        >
          <Plus className="mr-1 h-4 w-4" /> Add Mid-Term section
        </Button>
        <Button
          variant="outline"
          onClick={() => onChange([...sections, makeSection("exam", "final")])}
        >
          <Plus className="mr-1 h-4 w-4" /> Add Final section
        </Button>
      </div>

      {dialog ? (
        <CascadingSelectorDialog
          open
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
          mode={dialog.mode}
          onMap={mapGroups}
        />
      ) : null}
    </div>
  );
}
