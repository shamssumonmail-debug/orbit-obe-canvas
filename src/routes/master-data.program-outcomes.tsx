import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { AppShell } from "@/components/obe/app-shell";
import { Badge } from "@/components/ui/badge";
import { RequireAuth } from "@/components/obe/require-auth";
import { MasterDataTable } from "@/components/obe/master-data-table";
import { supabase } from "@/integrations/supabase/client";
import { programOutcomesResource } from "@/lib/master-data";

export const Route = createFileRoute("/master-data/program-outcomes")({
  head: () => ({
    meta: [
      { title: "Program Outcomes · OBE Suite master data" },
      {
        name: "description",
        content: "Maintain the institution-wide list of program outcomes (PO) and program-specific outcomes (PSO).",
      },
      { property: "og:title", content: "Program Outcomes · OBE Suite master data" },
      { property: "og:description", content: "Reference list of PO and PSO codes used across the outcome framework." },
    ],
  }),
  component: ProgramOutcomesRoute,
});

function ProgramOutcomesRoute() {
  return (
    <RequireAuth>
      <AppShell title="Program Outcomes" subtitle="Master data · reference list of PO / PSO codes">
        <MasterDataTable resource={programOutcomesResource} />
      </AppShell>
    </RequireAuth>
  );
}
