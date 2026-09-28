import { createFileRoute } from "@tanstack/react-router";

import { CourseOfferingDetailRoute } from "@/views/pages/course-setup-id-page";

export const Route = createFileRoute("/course-setup/$id")({
  head: () => ({
    meta: [
      { title: "Course Details Form · OBE Suite" },
      {
        name: "description",
        content:
          "Edit a course offering: basic info, course outcomes with CO-PO mapping, weekly schedule and the approval workflow.",
      },
      { property: "og:title", content: "Course Details Form · OBE Suite" },
      {
        property: "og:description",
        content: "Basic info, course outcomes, CO-PO mapping, weekly schedule and approval signatures.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CourseOfferingDetailRoute,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-10 text-sm text-destructive">
      {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-10 text-sm text-muted-foreground">Course offering not found.</div>,
});
