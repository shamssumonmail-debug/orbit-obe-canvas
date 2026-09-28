import { createFileRoute } from "@tanstack/react-router";

import { SemesterTypesRoute } from "@/views/pages/master-data-semester-types-page";

export const Route = createFileRoute("/master-data/semester-types")({
  head: () => ({
    meta: [
      { title: "Semester Types · OBE Suite master data" },
      {
        name: "description",
        content: "Maintain the semester labels available when scheduling courses, exams and attainment cycles.",
      },
      { property: "og:title", content: "Semester Types · OBE Suite master data" },
      { property: "og:description", content: "Semester labels used across scheduling and attainment cycles." },
    ],
  }),
  component: SemesterTypesRoute,
});
