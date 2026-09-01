import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

export type CascadingSelection = {
  coId: string;
  refId: string;
  label: string;
  maxScore: number;
  parts: { label: string; maxScore: number }[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Title of the second cascade level, e.g. "Quiz" or "Final Exam". */
  levelLabel: string;
  /** 2 = the level-2 entry itself is selectable; 3 = only questions are selectable. */
  selectableLevel: 2 | 3;
  /** Which mock collection feeds level 2. */
  groupKind: "quizzes" | "finals";
  data?: MockCO[];
  onSelect: (selection: CascadingSelection) => void;
};

function splitEvenly(total: number, count: number) {
  if (count === 0) return [];
  const base = Math.floor((total / count) * 10) / 10;
  const parts = Array.from({ length: count }, () => base);
  const remainder = Math.round((total - base * count) * 10) / 10;
  if (remainder !== 0) parts[0] = Math.round((base + remainder) * 10) / 10;
  return parts;
}

export function CascadingSelectorDialog({
  open,
  onOpenChange,
  levelLabel,
  selectableLevel,
  groupKind,
  data = mockCOs,
  onSelect,
}: Props) {
  const [coId, setCoId] = useState<string>("");
  const [groupId, setGroupId] = useState<string>("");

  const co = data.find((c) => c.id === coId);
  const groups: MockGroup[] = useMemo(() => (co ? co[groupKind] : []), [co, groupKind]);
  const group = groups.find((g) => g.id === groupId);
  const questions: MockQuestion[] = group?.questions ?? [];

  const reset = () => {
    setCoId("");
    setGroupId("");
  };

  const emit = (selection: CascadingSelection) => {
    onSelect(selection);
    reset();
    onOpenChange(false);
  };

  const selectGroup = (g: MockGroup) => {
    emit({ coId, refId: g.id, label: g.label, maxScore: g.maxScore, parts: [] });
  };

  const selectQuestion = (q: MockQuestion) => {
    const parts = q.parts
      ? (() => {
          const values = splitEvenly(q.maxScore, q.parts.length);
          return q.parts.map((p, i) => ({ label: p.label, maxScore: values[i] ?? 0 }));
        })()
      : [];
    emit({ coId, refId: q.id, label: q.label, maxScore: q.maxScore, parts });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add item from {levelLabel}</DialogTitle>
          <DialogDescription>
            Pick a course outcome, then {selectableLevel === 2 ? `select a ${levelLabel.toLowerCase()}` : `select a question`}.
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

          {selectableLevel === 3 ? (
            <div className="space-y-2">
              <Label>{levelLabel}</Label>
              <Select value={groupId} onValueChange={setGroupId} disabled={!coId}>
                <SelectTrigger>
                  <SelectValue placeholder={`Select a ${levelLabel.toLowerCase()}`} />
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
          ) : null}
        </div>

        <div className="max-h-[46vh] space-y-3 overflow-y-auto rounded-lg border p-3">
          {!coId ? (
            <p className="text-sm text-muted-foreground">Select a course outcome to continue.</p>
          ) : selectableLevel === 2 ? (
            groups.length === 0 ? (
              <p className="text-sm text-muted-foreground">No {levelLabel.toLowerCase()} found for this CO.</p>
            ) : (
              groups.map((g) => (
                <div key={g.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{g.label}</p>
                      <p className="text-xs text-muted-foreground">Max score {g.maxScore}</p>
                    </div>
                    <Button size="sm" onClick={() => selectGroup(g)}>
                      Select
                    </Button>
                  </div>
                  <ul className="mt-2 space-y-1 border-t pt-2">
                    {g.questions.map((q) => (
                      <li key={q.id} className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{q.label}</span>
                        <span>{q.maxScore}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )
          ) : !groupId ? (
            <p className="text-sm text-muted-foreground">Select a {levelLabel.toLowerCase()} to list its questions.</p>
          ) : questions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No questions found.</p>
          ) : (
            questions.map((q) => (
              <div key={q.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">{q.label}</p>
                  <p className="text-xs text-muted-foreground">Max score {q.maxScore}</p>
                  {q.parts ? (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {q.parts.map((p) => (
                        <Badge key={p.label} variant="secondary" className="text-[10px]">
                          {p.label} · {p.maxScore}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
                <Button size="sm" onClick={() => selectQuestion(q)}>
                  Select
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
