// Redux store for the frontend-only OBE modules (CO Assessment, Student Enrollment).
// State is persisted to localStorage so it survives page refreshes.
import { configureStore } from "@reduxjs/toolkit";
import { useSelector, type TypedUseSelectorHook } from "react-redux";

import { coAssessmentsReducer, hydrateAssessments, ASSESSMENTS_KEY } from "./slices/co-assessments-slice";
import { enrollmentReducer, hydrateEnrollment, ENROLLMENT_KEY } from "./slices/enrollment-slice";

export const store = configureStore({
  reducer: {
    coAssessments: coAssessmentsReducer,
    enrollment: enrollmentReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

let hydrated = false;

function readKey<T>(key: string): T | undefined {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

/** Loads saved state from localStorage once, in the browser only. */
export function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const assessments = readKey<RootState["coAssessments"]["items"]>(ASSESSMENTS_KEY);
  if (assessments) store.dispatch(hydrateAssessments(assessments));
  const batches = readKey<RootState["enrollment"]["items"]>(ENROLLMENT_KEY);
  if (batches) store.dispatch(hydrateEnrollment(batches));

  let last = store.getState();
  store.subscribe(() => {
    const next = store.getState();
    try {
      if (next.coAssessments !== last.coAssessments)
        window.localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(next.coAssessments.items));
      if (next.enrollment !== last.enrollment)
        window.localStorage.setItem(ENROLLMENT_KEY, JSON.stringify(next.enrollment.items));
    } catch {
      /* ignore quota / private mode errors */
    }
    last = next;
  });
}
