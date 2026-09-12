import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/obe/app-shell";
import { RequireAuth } from "@/components/obe/require-auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type AssessmentStatus } from "@/lib/co-assessment";
import { deleteAssessment, useAssessments } from "@/lib/co-assessment-store";

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
  const navigate = useNavigate();
  const assessments = useAssessments();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  return (
    <RequireAuth>
      <AppShell title="CO Assessment" subtitle="Custom score structures and live achievement calculation">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle>CO Assessments</CardTitle>
              <CardDescription>
                Everything you save or create shows up here, kept on this device.
              </CardDescription>
            </div>
            <Button asChild>
              <Link to="/assessment/co-assessment/new" search={{ id: undefined, step: undefined }}>
                <Plus className="mr-1 h-4 w-4" /> Add CO Assessment
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {assessments.length === 0 ? (
              <div className="rounded-lg border border-dashed p-10 text-center">
                <p className="text-sm font-medium">No CO assessments yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use “Add CO Assessment” to configure your first score structure.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead className="text-right">Sections</TableHead>
                    <TableHead className="text-right">Students</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.batchLabel}</TableCell>
                      <TableCell>{row.levelLabel}</TableCell>
                      <TableCell>{row.courseLabel}</TableCell>
                      <TableCell>{row.semesterLabel}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.sections.length}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.students.length}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[row.status]}>{row.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Actions">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                navigate({
                                  to: "/assessment/co-assessment/new",
                                  search: { id: row.id, step: 2 },
                                })
                              }
                            >
                              <Eye className="mr-2 h-4 w-4" /> Preview scores
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                navigate({
                                  to: "/assessment/co-assessment/new",
                                  search: { id: row.id, step: 0 },
                                })
                              }
                            >
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setPendingDelete(row.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this CO assessment?</AlertDialogTitle>
              <AlertDialogDescription>
                The structure and all entered scores for it will be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (pendingDelete) deleteAssessment(pendingDelete);
                  setPendingDelete(null);
                  toast.success("CO assessment deleted");
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AppShell>
    </RequireAuth>
  );
}
