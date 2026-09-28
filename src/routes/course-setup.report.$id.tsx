import { createFileRoute } from "@tanstack/react-router";

import { ReportRoute } from "@/views/pages/course-setup-report-id-page";

export const Route = createFileRoute("/course-setup/report/$id")({
  head: () => ({
    meta: [
      { title: "Course Details Form · Approved report" },
      {
        name: "description",
        content:
          "Printable Course Details Form: synopsis, CO-PO mapping, PO indicators, knowledge profiles, CEP attributes, week-wise plan, references and signatures.",
      },
      { property: "og:title", content: "Course Details Form · Approved report" },
      {
        property: "og:description",
        content: "Printable, signed Course Details Form generated from the approved course offering.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportRoute,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-10 text-sm text-destructive">
      {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-10 text-sm text-muted-foreground">Course offering not found.</div>,
});
