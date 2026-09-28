import { createFileRoute } from "@tanstack/react-router";

import { SettingsRoute } from "@/views/pages/settings-institution-page";

export const Route = createFileRoute("/settings/institution")({
  head: () => ({
    meta: [
      { title: "Institution Profile · OBE Suite settings" },
      {
        name: "description",
        content:
          "Manage institution identity, logo, sponsorship line, accreditation details, academic session and attainment calculation preferences.",
      },
      { property: "og:title", content: "Institution Profile · OBE Suite settings" },
      {
        property: "og:description",
        content: "Institution identity, logo, accreditation, academic session and attainment configuration.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsRoute,
});
