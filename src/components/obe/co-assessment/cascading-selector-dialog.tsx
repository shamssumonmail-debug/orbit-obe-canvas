import { Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockCOs, type MockCO, type MockGroup, type MockQuestion } from "@/lib/co-assessment";

export type PickedGroup = {
  label: string;
  coLabel: string;
  sourceRef: string;
  leaves: { label: string; maxScore: number }[];
};

export type SelectorMode = "quiz" | "assignment" | "midterm" | "final";

const MODE_META: Record<SelectorMode, { title: string; level2: string; key: keyof MockCO }> = {
  quiz: { title: "Quiz", level2: "Quiz", key: "quizzes" },
  assignment: { title: "Assignment", level2: "Assignment", key: "assignments" },
  midterm: { title: "Mid-Term", level2: "Mid-Term Exam", key: "midterms" },
  final: { title: "Final Exam", level2: "Final Exam", key: "finals" },
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: SelectorMode;
  data?: MockCO[];
  onMap: (groups: PickedGroup[]) => void;
};

export function CascadingSelectorDialog({
  open,
  onOpenChange,
  mode,
  data = mockCOs,
  onMap,
}: Props) {
  const meta = MODE_META[mode];
  const [coId, setCoId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [staged, setStaged] = useState<PickedGroup[]>([]);

  const co = data.find((c) => c.id === coId);
  const groups = useMemo<MockGroup[]>(() => (co ? (co[meta.key] as MockGroup[]) : []), [co, meta.key]);
  const group = groups.find((g) => g.id === groupId);
  const questions: MockQuestion[] = group?.questions ?? [];
  const isExam = mode === "final" || mode === "midterm";

  const resetPick = () => {
    setCoId("");
    setGroupId("");
    setChecked({});
  };

  const closeAll = () => {
    resetPick();
    setStaged([]);
    onOpenChange(false);
  };

  const keyFor = (q: MockQuestion, partLabel?: string) =>
    partLabel ? `${q.id}::${partLabel}` : q.id;

  const anySelected = Object.values(checked).some(Boolean);

  const buildPicks = (): PickedGroup[] => {
    if (!co || !group) return [];
    if (isExam) {
      return questions
        .map((q) => {
          const leaves = q.parts
            ? q.parts
                .filter((p) => checked[keyFor(q, p.label)])
                .map((p) => ({ label: `Question - ${p.label}`, maxScore: p.maxScore }))
            : checked[keyFor(q)]
              ? [{ label: q.label, maxScore: q.maxScore }]
              : [];
          return leaves.length
            ? { label: q.label, coLabel: co.label, sourceRef: q.id, leaves }
            : null;
        })
        .filter((x): x is PickedGroup => x !== null);
    }
    const leaves = questions
      .filter((q) => checked[keyFor(q)])
      .map((q) => ({ label: q.label, maxScore: q.maxScore }));
    if (!leaves.length) return [];
    return [{ label: group.label, coLabel: co.label, sourceRef: group.id, leaves }];
  };

  const addToSelection = () => {
    const picks = buildPicks();
    if (picks.length) setStaged((prev) => [...prev, ...picks]);
    resetPick();
  };

  const confirm = () => {
    const all = [...staged, ...buildPicks()];
    if (all.length) onMap(all);
    resetPick();
    setStaged([]);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closeAll();
        else onOpenChange(true);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add item from {meta.title}</DialogTitle>
          <DialogDescription>
            Pick a course outcome, then the {meta.level2.toLowerCase()}, then tick the questions
            {isExam ? " or question parts" : ""} you want to map. You can add several before mapping.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Course Outcome (CO)</Label>
            <Select
              value={coId}
              onValueChange={(v) => {
                setCoId(v);
                setGroupId("");
                setChecked({});
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a CO" />
              </SelectTrigger>
              <SelectContent>
                {data.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{meta.level2}</Label>
            <Select
              value={groupId}
              onValueChange={(v) => {
                setGroupId(v);
                setChecked({});
              }}
              disabled={!coId}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select a ${meta.level2.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="max-h-[36vh] space-y-2 overflow-y-auto rounded-lg border p-3">
          {!coId ? (
            <p className="text-sm text-muted-foreground">Select a course outcome to continue.</p>
          ) : !groupId ? (
            <p className="text-sm text-muted-foreground">
              {groups.length === 0
                ? `No ${meta.level2.toLowerCase()} configured for this CO.`
                : `Select a ${meta.level2.toLowerCase()} to list its questions.`}
            </p>
          ) : questions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No questions found.</p>
          ) : (
            questions.map((q) => (
              <div key={q.id} className="rounded-md border p-3">
                {q.parts && isExam ? (
                  <>
                    <p className="text-sm font-medium">
                      {q.label}{" "}
                      <span className="text-xs text-muted-foreground">(max {q.maxScore})</span>
                    </p>
                    <div className="mt-2 flex flex-wrap gap-4 border-t pt-2">
                      {q.parts.map((p) => (
                        <label
                          key={p.label}
                          className="flex cursor-pointer items-center gap-2 text-sm"
                        >
                          <Checkbox
                            checked={Boolean(checked[keyFor(q, p.label)])}
                            onCheckedChange={(v) =>
                              setChecked((prev) => ({ ...prev, [keyFor(q, p.label)]: Boolean(v) }))
                            }
                          />
                          Question - {p.label}
                          <span className="text-xs text-muted-foreground">({p.maxScore})</span>
                        </label>
                      ))}
                    </div>
                  </>
                ) : (
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={Boolean(checked[keyFor(q)])}
                      onCheckedChange={(v) =>
                        setChecked((prev) => ({ ...prev, [keyFor(q)]: Boolean(v) }))
                      }
                    />
                    <span className="font-medium">{q.label}</span>
                    <span className="text-xs text-muted-foreground">(max {q.maxScore})</span>
                  </label>
                )}
              </div>
            ))
          )}
        </div>

        {staged.length > 0 ? (
          <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
            <p className="text-xs font-medium text-muted-foreground">Ready to map</p>
            {staged.map((s, index) => (
              <div key={`${s.sourceRef}-${index}`} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{s.label}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {s.leaves.map((l) => (
                      <Badge key={l.label} variant="secondary" className="text-[10px]">
                        {l.label} · {l.maxScore}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove"
                  onClick={() => setStaged((prev) => prev.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={addToSelection} disabled={!anySelected}>
            Add another question
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={closeAll}>
              <X className="mr-1 h-4 w-4" /> Cancel
            </Button>
            <Button onClick={confirm} disabled={!anySelected && staged.length === 0}>
              Map
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
