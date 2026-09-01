import { AlertCircle, Plus, Trash2, Wand2 } from "lucide-react";
import { useState } from "react";

import { CascadingSelectorDialog, type CascadingSelection } from "./cascading-selector-dialog";
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
  addButtonLabel,
  grandMaxScore,
  itemsTotal,
  partsTotal,
  remainingForSection,
  sectionStructureValid,
  sourceLabels,
  uid,
  type ScoreItem,
  type ScoreSection,
  type SectionSource,
} from "@/lib/co-assessment";
import { cn } from "@/lib/utils";

type Props = {
  sections: ScoreSection[];
  onChange: (sections: ScoreSection[]) => void;
};

const PRESETS: { name: string; maxScore: number; source: SectionSource }[] = [
  { name: "Quiz", maxScore: 10, source: "quiz" },
  { name: "Assessment", maxScore: 10, source: "quiz" },
  { name: "Attendance", maxScore: 10, source: "manual" },
  { name: "Final (Exam)", maxScore: 70, source: "final" },
];

export function StructureStep({ sections, onChange }: Props) {
  const [dialogSectionId, setDialogSectionId] = useState<string | null>(null);
  const total = grandMaxScore(sections);
  const dialogSection = sections.find((s) => s.id === dialogSectionId) ?? null;

  const updateSection = (id: string, patch: Partial<ScoreSection>) =>
    onChange(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const updateItem = (sectionId: string, itemId: string, patch: Partial<ScoreItem>) =>
    onChange(
      sections.map((s) =>
        s.id !== sectionId
          ? s
          : { ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) },
      ),
    );

  const addSection = (preset?: (typeof PRESETS)[number]) =>
    onChange([
      ...sections,
      {
        id: uid("sec"),
        name: preset?.name ?? "",
        maxScore: preset?.maxScore ?? 0,
        source: preset?.source ?? "manual",
        items: [],
      },
    ]);

  const evenSplit = (section: ScoreSection) => {
    const count = section.items.length;
    if (count === 0) return;
    const base = Math.round((Number(section.maxScore) / count) * 10) / 10;
    const items = section.items.map((item, index) => {
      const value =
        index === count - 1
          ? Math.round((Number(section.maxScore) - base * (count - 1)) * 10) / 10
          : base;
      const parts = item.parts.length
        ? (() => {
            const pBase = Math.round((value / item.parts.length) * 10) / 10;
            return item.parts.map((p, i) => ({
              ...p,
              maxScore:
                i === item.parts.length - 1
                  ? Math.round((value - pBase * (item.parts.length - 1)) * 10) / 10
                  : pBase,
            }));
          })()
        : item.parts;
      return { ...item, maxScore: value, parts };
    });
    updateSection(section.id, { items });
  };

  const handleSelection = (section: ScoreSection, selection: CascadingSelection) => {
    const noun = section.source === "final" ? "Question" : section.name.trim() || "Item";
    const label = section.source === "quiz" ? `${noun} ${section.items.length + 1}` : selection.label;
    const remaining = remainingForSection(section);
    const item: ScoreItem = {
      id: uid("item"),
      label,
      maxScore: remaining > 0 ? Math.min(selection.maxScore, remaining) : selection.maxScore,
      sourceCO: selection.coId,
      sourceRef: selection.refId,
      parts: selection.parts.map((p) => ({ id: uid("part"), label: p.label, maxScore: p.maxScore })),
    };
    updateSection(section.id, { items: [...section.items, item] });
  };

  return (
    <div className="space-y-4">
      <Card className={cn("border-2", total === 100 ? "border-emerald-500/60" : "border-amber-500/60")}>
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-base">Score structure</CardTitle>
            <p className="text-sm text-muted-foreground">
              Add any sections you need — Quiz, Assessment, Attendance, Final, or anything else. Each
              section's max score is split across the items you attach.
            </p>
          </div>
          <div className="text-right">
            <p
              className={cn(
                "text-2xl font-semibold tabular-nums",
                total === 100 ? "text-emerald-600" : "text-amber-600",
              )}
            >
              Total: {total} / 100
            </p>
            {total !== 100 ? (
              <p className="text-xs text-amber-600">Sections do not add up to 100 yet.</p>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      {sections.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No sections yet. Start from a common layout or build your own.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {PRESETS.map((preset) => (
                <Button key={preset.name} size="sm" variant="outline" onClick={() => addSection(preset)}>
                  <Plus className="mr-1 h-4 w-4" /> {preset.name} ({preset.maxScore})
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sections.map((section, sectionIndex) => {
            const iTotal = itemsTotal(section);
            const itemsMismatch = section.items.length > 0 && iTotal !== Number(section.maxScore);
            const remaining = remainingForSection(section);
            return (
              <Card key={section.id}>
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="min-w-[180px] flex-1 space-y-1">
                      <Label className="text-xs">
                        Section {sectionIndex + 1} name (top heading)
                      </Label>
                      <Input
                        value={section.name}
                        placeholder="e.g. Quiz, Assessment, Attendance, Final (Exam)"
                        onChange={(e) => updateSection(section.id, { name: e.target.value })}
                      />
                    </div>
                    <div className="w-28 space-y-1">
                      <Label className="text-xs">Score</Label>
                      <Input
                        type="number"
                        min={0}
                        value={section.maxScore}
                        onChange={(e) =>
                          updateSection(section.id, { maxScore: Number(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="w-[240px] space-y-1">
                      <Label className="text-xs">Column source</Label>
                      <Select
                        value={section.source}
                        onValueChange={(v) => updateSection(section.id, { source: v as SectionSource })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(sourceLabels) as SectionSource[]).map((key) => (
                            <SelectItem key={key} value={key}>
                              {sourceLabels[key]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove section"
                      onClick={() => onChange(sections.filter((s) => s.id !== section.id))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {section.source === "manual" ? (
                        <p className="text-sm text-muted-foreground">
                          Scored directly as one column out of {section.maxScore}.
                        </p>
                      ) : (
                        <Button size="sm" onClick={() => setDialogSectionId(section.id)}>
                          <Plus className="mr-1 h-4 w-4" /> {addButtonLabel(section)}
                        </Button>
                      )}
                      {section.items.length > 1 ? (
                        <Button size="sm" variant="outline" onClick={() => evenSplit(section)}>
                          <Wand2 className="mr-1 h-4 w-4" /> Split evenly
                        </Button>
                      ) : null}
                    </div>
                    <p
                      className={cn(
                        "text-sm font-medium tabular-nums",
                        section.items.length === 0
                          ? "text-muted-foreground"
                          : itemsMismatch
                            ? "text-destructive"
                            : "text-emerald-600",
                      )}
                    >
                      Distributed: {iTotal} / {section.maxScore}
                      {section.items.length > 0 && remaining !== 0
                        ? ` · ${remaining > 0 ? `${remaining} left` : `${Math.abs(remaining)} over`}`
                        : ""}
                    </p>
                  </div>

                  {itemsMismatch ? (
                    <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      Item scores must sum exactly to {section.maxScore}.
                    </div>
                  ) : null}
                </CardHeader>

                {section.items.length > 0 ? (
                  <CardContent className="space-y-3">
                    {section.items.map((item) => {
                      const pTotal = partsTotal(item);
                      const partsMismatch = item.parts.length > 0 && pTotal !== Number(item.maxScore);
                      return (
                        <div key={item.id} className="rounded-md border p-3">
                          <div className="flex flex-wrap items-end gap-3">
                            <div className="min-w-[180px] flex-1 space-y-1">
                              <Label className="text-xs">Column label (sub heading)</Label>
                              <Input
                                value={item.label}
                                onChange={(e) =>
                                  updateItem(section.id, item.id, { label: e.target.value })
                                }
                              />
                            </div>
                            <div className="w-28 space-y-1">
                              <Label className="text-xs">Score</Label>
                              <Input
                                type="number"
                                min={0}
                                value={item.maxScore}
                                onChange={(e) =>
                                  updateItem(section.id, item.id, {
                                    maxScore: Number(e.target.value) || 0,
                                  })
                                }
                              />
                            </div>
                            {item.sourceCO ? (
                              <Badge variant="secondary" className="mb-2">
                                {item.sourceCO.toUpperCase()}
                              </Badge>
                            ) : null}
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Remove item"
                              className="mb-1"
                              onClick={() =>
                                updateSection(section.id, {
                                  items: section.items.filter((i) => i.id !== item.id),
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {item.parts.length > 0 ? (
                            <div className="mt-3 space-y-2 border-l-2 pl-3">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-medium text-muted-foreground">
                                  Question parts
                                </p>
                                <p
                                  className={cn(
                                    "text-xs font-medium tabular-nums",
                                    partsMismatch ? "text-destructive" : "text-emerald-600",
                                  )}
                                >
                                  Parts total: {pTotal} / {item.maxScore}
                                </p>
                              </div>
                              {partsMismatch ? (
                                <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  Part scores must sum exactly to {item.maxScore}.
                                </div>
                              ) : null}
                              {item.parts.map((part) => (
                                <div key={part.id} className="flex items-end gap-2">
                                  <div className="flex-1 space-y-1">
                                    <Label className="text-xs">Part label</Label>
                                    <Input
                                      value={part.label}
                                      onChange={(e) =>
                                        updateItem(section.id, item.id, {
                                          parts: item.parts.map((p) =>
                                            p.id === part.id ? { ...p, label: e.target.value } : p,
                                          ),
                                        })
                                      }
                                    />
                                  </div>
                                  <div className="w-24 space-y-1">
                                    <Label className="text-xs">Score</Label>
                                    <Input
                                      type="number"
                                      min={0}
                                      value={part.maxScore}
                                      onChange={(e) =>
                                        updateItem(section.id, item.id, {
                                          parts: item.parts.map((p) =>
                                            p.id === part.id
                                              ? { ...p, maxScore: Number(e.target.value) || 0 }
                                              : p,
                                          ),
                                        })
                                      }
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}

                    {!sectionStructureValid(section) ? (
                      <p className="text-xs text-destructive">
                        Fix this section's totals before continuing to score entry.
                      </p>
                    ) : null}
                  </CardContent>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => addSection()}>
          <Plus className="mr-1 h-4 w-4" /> Add Section
        </Button>
        {sections.length > 0
          ? PRESETS.filter((p) => !sections.some((s) => s.name === p.name)).map((preset) => (
              <Button key={preset.name} variant="ghost" size="sm" onClick={() => addSection(preset)}>
                <Plus className="mr-1 h-4 w-4" /> {preset.name}
              </Button>
            ))
          : null}
      </div>

      <CascadingSelectorDialog
        open={dialogSectionId !== null}
        onOpenChange={(open) => setDialogSectionId(open ? dialogSectionId : null)}
        levelLabel={dialogSection?.source === "final" ? "Final Exam" : "Quiz"}
        selectableLevel={dialogSection?.source === "final" ? 3 : 2}
        groupKind={dialogSection?.source === "final" ? "finals" : "quizzes"}
        onSelect={(selection) => {
          if (dialogSection) handleSelection(dialogSection, selection);
        }}
      />
    </div>
  );
}
