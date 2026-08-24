import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/obe/app-shell";
import { RequireAuth } from "@/components/obe/require-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { institutionProfile, type InstitutionProfile } from "@/lib/obe-mock-data";

export const Route = createFileRoute("/settings/institution")({
  head: () => ({
    meta: [
      { title: "Institution Profile · OBE Suite settings" },
      {
        name: "description",
        content:
          "Manage institution identity, accreditation details, academic session and attainment calculation preferences.",
      },
      { property: "og:title", content: "Institution Profile · OBE Suite settings" },
      {
        property: "og:description",
        content: "Institution identity, accreditation, academic session and attainment configuration.",
      },
    ],
  }),
  component: SettingsRoute,
});

function SettingsRoute() {
  return (
    <RequireAuth roles={["super_admin"]}>
      <InstitutionSettings />
    </RequireAuth>
  );
}

function InstitutionSettings() {
  const [form, setForm] = useState<InstitutionProfile>(institutionProfile);
  const [saved, setSaved] = useState<InstitutionProfile>(institutionProfile);
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);

  const set = <K extends keyof InstitutionProfile>(key: K, value: InstitutionProfile[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(form);
    toast.success("Institution profile saved (local mock state)");
  };

  return (
    <AppShell title="Institution Profile" subtitle="Settings › Institution Profile">
      <form onSubmit={handleSave} className="space-y-5 pb-4">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">Identity</CardTitle>
            <CardDescription>Core details printed on outcome and accreditation reports.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Institution name</Label>
              <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Institution code</Label>
              <Input id="code" value={form.code} onChange={(e) => set("code", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="affiliation">Affiliated to</Label>
              <Input
                id="affiliation"
                value={form.affiliatedTo}
                onChange={(e) => set("affiliatedTo", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accreditation">Accreditation</Label>
              <Input
                id="accreditation"
                value={form.accreditation}
                onChange={(e) => set("accreditation", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">Academic session</CardTitle>
            <CardDescription>Default context applied across dashboards and reports.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Academic year</Label>
              <Select value={form.academicYear} onValueChange={(v) => set("academicYear", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["2022-23", "2023-24", "2024-25", "2025-26"].map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Current term</Label>
              <Select value={form.term} onValueChange={(v) => set("term", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Term 1", "Term 2"].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">Contact & address</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Official email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" value={form.website} onChange={(e) => set("website", e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={form.addressLine} onChange={(e) => set("addressLine", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" value={form.state} onChange={(e) => set("state", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input id="pincode" value={form.pincode} onChange={(e) => set("pincode", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">Vision & mission</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="vision">Vision</Label>
              <Textarea id="vision" rows={3} value={form.vision} onChange={(e) => set("vision", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mission">Mission</Label>
              <Textarea id="mission" rows={3} value={form.mission} onChange={(e) => set("mission", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">Attainment preferences</CardTitle>
            <CardDescription>Defaults used once the attainment engine is enabled.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Attainment scale</Label>
              <Select value={form.attainmentScale} onValueChange={(v) => set("attainmentScale", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["3", "4", "5"].map((s) => (
                    <SelectItem key={s} value={s}>
                      0 – {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="target">Target attainment</Label>
              <Input
                id="target"
                value={form.targetAttainment}
                onChange={(e) => set("targetAttainment", e.target.value)}
              />
            </div>
            <Separator className="md:col-span-2" />
            <div className="flex items-center justify-between md:col-span-2">
              <div>
                <p className="text-sm font-medium">Include indirect (feedback) attainment</p>
                <p className="text-sm text-muted-foreground">Blend survey feedback into final attainment.</p>
              </div>
              <Switch
                checked={form.enableIndirectFeedback}
                onCheckedChange={(v) => set("enableIndirectFeedback", v)}
              />
            </div>
            <div className="flex items-center justify-between md:col-span-2">
              <div>
                <p className="text-sm font-medium">Auto-calculate attainment</p>
                <p className="text-sm text-muted-foreground">Recompute after every mark entry cycle.</p>
              </div>
              <Switch
                checked={form.autoCalculateAttainment}
                onCheckedChange={(v) => set("autoCalculateAttainment", v)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-border bg-background/90 py-4 backdrop-blur">
          {dirty && <p className="mr-auto text-sm text-muted-foreground">Unsaved changes</p>}
          <Button type="button" variant="outline" onClick={() => setForm(saved)} disabled={!dirty}>
            Reset
          </Button>
          <Button type="submit" disabled={!dirty}>
            Save changes
          </Button>
        </div>
      </form>
    </AppShell>
  );
}
