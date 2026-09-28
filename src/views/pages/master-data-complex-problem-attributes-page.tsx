
import { AppShell } from "@/layouts/app-shell";
import { RequireAuth } from "@/views/auth/require-auth";
import { MasterDataTable } from "@/views/master-data/master-data-table";
import { complexProblemAttributesResource } from "@/models/master-data";


export function ComplexProblemAttributesRoute() {
  return (
    <RequireAuth>
      <AppShell
        title="Complex Problem / Activity Attributes"
        subtitle="Master data · CEP and CEA attribute definitions"
      >
        <MasterDataTable resource={complexProblemAttributesResource} />
      </AppShell>
    </RequireAuth>
  );
}
