// Student enrollment — browser-only store (mock data, no backend writes).
import { createLocalStore, useLocalStore } from "./local-store";
import { uid } from "./co-assessment";

export type EnrolledStudent = {
  studentId: string;
  studentName: string;
  active: boolean;
};

export type EnrollmentBatch = {
  id: string;
  departmentId: string;
  departmentLabel: string;
  batchName: string;
  programme: string;
  semesterLabel: string;
  students: EnrolledStudent[];
  createdAt: string;
};

export const enrollmentStore = createLocalStore<EnrollmentBatch[]>("obe.student-enrollment.v1", []);

export function useEnrollmentBatches() {
  return useLocalStore(enrollmentStore);
}

export function newBatchId() {
  return uid("batch");
}

/** Batch names are unique (case-insensitive) across departments. */
export function batchNameTaken(name: string, ignoreId?: string) {
  const key = name.trim().toLowerCase();
  return enrollmentStore
    .get()
    .some((b) => b.id !== ignoreId && b.batchName.trim().toLowerCase() === key);
}

export function saveBatch(batch: EnrollmentBatch) {
  enrollmentStore.set((prev) => {
    const index = prev.findIndex((b) => b.id === batch.id);
    if (index === -1) return [batch, ...prev];
    const copy = [...prev];
    copy[index] = batch;
    return copy;
  });
}

export function deleteBatch(id: string) {
  enrollmentStore.set((prev) => prev.filter((b) => b.id !== id));
}

export function getBatch(id: string | undefined) {
  if (!id) return undefined;
  return enrollmentStore.get().find((b) => b.id === id);
}

export const STUDENT_TEMPLATE_HEADERS = ["Student ID", "Student Name"] as const;

export function studentTemplateCsv() {
  return `${STUDENT_TEMPLATE_HEADERS.join(",")}\n20210101,Ayesha Rahman\n20210102,Tanvir Hasan\n`;
}

/** Parses a pasted / uploaded CSV of "Student ID, Student Name" rows. */
export function parseStudentCsv(text: string): EnrolledStudent[] {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(",").map((cell) => cell.replace(/^"|"$/g, "").trim()));
  const body = rows.filter(
    (cells) => cells[0] && !/student\s*id/i.test(cells[0]) && !/^id$/i.test(cells[0]),
  );
  return body
    .filter((cells) => cells.length >= 2 && cells[0] && cells[1])
    .map((cells) => ({ studentId: cells[0] ?? "", studentName: cells[1] ?? "", active: true }));
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
