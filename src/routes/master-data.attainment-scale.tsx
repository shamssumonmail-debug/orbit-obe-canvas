import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/obe/app-shell";
import { RequireAuth } from "@/components/obe/require-auth";
import { MasterDataTable } from "@/components/obe/master-data-table";
import { attainmentScaleResource } from "@/lib/master-data";

export const Route = createFileRoute("/master-data/attainment-scale")({
  head: () => ({
    meta: [
      { title: "Attainment Scale · OBE Suite master data" },
      {
        name: "description",
        content: "Maintain the default attainment scale bands that map score ranges to attainment categories.",
      },
      { property: "og:title", content: "Attainment Scale · OBE Suite master data" },
      { property: "og:description", content: "Default score-range bands used as the global attainment template." },
    ],
  }),
  component: AttainmentScaleRoute,
});

function AttainmentScaleRoute() {
  return (
    <RequireAuth>
      <AppShell title="Attainment Scale" subtitle="Master data · global fallback scale bands">
        <MasterDataTable resource={attainmentScaleResource} />
      </AppShell>
    </RequireAuth>
  );
}
