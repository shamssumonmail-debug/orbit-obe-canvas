import { createFileRoute } from "@tanstack/react-router";
import { ImageUp, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/obe/app-shell";
import { RequireAuth } from "@/components/obe/require-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  uploadLogo,
  useInstitution,
  useLogoUrl,
  useSaveInstitution,
  type InstitutionProfileRow,
} from "@/lib/institution";

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

function SettingsRoute() {
  return (
    <RequireAuth roles={["super_admin"]}>
      <InstitutionSettings />
    </RequireAuth>
  );
}

function InstitutionSettings() {
  const { data, isLoading, error } = useInstitution();
  const saveMutation = useSaveInstitution();
  const [form, setForm] = useState<InstitutionProfileRow | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const logoUrl = useLogoUrl(form?.logo_url);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const set = <K extends keyof InstitutionProfileRow>(key: K, value: InstitutionProfileRow[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const dirty = !!form && !!data && JSON.stringify(form) !== JSON.stringify(data);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    try {
      await saveMutation.mutateAsync(form);
      toast.success("Institution profile saved");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleLogo = async (file: File | undefined) => {
    if (!file || !form) return;
    setUploading(true);
    try {
      const path = await uploadLogo(file);
      await saveMutation.mutateAsync({ id: form.id, logo_url: path });
      setForm({ ...form, logo_url: path });
      toast.success("Logo uploaded");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (isLoading) {
    return (
      <AppShell title="Institution Profile" subtitle="Settings › Institution Profile">
        <Skeleton className="h-64 w-full" />
      </AppShell>
    );
  }

  if (error || !form) {
    return (
      <AppShell title="Institution Profile" subtitle="Settings › Institution Profile">
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
          Could not load the institution profile{error ? `: ${(error as Error).message}` : "."}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Institution Profile" subtitle="Settings › Institution Profile">
      <form onSubmit={handleSave} className="space-y-5 pb-4">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">Identity &amp; branding</CardTitle>
            <CardDescription>Printed on the header of every Course Details Form and report.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3 md:col-span-2">
              <Label>University logo</Label>
              <div className="flex flex-wrap items-center gap-4">
                <div className="grid size-20 place-items-center overflow-hidden rounded-lg border border-border bg-muted">
                  {logoUrl ? (
                    <img src={logoUrl} alt={`${form.name} logo`} className="size-full object-contain" />
                  ) : (
                    <ImageUp className="size-6 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={(e) => void handleLogo(e.target.files?.[0])}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                  >
                    {uploading ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <ImageUp className="mr-2 size-4" />
                    )}
                    {uploading ? "Uploading…" : logoUrl ? "Replace logo" : "Upload logo"}
                  </Button>
                  <p className="text-xs text-muted-foreground">PNG, JPG, SVG or WebP up to 5 MB.</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Institution name</Label>
              <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="short_name">Short name</Label>
              <Input
                id="short_name"
                value={form.short_name}
                onChange={(e) => set("short_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Institution code</Label>
              <Input id="code" value={form.code} onChange={(e) => set("code", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="affiliation">Affiliated to</Label>
              <Input
                id="affiliation"
                value={form.affiliated_to}
                onChange={(e) => set("affiliated_to", e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="sponsor_line">Sponsorship / approval line</Label>
              <Textarea
                id="sponsor_line"
                rows={2}
                value={form.sponsor_line}
                onChange={(e) => set("sponsor_line", e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
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
              <Select value={form.academic_year} onValueChange={(v) => set("academic_year", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["2022-23", "2023-24", "2024-25", "2025-26", "2026-27"].map((y) => (
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
                  {["Spring", "Fall"].map((t) => (
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
            <CardTitle className="text-base">Contact &amp; address</CardTitle>
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
              <Input
                id="address"
                value={form.address_line}
                onChange={(e) => set("address_line", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State / division</Label>
              <Input id="state" value={form.state} onChange={(e) => set("state", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pincode">Postcode</Label>
              <Input id="pincode" value={form.pincode} onChange={(e) => set("pincode", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">Vision &amp; mission</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="vision">Vision</Label>
              <Textarea id="vision" rows={3} value={form.vision} onChange={(e) => set("vision", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mission">Mission</Label>
              <Textarea
                id="mission"
                rows={3}
                value={form.mission}
                onChange={(e) => set("mission", e.target.value)}
              />
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
              <Select value={form.attainment_scale} onValueChange={(v) => set("attainment_scale", v)}>
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
                value={form.target_attainment}
                onChange={(e) => set("target_attainment", e.target.value)}
              />
            </div>
            <Separator className="md:col-span-2" />
            <div className="flex items-center justify-between md:col-span-2">
              <div>
                <p className="text-sm font-medium">Include indirect (feedback) attainment</p>
                <p className="text-sm text-muted-foreground">Blend survey feedback into final attainment.</p>
              </div>
              <Switch
                checked={form.enable_indirect_feedback}
                onCheckedChange={(v) => set("enable_indirect_feedback", v)}
              />
            </div>
            <div className="flex items-center justify-between md:col-span-2">
              <div>
                <p className="text-sm font-medium">Auto-calculate attainment</p>
                <p className="text-sm text-muted-foreground">Recompute after every mark entry cycle.</p>
              </div>
              <Switch
                checked={form.auto_calculate_attainment}
                onCheckedChange={(v) => set("auto_calculate_attainment", v)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-border bg-background/90 py-4 backdrop-blur">
          {dirty && <p className="mr-auto text-sm text-muted-foreground">Unsaved changes</p>}
          <Button type="button" variant="outline" onClick={() => data && setForm(data)} disabled={!dirty}>
            Reset
          </Button>
          <Button type="submit" disabled={!dirty || saveMutation.isPending}>
            {saveMutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </AppShell>
  );
}
