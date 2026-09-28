
import { AppShell } from "@/layouts/app-shell";
import { RequireAuth } from "@/views/auth/require-auth";
import { MasterDataTable } from "@/views/master-data/master-data-table";
import { knowledgeProfilesResource } from "@/models/master-data";


export function KnowledgeProfilesRoute() {
  return (
    <RequireAuth>
      <AppShell title="Knowledge Profiles" subtitle="Master data · knowledge profile descriptors (K1–K8)">
        <MasterDataTable resource={knowledgeProfilesResource} />
      </AppShell>
    </RequireAuth>
  );
}
