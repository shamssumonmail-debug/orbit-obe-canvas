// Local (browser-only) persistence for CO assessments — no backend calls.
import { createLocalStore, useLocalStore } from "./local-store";
import {
  defaultSections,
  mockStudents,
  uid,
  type AssessmentStatus,
  type ScoreSection,
  type StudentRow,
} from "./co-assessment";

export type AssessmentRecord = {
  id: string;
  batchLabel: string;
  levelLabel: string;
  courseLabel: string;
  semesterLabel: string;
  sections: ScoreSection[];
  students: StudentRow[];
  status: AssessmentStatus;
  updatedAt: string;
};

function seed(): AssessmentRecord[] {
  return [
    {
      id: "asm-seed-1",
      batchLabel: "Batch 2021",
      levelLabel: "Level 3 - Term 1",
      courseLabel: "CSE 3103 - Database Systems",
      semesterLabel: "Spring",
      sections: defaultSections(),
      students: mockStudents,
      status: "Draft",
      updatedAt: new Date().toISOString(),
    },
  ];
}

export const assessmentsStore = createLocalStore<AssessmentRecord[]>(
  "obe.co-assessments.v1",
  seed(),
);

export function useAssessments() {
  return useLocalStore(assessmentsStore);
}

export function newAssessmentId() {
  return uid("asm");
}

export function saveAssessment(record: AssessmentRecord) {
  assessmentsStore.set((prev) => {
    const next = { ...record, updatedAt: new Date().toISOString() };
    const index = prev.findIndex((r) => r.id === record.id);
    if (index === -1) return [next, ...prev];
    const copy = [...prev];
    copy[index] = next;
    return copy;
  });
}

export function deleteAssessment(id: string) {
  assessmentsStore.set((prev) => prev.filter((r) => r.id !== id));
}

export function getAssessment(id: string | undefined) {
  if (!id) return undefined;
  return assessmentsStore.get().find((r) => r.id === id);
}
