import { createFileRoute } from "@tanstack/react-router";

import { ComplexProblemAttributesRoute } from "@/views/pages/master-data-complex-problem-attributes-page";

export const Route = createFileRoute("/master-data/complex-problem-attributes")({
  head: () => ({
    meta: [
      { title: "Complex Problem & Activity Attributes · OBE Suite master data" },
      {
        name: "description",
        content:
          "Maintain Complex Engineering Problem (CEP) and Complex Engineering Activity (CEA) attribute definitions.",
      },
      { property: "og:title", content: "Complex Problem & Activity Attributes · OBE Suite master data" },
      { property: "og:description", content: "CEP and CEA attribute definitions used in outcome design." },
    ],
  }),
  component: ComplexProblemAttributesRoute,
});
