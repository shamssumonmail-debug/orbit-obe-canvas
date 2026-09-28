
import { AppShell } from "@/layouts/app-shell";
import { RequireAuth } from "@/views/auth/require-auth";
import { MasterDataTable } from "@/views/master-data/master-data-table";
import { semesterTypesResource } from "@/models/master-data";


export function SemesterTypesRoute() {
  return (
    <RequireAuth>
      <AppShell title="Semester Types" subtitle="Master data · semester labels for scheduling">
        <MasterDataTable resource={semesterTypesResource} />
      </AppShell>
    </RequireAuth>
  );
}
