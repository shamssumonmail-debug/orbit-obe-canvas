import { createFileRoute } from "@tanstack/react-router";

import { ProgramOutcomesRoute } from "@/views/pages/master-data-program-outcomes-page";

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
