import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AppShell } from "@/components/obe/app-shell";
import { RequireAuth } from "@/components/obe/require-auth";
import { CoAttainmentReport } from "@/components/obe/co-assessment/co-attainment-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  bandColor,
  bandFor,
  computeCoAttainment,
  computePoAttainment,
  useAttainmentBands,
} from "@/lib/co-attainment";
import { useAssessments } from "@/lib/co-assessment-store";

export const Route = createFileRoute("/reports/attainment")({
  head: () => ({
    meta: [
      { title: "Batch-wise Attainment Report · OBE Suite" },
      {
        name: "description",
        content:
          "Batch and course wise CO and PO attainment reports, graded against the institution attainment scale.",
      },
      { property: "og:title", content: "Batch-wise Attainment Report · OBE Suite" },
      {
        property: "og:description",
        content: "CO and PO attainment per batch and course, colour coded by attainment level.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AttainmentReportRoute,
});

function AttainmentReportRoute() {
  const assessments = useAssessments();
  const bands = useAttainmentBands();
  const [selectedId, setSelectedId] = useState("");

  const selected = assessments.find((a) => a.id === selectedId) ?? assessments[0];
  const coStats = selected ? computeCoAttainment(selected.sections, selected.students) : [];
  const poStats = computePoAttainment(coStats);

  return (
    <RequireAuth>
      <AppShell
        title="Batch-wise Attainment Report"
        subtitle="CO and PO attainment per batch and course"
      >
        {!selected ? (
          <Card>
            <CardContent className="p-10 text-center">
              <p className="text-sm font-medium">No assessment data yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a CO assessment and enter marks to see attainment reports here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select a batch &amp; course</CardTitle>
                <CardDescription>
                  Each course keeps its own attainment report, based on the marks entered for it.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-end gap-3">
                <div className="space-y-2">
                  <Label htmlFor="assessment-picker">Batch · Course</Label>
                  <Select value={selected.id} onValueChange={setSelectedId}>
                    <SelectTrigger id="assessment-picker" className="w-[420px] max-w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {assessments.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.batchLabel} · {a.courseLabel} · {a.semesterLabel || "—"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Badge variant="secondary">{selected.status}</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>CO Attainment</CardTitle>
                <CardDescription>
                  {selected.courseLabel} · {selected.batchLabel} · {selected.students.length} students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CoAttainmentReport sections={selected.sections} students={selected.students} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>PO Attainment</CardTitle>
                <CardDescription>
                  Rolled up from the course outcomes mapped to each program outcome.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {poStats.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Map course outcomes to questions to see program outcome attainment.
                  </p>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={poStats} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
                        <XAxis dataKey="po" tickLine={false} axisLine={false} fontSize={12} />
                        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} unit="%" />
                        <Tooltip formatter={(value: number) => [`${value}%`, "Attainment"]} />
                        <Bar dataKey="attainmentPercent" radius={[6, 6, 0, 0]} maxBarSize={64}>
                          <LabelList
                            dataKey="attainmentPercent"
                            position="top"
                            fontSize={11}
                            formatter={(v: number) => `${v}%`}
                          />
                          {poStats.map((stat) => (
                            <Cell
                              key={stat.po}
                              fill={bandColor(bandFor(bands, stat.attainmentPercent).scale_value)}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </AppShell>
    </RequireAuth>
  );
}
