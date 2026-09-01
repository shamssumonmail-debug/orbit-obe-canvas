import { Input } from "@/components/ui/input";
import {
  grandMaxScore,
  leafIdsForSection,
  sectionTotal,
  type ScoreSection,
  type StudentRow,
} from "@/lib/co-assessment";
import { cn } from "@/lib/utils";

type Props = {
  sections: ScoreSection[];
  students: StudentRow[];
  onScoreChange: (studentId: string, leafId: string, value: number) => void;
};

const stickyId = "sticky left-0 z-20 bg-card w-[110px] min-w-[110px]";
const stickyName = "sticky left-[110px] z-20 bg-card w-[180px] min-w-[180px] border-r";

export function ScoreEntryTable({ sections, students, onScoreChange }: Props) {
  const hasParts = sections.some((s) => s.items.some((i) => i.parts.length > 0));
  const totalMax = grandMaxScore(sections);

  return (
    <div className="relative overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-muted/60">
          <tr>
            <th rowSpan={hasParts ? 3 : 2} className={cn(stickyId, "border-b p-2 text-left align-bottom")}>
              Student ID
            </th>
            <th rowSpan={hasParts ? 3 : 2} className={cn(stickyName, "border-b p-2 text-left align-bottom")}>
              Student Name
            </th>
            {sections.map((section) => (
              <th
                key={section.id}
                colSpan={leafIdsForSection(section).length + 2}
                className="border-b border-l p-2 text-center"
              >
                {section.name || "Untitled section"}{" "}
                <span className="text-xs font-normal text-muted-foreground">({section.maxScore})</span>
              </th>
            ))}
            <th rowSpan={hasParts ? 3 : 2} className="border-b border-l p-2 text-center align-bottom">
              Total Achievement Number
            </th>
            <th rowSpan={hasParts ? 3 : 2} className="border-b p-2 text-center align-bottom">
              Achievement Percentage
            </th>
          </tr>
          <tr>
            {sections.flatMap((section) => {
              if (section.items.length === 0) {
                return [
                  <th key={section.id} rowSpan={hasParts ? 2 : 1} className="border-b border-l p-2 text-center text-xs">
                    Score
                  </th>,
                ];
              }
              return section.items.map((item) => (
                <th
                  key={item.id}
                  colSpan={item.parts.length === 0 ? 1 : item.parts.length}
                  rowSpan={hasParts && item.parts.length === 0 ? 2 : 1}
                  className="border-b border-l p-2 text-center text-xs"
                >
                  {item.label} <span className="text-muted-foreground">({item.maxScore})</span>
                </th>
              ));
            })}
            {sections.map((section) => [
              <th
                key={`${section.id}-t`}
                rowSpan={hasParts ? 2 : 1}
                className="border-b border-l bg-muted p-2 text-center text-xs"
              >
                Total
              </th>,
              <th
                key={`${section.id}-a`}
                rowSpan={hasParts ? 2 : 1}
                className="border-b bg-muted p-2 text-center text-xs"
              >
                Achievement
              </th>,
            ])}
          </tr>
          {hasParts ? (
            <tr>
              {sections.flatMap((section) =>
                section.items.flatMap((item) =>
                  item.parts.map((part) => (
                    <th key={part.id} className="border-b border-l p-2 text-center text-xs">
                      {part.label} <span className="text-muted-foreground">({part.maxScore})</span>
                    </th>
                  )),
                ),
              )}
            </tr>
          ) : null}
        </thead>
        <tbody>
          {students.map((student) => {
            const totals = sections.map((section) => sectionTotal(section, student.scores));
            const grand = totals.reduce((a, b) => a + b, 0);
            const percentage = totalMax > 0 ? Math.round((grand / totalMax) * 1000) / 10 : 0;
            return (
              <tr key={student.studentId} className="odd:bg-muted/20">
                <td className={cn(stickyId, "border-b p-2 tabular-nums odd:bg-card")}>{student.studentId}</td>
                <td className={cn(stickyName, "border-b p-2")}>{student.studentName}</td>
                {sections.flatMap((section, index) => [
                  ...leafIdsForSection(section).map((leafId) => (
                    <td key={leafId} className="border-b border-l p-1 text-center">
                      <Input
                        type="number"
                        min={0}
                        className="h-8 w-16 text-center"
                        value={student.scores[leafId] ?? ""}
                        onChange={(e) =>
                          onScoreChange(student.studentId, leafId, Number(e.target.value) || 0)
                        }
                      />
                    </td>
                  )),
                  <td
                    key={`${section.id}-total`}
                    className="border-b border-l bg-muted/40 p-2 text-center font-medium tabular-nums"
                  >
                    {totals[index]}
                  </td>,
                  <td
                    key={`${section.id}-ach`}
                    className="border-b bg-muted/40 p-2 text-center font-medium tabular-nums"
                  >
                    {/* TODO: confirm Achievement Score formula with domain lead before backend build */}
                    {totals[index]}
                  </td>,
                ])}
                <td className="border-b border-l bg-primary/5 p-2 text-center font-semibold tabular-nums">
                  {grand}
                </td>
                <td className="border-b bg-primary/5 p-2 text-center font-semibold tabular-nums">
                  {percentage}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
