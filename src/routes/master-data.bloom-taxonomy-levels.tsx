import { createFileRoute } from "@tanstack/react-router";

import { BloomTaxonomyRoute } from "@/views/pages/master-data-bloom-taxonomy-levels-page";

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
