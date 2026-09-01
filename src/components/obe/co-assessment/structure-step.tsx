import { AlertCircle, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { CascadingSelectorDialog, type CascadingSelection } from "./cascading-selector-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
  itemsTotal,
  partsTotal,
  sectionStructureValid,
  uid,
  type ScoreItem,
  type ScoreSection,
} from "@/lib/co-assessment";
import { cn } from "@/lib/utils";

type Props = {
  sections: ScoreSection[];
  onChange: (sections: ScoreSection[]) => void;
};

export function StructureStep({ sections, onChange }: Props) {
  const [dialogSectionId, setDialogSectionId] = useState<string | null>(null);
  const [flow, setFlow] = useState<"quiz" | "final">("quiz");

  const total = grandMaxScore(sections);

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

  const addSection = () =>
    onChange([...sections, { id: uid("sec"), name: "", maxScore: 0, items: [] }]);

  const handleSelection = (sectionId: string, selection: CascadingSelection) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;
    const label =
      flow === "quiz"
        ? `${section.name || "Item"} ${section.items.length + 1}`
        : selection.label;
    const item: ScoreItem = {
      id: uid("item"),
      label,
      maxScore: selection.maxScore,
      sourceCO: selection.coId,
      sourceRef: selection.refId,
      parts: selection.parts.map((p) => ({ id: uid("part"), label: p.label, maxScore: p.maxScore })),
    };
    updateSection(sectionId, { items: [...section.items, item] });
  };

  return (
    <div className="space-y-4">
      <Card className={cn("border-2", total === 100 ? "border-emerald-500/60" : "border-amber-500/60")}>
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-base">Score structure</CardTitle>
            <p className="text-sm text-muted-foreground">
              Define any sections you need — names, counts and nesting are fully custom.
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
              <p className="text-xs text-amber-600">Sections do not add up to 100 (warning only).</p>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      {sections.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No sections yet. Add your first section to start building the structure.
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-3">
          {sections.map((section) => {
            const iTotal = itemsTotal(section);
            const itemsMismatch = section.items.length > 0 && iTotal !== Number(section.maxScore);
            return (
              <AccordionItem key={section.id} value={section.id} className="rounded-lg border px-3">
                <div className="flex flex-wrap items-center gap-3 py-3">
                  <div className="grid flex-1 gap-3 sm:grid-cols-[2fr_1fr]">
                    <div className="space-y-1">
                      <Label className="text-xs">Section name</Label>
                      <Input
                        value={section.name}
                        placeholder="e.g. Quiz, Attendance, Final (Exam)"
                        onChange={(e) => updateSection(section.id, { name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Max score</Label>
                      <Input
                        type="number"
                        min={0}
                        value={section.maxScore}
                        onChange={(e) =>
                          updateSection(section.id, { maxScore: Number(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove section"
                    onClick={() => onChange(sections.filter((s) => s.id !== section.id))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <AccordionTrigger className="shrink-0 py-0 text-sm">
                    {section.items.length} item{section.items.length === 1 ? "" : "s"}
                  </AccordionTrigger>
                </div>

                <AccordionContent className="space-y-3 pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Select value={flow} onValueChange={(v) => setFlow(v as "quiz" | "final")}>
                        <SelectTrigger className="w-[190px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quiz">From Quiz (select quiz)</SelectItem>
                          <SelectItem value="final">From Final Exam (select question)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="outline" onClick={() => setDialogSectionId(section.id)}>
                        <Plus className="mr-1 h-4 w-4" /> Add Item
                      </Button>
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
                      Items total: {iTotal} / {section.maxScore}
                    </p>
                  </div>

                  {itemsMismatch ? (
                    <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      Item scores must sum exactly to the section max score ({section.maxScore}).
                    </div>
                  ) : null}

                  {section.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No items — this section will be scored directly as one number.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {section.items.map((item) => {
                        const pTotal = partsTotal(item);
                        const partsMismatch = item.parts.length > 0 && pTotal !== Number(item.maxScore);
                        return (
                          <div key={item.id} className="rounded-md border p-3">
                            <div className="flex flex-wrap items-end gap-3">
                              <div className="min-w-[180px] flex-1 space-y-1">
                                <Label className="text-xs">Item label</Label>
                                <Input
                                  value={item.label}
                                  onChange={(e) =>
                                    updateItem(section.id, item.id, { label: e.target.value })
                                  }
                                />
                              </div>
                              <div className="w-28 space-y-1">
                                <Label className="text-xs">Max score</Label>
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
                                  <p className="text-xs font-medium text-muted-foreground">Parts</p>
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
                                      <Label className="text-xs">Max</Label>
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
                    </div>
                  )}

                  {!sectionStructureValid(section) ? (
                    <p className="text-xs text-destructive">
                      Fix this section's totals before continuing to score entry.
                    </p>
                  ) : null}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      <Button variant="outline" onClick={addSection}>
        <Plus className="mr-1 h-4 w-4" /> Add Section
      </Button>

      <CascadingSelectorDialog
        open={dialogSectionId !== null}
        onOpenChange={(open) => setDialogSectionId(open ? dialogSectionId : null)}
        levelLabel={flow === "quiz" ? "Quiz" : "Final Exam"}
        selectableLevel={flow === "quiz" ? 2 : 3}
        groupKind={flow === "quiz" ? "quizzes" : "finals"}
        onSelect={(selection) => {
          if (dialogSectionId) handleSelection(dialogSectionId, selection);
        }}
      />
    </div>
  );
}
