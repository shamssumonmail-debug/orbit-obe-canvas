// CO assessment state helpers backed by the Redux store.
import { useEffect } from "react";
import { useHydrated } from "@tanstack/react-router";

import { uid } from "@/features/co-assessment/services/co-assessment";
import { ensureHydrated, store, useAppSelector } from "./index";
import {
  removeAssessment,
  seedAssessments,
  upsertAssessment,
  type AssessmentRecord,
} from "./slices/co-assessments-slice";

export type { AssessmentRecord } from "./slices/co-assessments-slice";

let ssrSeed: AssessmentRecord[] | undefined;

export function useAssessments() {
  const hydrated = useHydrated();
  useEffect(() => ensureHydrated(), []);
  const items = useAppSelector((s) => s.coAssessments.items);
  if (hydrated) return items;
  ssrSeed ??= seedAssessments();
  return ssrSeed;
}

export function newAssessmentId() {
  return uid("asm");
}

export function saveAssessment(record: AssessmentRecord) {
  ensureHydrated();
  store.dispatch(upsertAssessment(record));
}

export function deleteAssessment(id: string) {
  ensureHydrated();
  store.dispatch(removeAssessment(id));
}

export function getAssessment(id: string | undefined) {
  if (!id) return undefined;
  ensureHydrated();
  return store.getState().coAssessments.items.find((r) => r.id === id);
}
