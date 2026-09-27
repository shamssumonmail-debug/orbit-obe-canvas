import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export const ENROLLMENT_KEY = "obe.student-enrollment.v1";

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

const slice = createSlice({
  name: "enrollment",
  initialState: { items: [] as EnrollmentBatch[] },
  reducers: {
    hydrateEnrollment: (state, action: PayloadAction<EnrollmentBatch[]>) => {
      state.items = action.payload;
    },
    upsertBatch: (state, action: PayloadAction<EnrollmentBatch>) => {
      const index = state.items.findIndex((b) => b.id === action.payload.id);
      if (index === -1) state.items.unshift(action.payload);
      else state.items[index] = action.payload;
    },
    removeBatch: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((b) => b.id !== action.payload);
    },
  },
});

export const { hydrateEnrollment, upsertBatch, removeBatch } = slice.actions;
export const enrollmentReducer = slice.reducer;
