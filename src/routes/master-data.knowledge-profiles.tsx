import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/obe/app-shell";
import { RequireAuth } from "@/components/obe/require-auth";
import { MasterDataTable } from "@/components/obe/master-data-table";
import { knowledgeProfilesResource } from "@/lib/master-data";

export const Route = createFileRoute("/master-data/knowledge-profiles")({
  head: () => ({
    meta: [
      { title: "Knowledge Profiles · OBE Suite master data" },
      {
        name: "description",
        content: "Maintain the K1–K8 knowledge profile descriptors used when classifying course outcomes.",
      },
      { property: "og:title", content: "Knowledge Profiles · OBE Suite master data" },
      { property: "og:description", content: "Knowledge profile descriptors K1 to K8 for outcome classification." },
    ],
  }),
  component: KnowledgeProfilesRoute,
});

function KnowledgeProfilesRoute() {
  return (
    <RequireAuth>
      <AppShell title="Knowledge Profiles" subtitle="Master data · knowledge profile descriptors (K1–K8)">
        <MasterDataTable resource={knowledgeProfilesResource} />
      </AppShell>
    </RequireAuth>
  );
}
