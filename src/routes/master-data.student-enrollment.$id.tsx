import { createFileRoute } from "@tanstack/react-router";

import { BatchRoute } from "@/views/pages/master-data-student-enrollment-id-page";

export const Route = createFileRoute("/master-data/student-enrollment/$id")({
  validateSearch: (search: Record<string, unknown>) => ({
    view: search["view"] === true || search["view"] === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Batch Students · OBE Suite student enrollment" },
      {
        name: "description",
        content:
          "Add students to a batch manually or by uploading a CSV / Excel list, and activate or remove them.",
      },
      { property: "og:title", content: "Batch Students · OBE Suite student enrollment" },
      {
        property: "og:description",
        content: "Manual and spreadsheet based student enrollment for a single batch.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BatchRoute,
});
