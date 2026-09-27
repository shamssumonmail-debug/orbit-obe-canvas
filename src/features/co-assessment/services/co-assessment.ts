// CO Assessment — pure frontend module. Mock data + local state shapes only.
// No backend calls: this is wired to real data in a later phase.

export type Leaf = {
  id: string;
  label: string;
  maxScore: number;
};

/** A quiz, an assignment, or an exam question. Holds the scored leaf columns. */
export type ScoreGroup = {
  id: string;
  label: string;
  coLabel?: string;
  sourceRef?: string;
  leaves: Leaf[];
};

export type SectionKind = "quiz_assignment" | "attendance" | "exam";
export type ExamKind = "midterm" | "final";

export type ScoreSection = {
  id: string;
  kind: SectionKind;
  name: string;
  maxScore: number;
  /** quiz_assignment */
  quizzes: ScoreGroup[];
  assignments: ScoreGroup[];
  /** how many best attempts count toward the section total */
  bestOf: number;
  /** exam */
  examKind: ExamKind;
  questions: ScoreGroup[];
};

export type StudentRow = {
  studentId: string;
  studentName: string;
  scores: Record<string, number>;
};

export type AssessmentStatus = "Draft" | "Structure Configured" | "Scoring In Progress" | "Complete";

let counter = 0;
export function uid(prefix: string) {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

/* --------------------------------- factories -------------------------------- */

export function makeSection(kind: SectionKind, examKind: ExamKind = "final"): ScoreSection {
  const base = {
    id: uid("sec"),
    quizzes: [],
    assignments: [],
    bestOf: 2,
    examKind,
    questions: [],
  };
  if (kind === "quiz_assignment")
    return { ...base, kind, name: "Quiz and Assignment", maxScore: 20 };
  if (kind === "attendance") return { ...base, kind, name: "Attendance", maxScore: 10 };
  return {
    ...base,
    kind,
    name: examKind === "midterm" ? "Mid-Term" : "Final",
    maxScore: examKind === "midterm" ? 20 : 70,
  };
}

export function defaultSections(): ScoreSection[] {
  return [makeSection("quiz_assignment"), makeSection("attendance"), makeSection("exam", "final")];
}

/* ---------------------------------- mocks --------------------------------- */

export const batchOptions = ["Batch 2021", "Batch 2022", "Batch 2023"];
export const levelOptions = [
  "Level 1 - Term 1",
  "Level 2 - Term 2",
  "Level 3 - Term 1",
  "Level 4 - Term 2",
];
export const courseOptions = [
  "CSE 3103 - Database Systems",
  "CSE 3211 - Operating Systems",
  "EEE 2101 - Electrical Circuits",
];
export const sectionOptions = ["Section A", "Section B", "Section C"];

export type MockQuestion = {
  id: string;
  label: string;
  maxScore: number;
  parts?: { label: string; maxScore: number }[];
};

export type MockGroup = {
  id: string;
  label: string;
  maxScore: number;
  questions: MockQuestion[];
};

export type MockCO = {
  id: string;
  label: string;
  quizzes: MockGroup[];
  assignments: MockGroup[];
  finals: MockGroup[];
  midterms: MockGroup[];
};

export const mockCOs: MockCO[] = [
  {
    id: "co1",
    label: "CO1 — Explain relational database concepts",
    quizzes: [
      {
        id: "co1-q1",
        label: "Quiz 1 (Week 3)",
        maxScore: 10,
        questions: [
          { id: "co1-q1-1", label: "Question 1", maxScore: 5 },
          { id: "co1-q1-2", label: "Question 2", maxScore: 5 },
        ],
      },
      {
        id: "co1-q2",
        label: "Quiz 2 (Week 6)",
        maxScore: 10,
        questions: [
          { id: "co1-q2-1", label: "Question 1", maxScore: 6 },
          { id: "co1-q2-2", label: "Question 2", maxScore: 4 },
        ],
      },
    ],
    assignments: [
      {
        id: "co1-a1",
        label: "Assignment 1 (ER modelling)",
        maxScore: 10,
        questions: [
          { id: "co1-a1-1", label: "Question 1", maxScore: 5 },
          { id: "co1-a1-2", label: "Question 2", maxScore: 5 },
        ],
      },
    ],
    midterms: [
      {
        id: "co1-m1",
        label: "Mid-Term Exam",
        maxScore: 20,
        questions: [
          {
            id: "co1-m1-q1",
            label: "Question 1",
            maxScore: 10,
            parts: [
              { label: "A", maxScore: 5 },
              { label: "B", maxScore: 5 },
            ],
          },
          { id: "co1-m1-q2", label: "Question 2", maxScore: 10 },
        ],
      },
    ],
    finals: [
      {
        id: "co1-f1",
        label: "Final Exam",
        maxScore: 30,
        questions: [
          {
            id: "co1-f1-q1",
            label: "Question 1",
            maxScore: 15,
            parts: [
              { label: "A", maxScore: 5 },
              { label: "B", maxScore: 5 },
              { label: "C", maxScore: 5 },
            ],
          },
          { id: "co1-f1-q2", label: "Question 2", maxScore: 10 },
        ],
      },
    ],
  },
  {
    id: "co2",
    label: "CO2 — Design normalized schemas",
    quizzes: [
      {
        id: "co2-q1",
        label: "Quiz 3 (Week 9)",
        maxScore: 10,
        questions: [
          { id: "co2-q1-1", label: "Question 1", maxScore: 4 },
          { id: "co2-q1-2", label: "Question 2", maxScore: 6 },
        ],
      },
    ],
    assignments: [
      {
        id: "co2-a1",
        label: "Assignment 2 (Normalization)",
        maxScore: 10,
        questions: [
          { id: "co2-a1-1", label: "Question 1", maxScore: 4 },
          { id: "co2-a1-2", label: "Question 2", maxScore: 6 },
        ],
      },
    ],
    midterms: [
      {
        id: "co2-m1",
        label: "Mid-Term Exam",
        maxScore: 20,
        questions: [
          {
            id: "co2-m1-q1",
            label: "Question 3",
            maxScore: 10,
            parts: [
              { label: "A", maxScore: 5 },
              { label: "C", maxScore: 5 },
            ],
          },
        ],
      },
    ],
    finals: [
      {
        id: "co2-f1",
        label: "Final Exam",
        maxScore: 30,
        questions: [
          {
            id: "co2-f1-q1",
            label: "Question 3",
            maxScore: 15,
            parts: [
              { label: "A", maxScore: 7 },
              { label: "B", maxScore: 8 },
            ],
          },
          { id: "co2-f1-q2", label: "Question 4", maxScore: 10 },
        ],
      },
    ],
  },
  {
    id: "co3",
    label: "CO3 — Apply query optimisation techniques",
    quizzes: [
      {
        id: "co3-q1",
        label: "Quiz 4 (Week 12)",
        maxScore: 10,
        questions: [
          { id: "co3-q1-1", label: "Question 1", maxScore: 5 },
          { id: "co3-q1-2", label: "Question 2", maxScore: 5 },
        ],
      },
    ],
    assignments: [
      {
        id: "co3-a1",
        label: "Assignment 3 (Query plans)",
        maxScore: 10,
        questions: [{ id: "co3-a1-1", label: "Question 1", maxScore: 10 }],
      },
    ],
    midterms: [],
    finals: [
      {
        id: "co3-f1",
        label: "Final Exam",
        maxScore: 20,
        questions: [
          { id: "co3-f1-q1", label: "Question 5", maxScore: 10 },
          {
            id: "co3-f1-q2",
            label: "Question 6",
            maxScore: 10,
            parts: [
              { label: "A", maxScore: 5 },
              { label: "B", maxScore: 5 },
            ],
          },
        ],
      },
    ],
  },
];

export const mockStudents: StudentRow[] = [
  { studentId: "20210101", studentName: "Ayesha Rahman", scores: {} },
  { studentId: "20210102", studentName: "Tanvir Hasan", scores: {} },
  { studentId: "20210103", studentName: "Nusrat Jahan", scores: {} },
  { studentId: "20210104", studentName: "Rifat Chowdhury", scores: {} },
  { studentId: "20210105", studentName: "Mehedi Alam", scores: {} },
  { studentId: "20210106", studentName: "Sadia Islam", scores: {} },
  { studentId: "20210107", studentName: "Arif Mahmud", scores: {} },
  { studentId: "20210108", studentName: "Faria Sultana", scores: {} },
];

export const mockAssessments: {
  id: string;
  batchLabel: string;
  levelLabel: string;
  sectionCount: number;
  studentCount: number;
  status: AssessmentStatus;
}[] = [
  {
    id: "asm-1",
    batchLabel: "Batch 2021",
    levelLabel: "Level 3 - Term 1",
    sectionCount: 3,
    studentCount: 42,
    status: "Complete",
  },
  {
    id: "asm-2",
    batchLabel: "Batch 2022",
    levelLabel: "Level 2 - Term 2",
    sectionCount: 3,
    studentCount: 38,
    status: "Scoring In Progress",
  },
  {
    id: "asm-3",
    batchLabel: "Batch 2023",
    levelLabel: "Level 1 - Term 1",
    sectionCount: 2,
    studentCount: 45,
    status: "Structure Configured",
  },
];

/* -------------------------------- computation ------------------------------ */

export function groupMax(group: ScoreGroup) {
  return round1(group.leaves.reduce((sum, l) => sum + (Number(l.maxScore) || 0), 0));
}

export function groupTotal(group: ScoreGroup, scores: Record<string, number>) {
  return round1(group.leaves.reduce((sum, l) => sum + (Number(scores[l.id]) || 0), 0));
}

export function sectionGroups(section: ScoreSection): ScoreGroup[] {
  if (section.kind === "quiz_assignment") return [...section.quizzes, ...section.assignments];
  if (section.kind === "exam") return section.questions;
  return [];
}

export function leafIdsForSection(section: ScoreSection): string[] {
  if (section.kind === "attendance") return [section.id];
  return sectionGroups(section).flatMap((g) => g.leaves.map((l) => l.id));
}

export function sectionTotal(section: ScoreSection, scores: Record<string, number>) {
  if (section.kind === "attendance") return round1(Number(scores[section.id]) || 0);
  const totals = sectionGroups(section).map((g) => groupTotal(g, scores));
  if (section.kind === "exam") return round1(totals.reduce((a, b) => a + b, 0));
  const best = [...totals].sort((a, b) => b - a).slice(0, Math.max(1, section.bestOf));
  return round1(Math.min(best.reduce((a, b) => a + b, 0), Number(section.maxScore) || 0));
}

export function round1(value: number) {
  return Math.round(value * 10) / 10;
}

/** Score covered by the section's configured columns (best-N for quiz/assignment). */
export function sectionConfiguredScore(section: ScoreSection) {
  if (section.kind === "attendance") return Number(section.maxScore) || 0;
  const maxes = sectionGroups(section).map(groupMax);
  if (section.kind === "exam") return round1(maxes.reduce((a, b) => a + b, 0));
  const best = [...maxes].sort((a, b) => b - a).slice(0, Math.max(1, section.bestOf));
  return round1(best.reduce((a, b) => a + b, 0));
}

export function sectionStructureValid(section: ScoreSection) {
  if (section.kind === "attendance") return Number(section.maxScore) > 0;
  if (sectionGroups(section).length === 0) return false;
  return sectionConfiguredScore(section) === Number(section.maxScore);
}

export function grandMaxScore(sections: ScoreSection[]) {
  return round1(sections.reduce((sum, s) => sum + (Number(s.maxScore) || 0), 0));
}

export function structureValid(sections: ScoreSection[]) {
  return (
    sections.length > 0 && grandMaxScore(sections) === 100 && sections.every(sectionStructureValid)
  );
}

export function grandTotal(sections: ScoreSection[], scores: Record<string, number>) {
  return round1(sections.reduce((sum, s) => sum + sectionTotal(s, scores), 0));
}

export function letterGrade(total: number, outOf = 100) {
  const pct = outOf > 0 ? (total / outOf) * 100 : 0;
  if (pct >= 80) return "A+";
  if (pct >= 75) return "A";
  if (pct >= 70) return "A-";
  if (pct >= 65) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 55) return "B-";
  if (pct >= 50) return "C+";
  if (pct >= 45) return "C";
  if (pct >= 40) return "D";
  return "F";
}

export const sectionKindLabels: Record<SectionKind, string> = {
  quiz_assignment: "Quiz and Assignment",
  attendance: "Attendance",
  exam: "Mid-Term / Final",
};
