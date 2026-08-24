import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/obe/app-shell";
import { RequireAuth } from "@/components/obe/require-auth";
import { MasterDataTable } from "@/components/obe/master-data-table";
import { semesterTypesResource } from "@/lib/master-data";

export const Route = createFileRoute("/master-data/semester-types")({
  head: () => ({
    meta: [
      { title: "Semester Types · OBE Suite master data" },
      {
        name: "description",
        content: "Maintain the semester labels available when scheduling courses, exams and attainment cycles.",
      },
      { property: "og:title", content: "Semester Types · OBE Suite master data" },
      { property: "og:description", content: "Semester labels used across scheduling and attainment cycles." },
    ],
  }),
  component: SemesterTypesRoute,
});

function SemesterTypesRoute() {
  return (
    <RequireAuth>
      <AppShell title="Semester Types" subtitle="Master data · semester labels for scheduling">
        <MasterDataTable resource={semesterTypesResource} />
      </AppShell>
    </RequireAuth>
  );
}
