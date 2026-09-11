import { Input } from "@/components/ui/input";
import {
  grandMaxScore,
  grandTotal,
  groupMax,
  groupTotal,
  letterGrade,
  sectionGroups,
  sectionTotal,
  type ScoreSection,
  type StudentRow,
} from "@/lib/co-assessment";
import { cn } from "@/lib/utils";

type Props = {
  sections: ScoreSection[];
  students: StudentRow[];
  onScoreChange?: (studentId: string, leafId: string, value: number) => void;
  readOnly?: boolean;
};

const stickyId = "sticky left-0 z-20 bg-card w-[104px] min-w-[104px]";
const stickyName = "sticky left-[104px] z-20 bg-card w-[170px] min-w-[170px] border-r";

function sectionColSpan(section: ScoreSection) {
  if (section.kind === "attendance") return 1;
  const groups = sectionGroups(section);
  if (section.kind === "quiz_assignment")
    return groups.reduce((n, g) => n + g.leaves.length + 1, 0) + 1;
  return groups.reduce((n, g) => n + g.leaves.length, 0) + 1;
}

function sectionTotalTitle(section: ScoreSection) {
  if (section.kind === "quiz_assignment") return "Quiz and Assignment Total";
  return `${section.name} Total`;
}

export function ScoreEntryTable({ sections, students, onScoreChange, readOnly }: Props) {
  const totalMax = grandMaxScore(sections);

  return (
    <div className="relative overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-muted/60">
          <tr>
            <th rowSpan={3} className={cn(stickyId, "border-b p-2 text-left align-bottom")}>
              Student ID
            </th>
            <th rowSpan={3} className={cn(stickyName, "border-b p-2 text-left align-bottom")}>
              Student Name
            </th>
            {sections.map((section) =>
              section.kind === "attendance" ? (
                <th
                  key={section.id}
                  rowSpan={3}
                  className="border-b border-l p-2 text-center align-bottom"
                >
                  <span className="block font-semibold">{section.name}</span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    Score {section.maxScore}
                  </span>
                </th>
              ) : (
                <th
                  key={section.id}
                  colSpan={sectionColSpan(section)}
                  className="border-b border-l p-2 text-center"
                >
                  <span className="block font-semibold">{section.name}</span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    Score {section.maxScore}
                    {section.kind === "quiz_assignment" ? ` · best ${section.bestOf} counted` : ""}
                  </span>
                </th>
              ),
            )}
            <th rowSpan={3} className="border-b border-l bg-primary/5 p-2 text-center align-bottom">
              <span className="block">Total</span>
              <span className="block text-xs font-normal text-muted-foreground">
                Out of {totalMax}
              </span>
            </th>
            <th rowSpan={3} className="border-b bg-primary/5 p-2 text-center align-bottom">
              Letter Grade
            </th>
          </tr>
          <tr>
            {sections.flatMap((section) => {
              if (section.kind === "attendance") return [];
              const groups = sectionGroups(section);
              const withTotal = section.kind === "quiz_assignment";
              return [
                ...groups.map((group) => (
                  <th
                    key={group.id}
                    colSpan={group.leaves.length + (withTotal ? 1 : 0)}
                    className="border-b border-l p-2 text-center text-xs"
                  >
                    {group.label}{" "}
                    <span className="text-muted-foreground">({groupMax(group)})</span>
                  </th>
                )),
                <th
                  key={`${section.id}-total`}
                  rowSpan={2}
                  className="border-b border-l bg-muted p-2 text-center text-xs align-bottom"
                >
                  {sectionTotalTitle(section)}
                  <span className="block font-normal text-muted-foreground">
                    ({section.maxScore})
                  </span>
                </th>,
              ];
            })}
          </tr>
          <tr>
            {sections.flatMap((section) => {
              if (section.kind === "attendance") return [];
              const withTotal = section.kind === "quiz_assignment";
              return sectionGroups(section).flatMap((group) => [
                ...group.leaves.map((leaf) => (
                  <th key={leaf.id} className="border-b border-l p-2 text-center text-xs font-normal">
                    {leaf.label}{" "}
                    <span className="text-muted-foreground">({leaf.maxScore})</span>
                  </th>
                )),
                ...(withTotal
                  ? [
                      <th
                        key={`${group.id}-gt`}
                        className="border-b border-l bg-muted/70 p-2 text-center text-xs"
                      >
                        Total
                      </th>,
                    ]
                  : []),
              ]);
            })}
          </tr>
        </thead>
        <tbody>
          {students.map((student) => {
            const grand = grandTotal(sections, student.scores);
            return (
              <tr key={student.studentId} className="odd:bg-muted/20">
                <td className={cn(stickyId, "border-b p-2 tabular-nums")}>{student.studentId}</td>
                <td className={cn(stickyName, "border-b p-2")}>{student.studentName}</td>
                {sections.flatMap((section) => {
                  const cell = (leafId: string) => (
                    <td key={leafId} className="border-b border-l p-1 text-center">
                      {readOnly ? (
                        <span className="tabular-nums">{student.scores[leafId] ?? "—"}</span>
                      ) : (
                        <Input
                          type="number"
                          min={0}
                          className="h-8 w-16 text-center"
                          value={student.scores[leafId] ?? ""}
                          onChange={(e) =>
                            onScoreChange?.(student.studentId, leafId, Number(e.target.value) || 0)
                          }
                        />
                      )}
                    </td>
                  );
                  if (section.kind === "attendance") return [cell(section.id)];
                  const withTotal = section.kind === "quiz_assignment";
                  return [
                    ...sectionGroups(section).flatMap((group) => [
                      ...group.leaves.map((leaf) => cell(leaf.id)),
                      ...(withTotal
                        ? [
                            <td
                              key={`${group.id}-gt`}
                              className="border-b border-l bg-muted/40 p-2 text-center font-medium tabular-nums"
                            >
                              {groupTotal(group, student.scores)}
                            </td>,
                          ]
                        : []),
                    ]),
                    <td
                      key={`${section.id}-st`}
                      className="border-b border-l bg-muted/60 p-2 text-center font-semibold tabular-nums"
                    >
                      {sectionTotal(section, student.scores)}
                    </td>,
                  ];
                })}
                <td className="border-b border-l bg-primary/5 p-2 text-center font-semibold tabular-nums">
                  {grand}
                </td>
                <td className="border-b bg-primary/5 p-2 text-center font-semibold">
                  {letterGrade(grand, totalMax)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
