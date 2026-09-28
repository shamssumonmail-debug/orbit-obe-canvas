import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import {
  defaultSections,
  mockStudents,
  type AssessmentStatus,
  type ScoreSection,
  type StudentRow,
} from "@/models/co-assessment";

export const ASSESSMENTS_KEY = "obe.co-assessments.v1";

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

export function seedAssessments(): AssessmentRecord[] {
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
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ];
}

const slice = createSlice({
  name: "coAssessments",
  initialState: () => ({ items: seedAssessments() }),
  reducers: {
    hydrateAssessments: (state, action: PayloadAction<AssessmentRecord[]>) => {
      state.items = action.payload;
    },
    upsertAssessment: (state, action: PayloadAction<AssessmentRecord>) => {
      const next = { ...action.payload, updatedAt: new Date().toISOString() };
      const index = state.items.findIndex((r) => r.id === next.id);
      if (index === -1) state.items.unshift(next);
      else state.items[index] = next;
    },
    removeAssessment: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((r) => r.id !== action.payload);
    },
  },
});

export const { hydrateAssessments, upsertAssessment, removeAssessment } = slice.actions;
export const coAssessmentsReducer = slice.reducer;
