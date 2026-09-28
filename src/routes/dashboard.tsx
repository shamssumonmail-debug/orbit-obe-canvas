import { createFileRoute } from "@tanstack/react-router";

import { DashboardRoute } from "@/views/pages/dashboard-page";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "OBE Dashboard · Outcome analytics overview" },
      {
        name: "description",
        content:
          "Visual dashboard of outcome based education progress: course outcome setup, CO-PO mapping backlog and PO attainment.",
      },
      { property: "og:title", content: "OBE Dashboard · Outcome analytics overview" },
      {
        property: "og:description",
        content: "Charts for course outcome setup, corrective measures, CO-PO mapping backlog and PO attainment.",
      },
    ],
  }),
  component: DashboardRoute,
});
