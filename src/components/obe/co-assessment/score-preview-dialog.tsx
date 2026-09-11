import { CheckCircle2, Download } from "lucide-react";

import { ScoreEntryTable } from "./score-entry-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInstitution, useLogoUrl } from "@/lib/institution";
import {
  grandMaxScore,
  grandTotal,
  groupTotal,
  letterGrade,
  sectionGroups,
  sectionTotal,
  type ScoreSection,
  type StudentRow,
} from "@/lib/co-assessment";

type Meta = {
  batchLabel: string;
  levelLabel: string;
  courseLabel: string;
  sectionLabel: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: ScoreSection[];
  students: StudentRow[];
  meta: Meta;
  completed: boolean;
  onMarkCompleted: () => void;
};

function csvEscape(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildCsv(
  sections: ScoreSection[],
  students: StudentRow[],
  meta: Meta,
  institutionName: string,
) {
  const totalMax = grandMaxScore(sections);
  const head: string[] = ["Student ID", "Student Name"];
  sections.forEach((section) => {
    if (section.kind === "attendance") {
      head.push(`${section.name} (${section.maxScore})`);
      return;
    }
    sectionGroups(section).forEach((group) => {
      group.leaves.forEach((leaf) => head.push(`${group.label} - ${leaf.label} (${leaf.maxScore})`));
      if (section.kind === "quiz_assignment") head.push(`${group.label} Total`);
    });
    head.push(`${section.name} Total (${section.maxScore})`);
  });
  head.push(`Total (${totalMax})`, "Letter Grade");

  const rows = students.map((student) => {
    const cells: (string | number)[] = [student.studentId, student.studentName];
    sections.forEach((section) => {
      if (section.kind === "attendance") {
        cells.push(student.scores[section.id] ?? "");
        return;
      }
      sectionGroups(section).forEach((group) => {
        group.leaves.forEach((leaf) => cells.push(student.scores[leaf.id] ?? ""));
        if (section.kind === "quiz_assignment") cells.push(groupTotal(group, student.scores));
      });
      cells.push(sectionTotal(section, student.scores));
    });
    const grand = grandTotal(sections, student.scores);
    cells.push(grand, letterGrade(grand, totalMax));
    return cells;
  });

  const lines = [
    [institutionName],
    ["CO Assessment — Score Sheet"],
    [`${meta.batchLabel} | ${meta.levelLabel} | ${meta.courseLabel} | ${meta.sectionLabel}`],
    [new Date().toLocaleDateString()],
    [],
    head,
    ...rows,
  ];
  return lines.map((line) => line.map(csvEscape).join(",")).join("\n");
}

export function ScorePreviewDialog({
  open,
  onOpenChange,
  sections,
  students,
  meta,
  completed,
  onMarkCompleted,
}: Props) {
  const { data: institution } = useInstitution();
  const logoUrl = useLogoUrl(institution?.logo_url);
  const institutionName = institution?.name ?? "Institution";

  const download = () => {
    const csv = buildCsv(sections, students, meta, institutionName);
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `co-assessment-${meta.courseLabel.split(" ")[0] ?? "scores"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-[96vw] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Score sheet preview</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-2 border-b pb-4 text-center">
          {logoUrl ? (
            <img src={logoUrl} alt={`${institutionName} logo`} className="h-16 w-16 object-contain" />
          ) : null}
          <h2 className="text-lg font-semibold">{institutionName}</h2>
          {institution?.sponsor_line ? (
            <p className="max-w-xl text-xs text-muted-foreground">{institution.sponsor_line}</p>
          ) : null}
          <p className="text-base font-medium">CO Assessment — Score Sheet</p>
          <p className="text-sm text-muted-foreground">
            {meta.batchLabel} · {meta.levelLabel} · {meta.courseLabel} · {meta.sectionLabel}
          </p>
          <p className="text-xs text-muted-foreground">
            Generated {new Date().toLocaleDateString()}
          </p>
        </div>

        <ScoreEntryTable sections={sections} students={students} readOnly />

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={download}>
            <Download className="mr-1 h-4 w-4" /> Download CSV / Excel
          </Button>
          <Button onClick={onMarkCompleted} disabled={completed}>
            <CheckCircle2 className="mr-1 h-4 w-4" />
            {completed ? "Marked as completed" : "Mark as completed"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
