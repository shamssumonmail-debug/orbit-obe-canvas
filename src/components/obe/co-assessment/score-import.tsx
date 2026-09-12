import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { sectionGroups, type ScoreSection, type StudentRow } from "@/lib/co-assessment";

export type ScoreColumn = { id: string; header: string; maxScore: number };

/** One column per scoreable input, with a stable human readable header. */
export function scoreColumns(sections: ScoreSection[]): ScoreColumn[] {
  const columns: ScoreColumn[] = [];
  sections.forEach((section) => {
    if (section.kind === "attendance") {
      columns.push({ id: section.id, header: section.name, maxScore: section.maxScore });
      return;
    }
    sectionGroups(section).forEach((group) => {
      group.leaves.forEach((leaf) =>
        columns.push({
          id: leaf.id,
          header: `${group.label} - ${leaf.label}`,
          maxScore: leaf.maxScore,
        }),
      );
    });
  });
  return columns;
}

const normalize = (value: string) => value.replace(/\s+/g, " ").trim().toLowerCase();

function sheetRows(sections: ScoreSection[], students: StudentRow[], withScores: boolean) {
  const columns = scoreColumns(sections);
  const header = [
    "Student ID",
    "Student Name",
    ...columns.map((c) => `${c.header} (${c.maxScore})`),
  ];
  const rows = students.map((student) => [
    student.studentId,
    student.studentName,
    ...columns.map((c) => (withScores ? (student.scores[c.id] ?? "") : "")),
  ]);
  return [header, ...rows];
}

export function ScoreImport({
  sections,
  students,
  onImport,
  fileBase,
}: {
  sections: ScoreSection[];
  students: StudentRow[];
  onImport: (students: StudentRow[]) => void;
  fileBase: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = (kind: "csv" | "xlsx") => {
    const sheet = XLSX.utils.aoa_to_sheet(sheetRows(sections, students, false));
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Scores");
    XLSX.writeFile(book, `${fileBase}-template.${kind}`, {
      bookType: kind === "csv" ? "csv" : "xlsx",
    });
    toast.success(`Sample ${kind.toUpperCase()} downloaded`);
  };

  const handleFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const book = XLSX.read(buffer, { type: "array" });
      const sheet = book.Sheets[book.SheetNames[0]];
      if (!sheet) throw new Error("empty file");
      const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1, blankrows: false });
      const headerIndex = rows.findIndex((row) =>
        row.some((cell) => normalize(String(cell ?? "")).startsWith("student id")),
      );
      if (headerIndex === -1) throw new Error("no 'Student ID' column found");

      const header = rows[headerIndex].map((cell) => normalize(String(cell ?? "")));
      const columns = scoreColumns(sections);
      const columnIndex = new Map<string, number>();
      columns.forEach((column) => {
        const target = normalize(column.header);
        const found = header.findIndex((cell) => cell.replace(/\s*\(\d+(\.\d+)?\)$/, "") === target);
        if (found > -1) columnIndex.set(column.id, found);
      });
      if (columnIndex.size === 0) throw new Error("no score columns matched this structure");

      const idIndex = header.findIndex((cell) => cell.startsWith("student id"));
      const byId = new Map<string, (string | number)[]>();
      rows.slice(headerIndex + 1).forEach((row) => {
        const id = String(row[idIndex] ?? "").trim();
        if (id) byId.set(id, row);
      });

      let filled = 0;
      const next = students.map((student) => {
        const row = byId.get(student.studentId);
        if (!row) return student;
        const scores = { ...student.scores };
        columnIndex.forEach((index, leafId) => {
          const raw = row[index];
          if (raw === undefined || raw === null || raw === "") return;
          const value = Number(raw);
          if (Number.isFinite(value)) {
            scores[leafId] = value;
            filled += 1;
          }
        });
        return { ...student, scores };
      });

      onImport(next);
      toast.success(`Imported ${filled} score${filled === 1 ? "" : "s"} from ${file.name}`);
    } catch (error) {
      toast.error(
        `Could not read that file — ${error instanceof Error ? error.message : "unknown format"}`,
      );
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.target.value = "";
        }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Sample sheet
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => downloadTemplate("xlsx")}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel (.xlsx)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => downloadTemplate("csv")}>
            <Download className="mr-2 h-4 w-4" /> CSV (.csv)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button size="sm" variant="secondary" className="gap-2" onClick={() => inputRef.current?.click()}>
        <Upload className="h-4 w-4" /> Upload marks
      </Button>
    </div>
  );
}
