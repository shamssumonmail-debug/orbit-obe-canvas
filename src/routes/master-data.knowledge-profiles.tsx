import { createFileRoute } from "@tanstack/react-router";

import { KnowledgeProfilesRoute } from "@/views/pages/master-data-knowledge-profiles-page";

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
