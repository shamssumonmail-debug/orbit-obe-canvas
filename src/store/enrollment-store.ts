// Student enrollment state helpers backed by the Redux store.
import { useEffect } from "react";
import { useHydrated } from "@tanstack/react-router";

import { uid } from "@/features/co-assessment/services/co-assessment";
import { ensureHydrated, store, useAppSelector } from "./index";
import { removeBatch, upsertBatch, type EnrollmentBatch } from "./slices/enrollment-slice";

export type { EnrolledStudent, EnrollmentBatch } from "./slices/enrollment-slice";
import type { EnrolledStudent } from "./slices/enrollment-slice";

const EMPTY: EnrollmentBatch[] = [];

export function useEnrollmentBatches() {
  const hydrated = useHydrated();
  useEffect(() => ensureHydrated(), []);
  const items = useAppSelector((s) => s.enrollment.items);
  return hydrated ? items : EMPTY;
}

export function newBatchId() {
  return uid("batch");
}

/** Batch names are unique (case-insensitive) across departments. */
export function batchNameTaken(name: string, ignoreId?: string) {
  ensureHydrated();
  const key = name.trim().toLowerCase();
  return store
    .getState()
    .enrollment.items.some((b) => b.id !== ignoreId && b.batchName.trim().toLowerCase() === key);
}

export function saveBatch(batch: EnrollmentBatch) {
  ensureHydrated();
  store.dispatch(upsertBatch(batch));
}

export function deleteBatch(id: string) {
  ensureHydrated();
  store.dispatch(removeBatch(id));
}

export function getBatch(id: string | undefined) {
  if (!id) return undefined;
  ensureHydrated();
  return store.getState().enrollment.items.find((b) => b.id === id);
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
