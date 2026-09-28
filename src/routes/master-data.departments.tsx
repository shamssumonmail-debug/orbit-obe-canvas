import { createFileRoute } from "@tanstack/react-router";

import { DepartmentsRoute } from "@/views/pages/master-data-departments-page";

export const Route = createFileRoute("/master-data/departments")({
  head: () => ({
    meta: [
      { title: "Departments & Curriculum Courses · OBE Suite master data" },
      {
        name: "description",
        content:
          "Maintain academic departments and the department-wise curriculum course catalogue used for course outcomes.",
      },
      { property: "og:title", content: "Departments & Curriculum Courses · OBE Suite master data" },
      { property: "og:description", content: "Departments and their curriculum course catalogue." },
    ],
  }),
  component: DepartmentsRoute,
});
