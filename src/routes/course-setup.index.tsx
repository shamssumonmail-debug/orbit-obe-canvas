import { createFileRoute } from "@tanstack/react-router";

import { CourseSetupListRoute } from "@/views/pages/course-setup-page";

export const Route = createFileRoute("/course-setup/")({
  head: () => ({
    meta: [
      { title: "Course Setup & CO-PO Mapping · OBE Suite" },
      {
        name: "description",
        content:
          "Create course offerings, define course outcomes with PO, knowledge profile and attribute mapping, and track the approval workflow.",
      },
      { property: "og:title", content: "Course Setup & CO-PO Mapping · OBE Suite" },
      {
        property: "og:description",
        content: "Course offerings, course outcomes, CO-PO mapping and the course details approval workflow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CourseSetupListRoute,
});
