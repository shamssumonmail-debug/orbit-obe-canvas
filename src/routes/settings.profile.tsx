import { createFileRoute } from "@tanstack/react-router";

import { ProfileRoute } from "@/views/pages/settings-profile-page";

export const Route = createFileRoute("/settings/profile")({
  head: () => ({
    meta: [
      { title: "My Profile · OBE Suite settings" },
      {
        name: "description",
        content: "Update your display name, designation, room number and phone used across OBE Suite documents.",
      },
      { property: "og:title", content: "My Profile · OBE Suite settings" },
      {
        property: "og:description",
        content: "Update your display name, designation, room number and contact details.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfileRoute,
});
