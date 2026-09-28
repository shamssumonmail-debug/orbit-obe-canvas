import { createFileRoute } from "@tanstack/react-router";

import { CoAssessmentListRoute } from "@/views/pages/assessment-co-assessment-page";

export const Route = createFileRoute("/assessment/co-assessment/")({
  head: () => ({
    meta: [
      { title: "CO Assessment · OBE Suite" },
      {
        name: "description",
        content:
          "Configure custom scoring structures and enter per-student CO assessment scores with live totals.",
      },
      { property: "og:title", content: "CO Assessment · OBE Suite" },
      {
        property: "og:description",
        content: "Custom score structures and live CO achievement calculation for faculty.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CoAssessmentListRoute,
});
