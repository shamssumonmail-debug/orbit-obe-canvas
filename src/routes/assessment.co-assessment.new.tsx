import { createFileRoute } from "@tanstack/react-router";

import { NewCoAssessmentRoute } from "@/views/pages/assessment-co-assessment-new-page";

export const Route = createFileRoute("/assessment/co-assessment/new")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search["id"] === "string" ? (search["id"] as string) : undefined,
    step: typeof search["step"] === "number" ? (search["step"] as number) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "New CO Assessment · OBE Suite" },
      {
        name: "description",
        content:
          "Three-step wizard to configure a CO assessment, map quiz, assignment and exam questions, and enter scores.",
      },
      { property: "og:title", content: "New CO Assessment · OBE Suite" },
      {
        property: "og:description",
        content: "Configure, structure and score a CO assessment in one guided flow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewCoAssessmentRoute,
});
