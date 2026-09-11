import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { AppShell } from "@/components/obe/app-shell";
import { RequireAuth } from "@/components/obe/require-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockAssessments, type AssessmentStatus } from "@/lib/co-assessment";

export const Route = createFileRoute("/assessment/co-assessment/")({
  head: () => ({
    meta: [
      { title: "CO Assessment · OBE Suite" },
      {
        name: "description",
        content:
          "Configure custom scoring structures and enter per-student CO assessment scores with live totals.",
      },
      { property: "og:title", content: "CO Assessment · OBE Suite" },
      {
        property: "og:description",
        content: "Custom score structures and live CO achievement calculation for faculty.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CoAssessmentListRoute,
});

const statusVariant: Record<AssessmentStatus, "default" | "secondary" | "outline"> = {
  Complete: "default",
  "Scoring In Progress": "secondary",
  "Structure Configured": "outline",
  Draft: "outline",
};

function CoAssessmentListRoute() {
  return (
    <RequireAuth>
      <AppShell title="CO Assessment" subtitle="Custom score structures and live achievement calculation">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle>CO Assessments</CardTitle>
              <CardDescription>
                Frontend preview using mock data — nothing is saved yet.
              </CardDescription>
            </div>
            <Button asChild>
              <Link to="/assessment/co-assessment/new">
                <Plus className="mr-1 h-4 w-4" /> Add CO Assessment
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead className="text-right">Sections</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAssessments.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.batchLabel}</TableCell>
                    <TableCell>{row.levelLabel}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.sectionCount}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.studentCount}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[row.status]}>{row.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </AppShell>
    </RequireAuth>
  );
}
