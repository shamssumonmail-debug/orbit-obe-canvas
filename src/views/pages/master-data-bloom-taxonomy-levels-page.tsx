
import { AppShell } from "@/layouts/app-shell";
import { RequireAuth } from "@/views/auth/require-auth";
import { MasterDataTable } from "@/views/master-data/master-data-table";
import { bloomTaxonomyResource } from "@/models/master-data";


export function BloomTaxonomyRoute() {
  return (
    <RequireAuth>
      <AppShell title="Bloom's Taxonomy Levels" subtitle="Master data · cognitive, psychomotor and affective levels">
        <MasterDataTable resource={bloomTaxonomyResource} />
      </AppShell>
    </RequireAuth>
  );
}
