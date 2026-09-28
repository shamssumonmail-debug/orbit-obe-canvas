import { createFileRoute } from "@tanstack/react-router";

import { LoginPage } from "@/views/pages/sign-in-page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in · OBE Suite — Outcome Based Education Platform" },
      {
        name: "description",
        content:
          "Sign in to OBE Suite, an outcome based education platform for PO/CO mapping, attainment analytics and accreditation readiness.",
      },
      { property: "og:title", content: "Sign in · OBE Suite" },
      {
        property: "og:description",
        content: "Outcome Based Education platform for program outcomes, course outcomes and attainment analytics.",
      },
    ],
  }),
  component: LoginPage,
});
