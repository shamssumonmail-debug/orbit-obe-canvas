import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/obe/app-shell";
import { RequireAuth } from "@/components/obe/require-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMyProfile, useSaveMyProfile } from "@/lib/profile";

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

function ProfileRoute() {
  return (
    <RequireAuth>
      <ProfileSettings />
    </RequireAuth>
  );
}

function ProfileSettings() {
  const { data: profile, isLoading } = useMyProfile();
  const save = useSaveMyProfile();
  const [form, setForm] = useState({ full_name: "", phone: "", designation: "", room_no: "" });

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      designation: profile.designation ?? "",
      room_no: profile.room_no ?? "",
    });
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      await save.mutateAsync({ id: profile.id, ...form });
      toast.success("Profile updated");
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? "Could not update profile");
    }
  };

  return (
    <AppShell title="My Profile" subtitle="Your name and contact details shown on reports and signatures">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Profile settings</CardTitle>
          <CardDescription>
            {isLoading ? "Loading your profile…" : (profile?.email ?? "Signed-in account")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                value={form.designation}
                onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room_no">Room no.</Label>
              <Input
                id="room_no"
                value={form.room_no}
                onChange={(e) => setForm((f) => ({ ...f, room_no: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={!profile || save.isPending}>
                {save.isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
