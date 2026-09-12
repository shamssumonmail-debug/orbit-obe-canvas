import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  bandColor,
  bandFor,
  computeCoAttainment,
  useAttainmentBands,
  type CoAttainment,
} from "@/lib/co-attainment";
import type { ScoreSection, StudentRow } from "@/lib/co-assessment";

type Props = {
  sections: ScoreSection[];
  students: StudentRow[];
  targetPercent?: number;
};

export function CoAttainmentReport({ sections, students, targetPercent = 60 }: Props) {
  const bands = useAttainmentBands();
  const stats = computeCoAttainment(sections, students, targetPercent);

  if (stats.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Map quiz, assignment or exam questions to course outcomes to see the CO attainment report.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {bands.map((band) => (
          <span key={band.scale_value} className="flex items-center gap-1.5 text-xs">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ background: bandColor(band.scale_value) }}
            />
            {band.category_label} ({band.min_score}–{band.max_score}%)
          </span>
        ))}
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
            <XAxis dataKey="co" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} unit="%" />
            <Tooltip
              formatter={(value: number) => [`${value}%`, "Attainment"]}
              labelFormatter={(label: string) =>
                stats.find((s) => s.co === label)?.label ?? label
              }
            />
            <Bar dataKey="attainmentPercent" radius={[6, 6, 0, 0]} maxBarSize={72}>
              <LabelList dataKey="attainmentPercent" position="top" fontSize={11} formatter={(v: number) => `${v}%`} />
              {stats.map((stat) => (
                <Cell
                  key={stat.co}
                  fill={bandColor(bandFor(bands, stat.attainmentPercent).scale_value)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Course Outcome</TableHead>
            <TableHead className="text-right">Marks mapped</TableHead>
            <TableHead className="text-right">Class average</TableHead>
            <TableHead className="text-right">Students ≥ {targetPercent}%</TableHead>
            <TableHead className="text-right">Attainment</TableHead>
            <TableHead>Level</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stats.map((stat: CoAttainment) => {
            const band = bandFor(bands, stat.attainmentPercent);
            return (
              <TableRow key={stat.co}>
                <TableCell className="font-medium">{stat.label}</TableCell>
                <TableCell className="text-right tabular-nums">{stat.maxScore}</TableCell>
                <TableCell className="text-right tabular-nums">{stat.avgPercent}%</TableCell>
                <TableCell className="text-right tabular-nums">
                  {stat.studentsMeeting} / {stat.totalStudents}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {stat.attainmentPercent}%
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: bandColor(band.scale_value),
                      color: bandColor(band.scale_value),
                    }}
                  >
                    {band.scale_value} · {band.category_label}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
