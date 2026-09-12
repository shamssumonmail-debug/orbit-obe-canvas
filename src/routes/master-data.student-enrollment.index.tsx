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
import { deleteBatch, useEnrollmentBatches } from "@/lib/enrollment-store";

export const Route = createFileRoute("/master-data/student-enrollment/")({
  head: () => ({
    meta: [
      { title: "Student Enrollment · OBE Suite master data" },
      {
        name: "description",
        content:
          "Enroll students batch by batch: add them manually or upload a CSV / Excel list per department.",
      },
      { property: "og:title", content: "Student Enrollment · OBE Suite master data" },
      {
        property: "og:description",
        content: "Department and batch wise student lists used for CO assessment score entry.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudentEnrollmentRoute,
});

function StudentEnrollmentRoute() {
  const navigate = useNavigate();
  const batches = useEnrollmentBatches();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  return (
    <RequireAuth>
      <AppShell title="Student Enrollment" subtitle="Department and batch wise student lists">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle>Enrolled Batches</CardTitle>
              <CardDescription>Each batch name is unique across the institution.</CardDescription>
            </div>
            <Button asChild>
              <Link to="/master-data/student-enrollment/$id" params={{ id: "new" }} search={{ view: undefined }}>
                <Plus className="mr-1 h-4 w-4" /> Add Batch
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {batches.length === 0 ? (
              <div className="rounded-lg border border-dashed p-10 text-center">
                <p className="text-sm font-medium">No batches enrolled yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use “Add Batch” to create your first student list.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Programme</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead className="text-right">Students</TableHead>
                    <TableHead className="text-right">Active</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">{batch.batchName}</TableCell>
                      <TableCell>{batch.departmentLabel}</TableCell>
                      <TableCell>{batch.programme || "—"}</TableCell>
                      <TableCell>{batch.semesterLabel || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{batch.students.length}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {batch.students.filter((s) => s.active).length}
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
                                  to: "/master-data/student-enrollment/$id",
                                  params: { id: batch.id },
                                  search: { view: true },
                                })
                              }
                            >
                              <Eye className="mr-2 h-4 w-4" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                navigate({
                                  to: "/master-data/student-enrollment/$id",
                                  params: { id: batch.id },
                                  search: { view: undefined },
                                })
                              }
                            >
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setPendingDelete(batch.id)}
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

        <AlertDialog
          open={pendingDelete !== null}
          onOpenChange={(open) => !open && setPendingDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this batch?</AlertDialogTitle>
              <AlertDialogDescription>
                The batch and its student list will be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (pendingDelete) deleteBatch(pendingDelete);
                  setPendingDelete(null);
                  toast.success("Batch deleted");
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
