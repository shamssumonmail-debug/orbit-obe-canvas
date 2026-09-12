import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet, Plus, Save, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

import { AppShell } from "@/components/obe/app-shell";
import { RequireAuth } from "@/components/obe/require-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { batchOptions } from "@/lib/co-assessment";
import {
  batchNameTaken,
  getBatch,
  newBatchId,
  saveBatch,
  type EnrolledStudent,
} from "@/lib/enrollment-store";
import { useSemesterTypeOptions } from "@/lib/semester-types";

export const Route = createFileRoute("/master-data/student-enrollment/$id")({
  validateSearch: (search: Record<string, unknown>) => ({
    view: search.view === true || search.view === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Batch Students · OBE Suite student enrollment" },
      {
        name: "description",
        content:
          "Add students to a batch manually or by uploading a CSV / Excel list, and activate or remove them.",
      },
      { property: "og:title", content: "Batch Students · OBE Suite student enrollment" },
      {
        property: "og:description",
        content: "Manual and spreadsheet based student enrollment for a single batch.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BatchRoute,
});

type Department = { id: string; code: string; name: string };

function BatchRoute() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const { view } = Route.useSearch();
  const semesterOptions = useSemesterTypeOptions();
  const existing = id === "new" ? undefined : getBatch(id);
  const readOnly = Boolean(view);

  const { data: departments } = useQuery({
    queryKey: ["master-data", "departments", "options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("id, code, name").order("code");
      if (error) throw error;
      return (data ?? []) as Department[];
    },
  });

  const [batchId] = useState(() => existing?.id ?? newBatchId());
  const [departmentId, setDepartmentId] = useState(existing?.departmentId ?? "");
  const [batchName, setBatchName] = useState(existing?.batchName ?? "");
  const [programme, setProgramme] = useState(existing?.programme ?? "");
  const [semesterLabel, setSemesterLabel] = useState(existing?.semesterLabel ?? "");
  const [students, setStudents] = useState<EnrolledStudent[]>(existing?.students ?? []);
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const departmentLabel =
    departments?.find((d) => d.id === departmentId)?.code +
      " — " +
      (departments?.find((d) => d.id === departmentId)?.name ?? "") || "";

  const addStudent = () => {
    const trimmedId = newId.trim();
    const trimmedName = newName.trim();
    if (!trimmedId || !trimmedName) {
      toast.error("Enter both a student ID and a name");
      return;
    }
    if (students.some((s) => s.studentId === trimmedId)) {
      toast.error("That student ID is already in this batch");
      return;
    }
    setStudents((prev) => [...prev, { studentId: trimmedId, studentName: trimmedName, active: true }]);
    setNewId("");
    setNewName("");
  };

  const downloadTemplate = (kind: "csv" | "xlsx") => {
    const rows = [
      ["Student ID", "Student Name"],
      ...(students.length > 0
        ? students.map((s) => [s.studentId, s.studentName])
        : [
            ["20210101", "Ayesha Rahman"],
            ["20210102", "Tanvir Hasan"],
          ]),
    ];
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Students");
    XLSX.writeFile(book, `students-${(batchName || "batch").toLowerCase().replace(/\s+/g, "-")}.${kind}`, {
      bookType: kind === "csv" ? "csv" : "xlsx",
    });
  };

  const handleFile = async (file: File) => {
    try {
      const book = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = book.Sheets[book.SheetNames[0]];
      if (!sheet) throw new Error("the file is empty");
      const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
        header: 1,
        blankrows: false,
      });
      const parsed: EnrolledStudent[] = [];
      rows.forEach((row) => {
        const rawId = String(row[0] ?? "").trim();
        const rawName = String(row[1] ?? "").trim();
        if (!rawId || !rawName) return;
        if (/student\s*id/i.test(rawId)) return;
        parsed.push({ studentId: rawId, studentName: rawName, active: true });
      });
      if (parsed.length === 0) throw new Error("no student rows found");
      setStudents((prev) => {
        const map = new Map(prev.map((s) => [s.studentId, s]));
        parsed.forEach((s) => map.set(s.studentId, { ...(map.get(s.studentId) ?? s), ...s }));
        return [...map.values()];
      });
      toast.success(`${parsed.length} students loaded from ${file.name}`);
    } catch (error) {
      toast.error(
        `Could not read that file — ${error instanceof Error ? error.message : "unknown format"}`,
      );
    }
  };

  const save = () => {
    if (!departmentId || !batchName.trim()) {
      toast.error("Pick a department and give the batch a name");
      return;
    }
    if (batchNameTaken(batchName, batchId)) {
      toast.error("A batch with this name already exists");
      return;
    }
    saveBatch({
      id: batchId,
      departmentId,
      departmentLabel,
      batchName: batchName.trim(),
      programme,
      semesterLabel,
      students,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    });
    toast.success("Batch saved");
    navigate({ to: "/master-data/student-enrollment" });
  };

  return (
    <RequireAuth>
      <AppShell
        title={id === "new" ? "Add Batch" : readOnly ? "Batch Students" : "Edit Batch"}
        subtitle="Student enrollment · manual entry or spreadsheet upload"
      >
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Batch details</CardTitle>
              <CardDescription>Batch names must be unique.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={departmentId} onValueChange={setDepartmentId} disabled={readOnly}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {(departments ?? []).map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.code} — {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Batch</Label>
                <Select value={batchName} onValueChange={setBatchName} disabled={readOnly}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batchOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="programme">Programme</Label>
                <Input
                  id="programme"
                  value={programme}
                  disabled={readOnly}
                  placeholder="B.Sc. in Computer Science and Engineering"
                  onChange={(e) => setProgramme(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Semester Type</Label>
                <Select value={semesterLabel} onValueChange={setSemesterLabel} disabled={readOnly}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester type" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesterOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Students <Badge variant="secondary">{students.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Add students one by one, or upload a spreadsheet with ID and name columns.
                </CardDescription>
              </div>
              {!readOnly ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileRef}
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
                  <Button size="sm" variant="secondary" className="gap-2" onClick={() => fileRef.current?.click()}>
                    <Upload className="h-4 w-4" /> Upload list
                  </Button>
                </div>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              {!readOnly ? (
                <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-3">
                  <div className="space-y-2">
                    <Label htmlFor="student-id">Student ID</Label>
                    <Input
                      id="student-id"
                      value={newId}
                      className="w-40"
                      onChange={(e) => setNewId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-name">Student Name</Label>
                    <Input
                      id="student-name"
                      value={newName}
                      className="w-64"
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                  <Button size="sm" onClick={addStudent}>
                    <Plus className="mr-1 h-4 w-4" /> Add student
                  </Button>
                </div>
              ) : null}

              {students.length === 0 ? (
                <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                  No students in this batch yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-40">Student ID</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead className="w-32">Status</TableHead>
                      <TableHead className="w-16" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.studentId}>
                        <TableCell className="tabular-nums">{student.studentId}</TableCell>
                        <TableCell>{student.studentName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={student.active}
                              disabled={readOnly}
                              onCheckedChange={(checked) =>
                                setStudents((prev) =>
                                  prev.map((s) =>
                                    s.studentId === student.studentId ? { ...s, active: checked } : s,
                                  ),
                                )
                              }
                            />
                            <span className="text-xs text-muted-foreground">
                              {student.active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {!readOnly ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Remove ${student.studentName}`}
                              onClick={() =>
                                setStudents((prev) =>
                                  prev.filter((s) => s.studentId !== student.studentId),
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" onClick={() => navigate({ to: "/master-data/student-enrollment" })}>
              Back
            </Button>
            {!readOnly ? (
              <Button onClick={save}>
                <Save className="mr-1 h-4 w-4" /> Save batch
              </Button>
            ) : null}
          </div>
        </div>
      </AppShell>
    </RequireAuth>
  );
}
