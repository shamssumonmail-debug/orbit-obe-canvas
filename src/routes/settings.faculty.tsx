import { createFileRoute } from "@tanstack/react-router";

import { FacultyRoute } from "@/views/pages/settings-faculty-page";

export const Route = createFileRoute("/settings/faculty")({
  head: () => ({
    meta: [
      { title: "Faculty Directory · OBE Suite settings" },
      {
        name: "description",
        content:
          "Add and maintain faculty members with their name, designation, department, room, phone and email for course details forms.",
      },
      { property: "og:title", content: "Faculty Directory · OBE Suite settings" },
      {
        property: "og:description",
        content: "Maintain faculty names, designations, departments and contact details.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FacultyRoute,
});
