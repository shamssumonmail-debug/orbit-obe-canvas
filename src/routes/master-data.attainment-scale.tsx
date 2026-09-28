import { createFileRoute } from "@tanstack/react-router";

import { AttainmentScaleRoute } from "@/views/pages/master-data-attainment-scale-page";

export const Route = createFileRoute("/master-data/attainment-scale")({
  head: () => ({
    meta: [
      { title: "Attainment Scale · OBE Suite master data" },
      {
        name: "description",
        content: "Maintain the default attainment scale bands that map score ranges to attainment categories.",
      },
      { property: "og:title", content: "Attainment Scale · OBE Suite master data" },
      { property: "og:description", content: "Default score-range bands used as the global attainment template." },
    ],
  }),
  component: AttainmentScaleRoute,
});
