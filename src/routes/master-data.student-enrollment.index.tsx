import { createFileRoute } from "@tanstack/react-router";

import { StudentEnrollmentRoute } from "@/views/pages/master-data-student-enrollment-page";

export const Route = createFileRoute("/master-data/student-enrollment/")({
  head: () => ({
    meta: [
      { title: "Student Enrollment · OBE Suite master data" },
      {
        name: "description",
        content:
          "Enroll students batch by batch: add them manually or upload a CSV / Excel list per department.",
      },
      { property: "og:title", content: "Student Enrollment · OBE Suite master data" },
      {
        property: "og:description",
        content: "Department and batch wise student lists used for CO assessment score entry.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudentEnrollmentRoute,
});
