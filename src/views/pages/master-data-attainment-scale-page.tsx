
import { AppShell } from "@/layouts/app-shell";
import { RequireAuth } from "@/views/auth/require-auth";
import { MasterDataTable } from "@/views/master-data/master-data-table";
import { attainmentScaleResource } from "@/models/master-data";


export function AttainmentScaleRoute() {
  return (
    <RequireAuth>
      <AppShell title="Attainment Scale" subtitle="Master data · global fallback scale bands">
        <MasterDataTable resource={attainmentScaleResource} />
      </AppShell>
    </RequireAuth>
  );
}
