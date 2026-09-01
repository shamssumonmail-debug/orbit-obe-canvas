// CO Assessment — pure frontend module. Mock data + local state shapes only.
// No backend calls: this is wired to real data in a later phase.

export type ScoreItemPart = {
  id: string;
  label: string;
  maxScore: number;
};

export type ScoreItem = {
  id: string;
  label: string;
  maxScore: number;
  sourceCO?: string;
  sourceRef?: string;
  parts: ScoreItemPart[];
};

export type SectionSource = "manual" | "quiz" | "final";

export type ScoreSection = {
  id: string;
  name: string;
  maxScore: number;
  /** Where this section's columns come from: entered manually, from quizzes, or final-exam questions. */
  source: SectionSource;
  items: ScoreItem[];
};

export type StudentRow = {
  studentId: string;
  studentName: string;
  scores: Record<string, number>;
};

export type CoAssessment = {
  id: string;
  batchLabel: string;
  levelLabel: string;
  courseLabel?: string;
  sectionLabel?: string;
  sections: ScoreSection[];
  students: StudentRow[];
};

export type AssessmentStatus = "Structure Configured" | "Scoring In Progress" | "Complete";

let counter = 0;
export function uid(prefix: string) {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

/* ---------------------------------- mocks --------------------------------- */

export const batchOptions = ["Batch 2021", "Batch 2022", "Batch 2023"];
export const levelOptions = ["Level 1 - Term 1", "Level 2 - Term 2", "Level 3 - Term 1", "Level 4 - Term 2"];
export const courseOptions = ["CSE 3103 - Database Systems", "CSE 3211 - Operating Systems", "EEE 2101 - Electrical Circuits"];
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
  finals: MockGroup[];
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
        questions: [{ id: "co1-q2-1", label: "Question 1", maxScore: 10 }],
      },
    ],
    finals: [
      {
        id: "co1-f1",
        label: "Final Exam — Section A",
        maxScore: 30,
        questions: [
          {
            id: "co1-f1-q1",
            label: "Question 1",
            maxScore: 12,
            parts: [
              { label: "a", maxScore: 4 },
              { label: "b", maxScore: 4 },
              { label: "c", maxScore: 4 },
            ],
          },
          { id: "co1-f1-q2", label: "Question 2", maxScore: 8 },
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
    finals: [
      {
        id: "co2-f1",
        label: "Final Exam — Section B",
        maxScore: 30,
        questions: [
          {
            id: "co2-f1-q1",
            label: "Question 3",
            maxScore: 15,
            parts: [
              { label: "a", maxScore: 7 },
              { label: "b", maxScore: 8 },
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
        questions: [{ id: "co3-q1-1", label: "Question 1", maxScore: 10 }],
      },
    ],
    finals: [
      {
        id: "co3-f1",
        label: "Final Exam — Section C",
        maxScore: 20,
        questions: [
          { id: "co3-f1-q1", label: "Question 5", maxScore: 10 },
          {
            id: "co3-f1-q2",
            label: "Question 6",
            maxScore: 10,
            parts: [
              { label: "a", maxScore: 5 },
              { label: "b", maxScore: 5 },
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
    sectionCount: 4,
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

export function leafIdsForSection(section: ScoreSection): string[] {
  if (section.items.length === 0) return [section.id];
  return section.items.flatMap((item) =>
    item.parts.length === 0 ? [item.id] : item.parts.map((p) => p.id),
  );
}

export function sectionTotal(section: ScoreSection, scores: Record<string, number>) {
  return leafIdsForSection(section).reduce((sum, id) => sum + (Number(scores[id]) || 0), 0);
}

export function itemsTotal(section: ScoreSection) {
  return section.items.reduce((sum, item) => sum + (Number(item.maxScore) || 0), 0);
}

export function partsTotal(item: ScoreItem) {
  return item.parts.reduce((sum, part) => sum + (Number(part.maxScore) || 0), 0);
}

export function sectionStructureValid(section: ScoreSection) {
  if (section.items.length > 0 && itemsTotal(section) !== Number(section.maxScore)) return false;
  return section.items.every(
    (item) => item.parts.length === 0 || partsTotal(item) === Number(item.maxScore),
  );
}

export function structureValid(sections: ScoreSection[]) {
  return sections.length > 0 && sections.every(sectionStructureValid);
}

export function grandMaxScore(sections: ScoreSection[]) {
  return sections.reduce((sum, s) => sum + (Number(s.maxScore) || 0), 0);
}

/** Achievement score for a section = obtained / max, expressed out of 100 (1 decimal). */
export function achievementScore(obtained: number, max: number) {
  if (!max) return 0;
  return Math.round((obtained / max) * 1000) / 10;
}

/** Remaining score still to be distributed across a section's items. */
export function remainingForSection(section: ScoreSection) {
  return Math.round((Number(section.maxScore) || 0) - itemsTotal(section) * 10) / 10 || (Number(section.maxScore) || 0) - itemsTotal(section);
}

export const sourceLabels: Record<SectionSource, string> = {
  manual: "Manual (single score column)",
  quiz: "From Quiz (CO -> Quiz -> Questions)",
  final: "From Final Exam (CO -> Exam -> Questions)",
};

/** Label for the add button, e.g. "Add Quiz 1" / "Add Question 2". */
export function addButtonLabel(section: ScoreSection) {
  const noun = section.source === "final" ? "Question" : section.name.trim() || "Item";
  return `Add ${noun} ${section.items.length + 1}`;
}
