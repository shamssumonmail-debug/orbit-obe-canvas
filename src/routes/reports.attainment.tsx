import { createFileRoute } from "@tanstack/react-router";

import { AttainmentReportRoute } from "@/views/pages/reports-attainment-page";

export const Route = createFileRoute("/reports/attainment")({
  head: () => ({
    meta: [
      { title: "Batch-wise Attainment Report · OBE Suite" },
      {
        name: "description",
        content:
          "Batch and course wise CO and PO attainment reports, graded against the institution attainment scale.",
      },
      { property: "og:title", content: "Batch-wise Attainment Report · OBE Suite" },
      {
        property: "og:description",
        content: "CO and PO attainment per batch and course, colour coded by attainment level.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AttainmentReportRoute,
});
