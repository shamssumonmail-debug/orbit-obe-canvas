import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/layouts/app-shell";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { MasterDataTable } from "@/features/master-data/components/master-data-table";
import { bloomTaxonomyResource } from "@/features/master-data/services/master-data";

export const Route = createFileRoute("/master-data/bloom-taxonomy-levels")({
  head: () => ({
    meta: [
      { title: "Bloom's Taxonomy Levels · OBE Suite master data" },
      {
        name: "description",
        content:
          "Maintain cognitive, psychomotor and affective taxonomy levels used when writing measurable course outcomes.",
      },
      { property: "og:title", content: "Bloom's Taxonomy Levels · OBE Suite master data" },
      { property: "og:description", content: "Cognitive, psychomotor and affective levels for course outcome writing." },
    ],
  }),
  component: BloomTaxonomyRoute,
});

function BloomTaxonomyRoute() {
  return (
    <RequireAuth>
      <AppShell title="Bloom's Taxonomy Levels" subtitle="Master data · cognitive, psychomotor and affective levels">
        <MasterDataTable resource={bloomTaxonomyResource} />
      </AppShell>
    </RequireAuth>
  );
}
