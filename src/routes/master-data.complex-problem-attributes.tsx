import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/layouts/app-shell";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { MasterDataTable } from "@/features/master-data/components/master-data-table";
import { complexProblemAttributesResource } from "@/features/master-data/services/master-data";

export const Route = createFileRoute("/master-data/complex-problem-attributes")({
  head: () => ({
    meta: [
      { title: "Complex Problem & Activity Attributes · OBE Suite master data" },
      {
        name: "description",
        content:
          "Maintain Complex Engineering Problem (CEP) and Complex Engineering Activity (CEA) attribute definitions.",
      },
      { property: "og:title", content: "Complex Problem & Activity Attributes · OBE Suite master data" },
      { property: "og:description", content: "CEP and CEA attribute definitions used in outcome design." },
    ],
  }),
  component: ComplexProblemAttributesRoute,
});

function ComplexProblemAttributesRoute() {
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
