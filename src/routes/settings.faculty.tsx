import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Pencil, Plus, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/obe/app-shell";
import { RequireAuth } from "@/components/obe/require-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { createFacultyMember } from "@/lib/faculty.functions";
import { useReferenceData, type Profile } from "@/lib/course-setup";

export const Route = createFileRoute("/settings/faculty")({
  head: () => ({
    meta: [
      { title: "Faculty Directory · OBE Suite settings" },
      {
        name: "description",
        content:
          "Add and maintain faculty members with their name, designation, department, room, phone and email for course details forms.",
      },
      { property: "og:title", content: "Faculty Directory · OBE Suite settings" },
      {
        property: "og:description",
        content: "Maintain faculty names, designations, departments and contact details.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FacultyRoute,
});

function FacultyRoute() {
  return (
    <RequireAuth roles={["super_admin"]}>
      <FacultyDirectory />
    </RequireAuth>
  );
}

type FacultyForm = {
  full_name: string;
  email: string;
  phone: string;
  designation: string;
  room_no: string;
  department_id: string;
};

const emptyForm: FacultyForm = {
  full_name: "",
  email: "",
  phone: "",
  designation: "",
  room_no: "",
  department_id: "",
};

function FacultyDirectory() {
  const queryClient = useQueryClient();
  const { profiles, departments, loading } = useReferenceData();
  const addFaculty = useServerFn(createFacultyMember);

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [form, setForm] = useState<FacultyForm>(emptyForm);
  const [search, setSearch] = useState("");

  const set = <K extends keyof FacultyForm>(key: K, value: FacultyForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) =>
      [p.full_name, p.email, p.phone, p.designation].filter(Boolean).join(" ").toLowerCase().includes(q),
    );
  }, [profiles, search]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["course-setup", "profiles"] });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.full_name.trim()) throw new Error("Name is required");
      if (!form.email.trim()) throw new Error("Email is required");
      await addFaculty({
        data: {
          full_name: form.full_name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          designation: form.designation.trim(),
          room_no: form.room_no.trim(),
          department_id: form.department_id || null,
        },
      });
    },
    onSuccess: () => {
      toast.success("Faculty member added");
      setAddOpen(false);
      setForm(emptyForm);
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      if (!form.full_name.trim()) throw new Error("Name is required");
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name.trim(),
          phone: form.phone.trim() || null,
          designation: form.designation.trim() || null,
          room_no: form.room_no.trim() || null,
          department_id: form.department_id || null,
        })
        .eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Faculty details updated");
      setEditing(null);
      setForm(emptyForm);
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (p: Profile) => {
    setForm({
      full_name: p.full_name ?? "",
      email: p.email ?? "",
      phone: p.phone ?? "",
      designation: p.designation ?? "",
      room_no: p.room_no ?? "",
      department_id: p.department_id ?? "",
    });
    setEditing(p);
  };

  const deptName = (id: string | null | undefined) => {
    const d = departments.find((x) => x.id === id);
    return d ? `${d.code}` : "—";
  };

  const fields = (mode: "add" | "edit") => (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="f_name">Full name *</Label>
        <Input id="f_name" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="f_email">Email *</Label>
        <Input
          id="f_email"
          type="email"
          value={form.email}
          disabled={mode === "edit"}
          onChange={(e) => set("email", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="f_phone">Phone</Label>
        <Input id="f_phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="f_desig">Designation</Label>
        <Input
          id="f_desig"
          value={form.designation}
          placeholder="e.g. Assistant Professor"
          onChange={(e) => set("designation", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="f_room">Room</Label>
        <Input id="f_room" value={form.room_no} onChange={(e) => set("room_no", e.target.value)} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>Department</Label>
        <Select
          value={form.department_id || "none"}
          onValueChange={(v) => set("department_id", v === "none" ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— none —</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.code} — {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <AppShell title="Faculty" subtitle="Settings › Faculty directory">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-sm text-muted-foreground">
            Faculty members selectable as course instructors. Name, designation and department are printed on the
            Course Details Form signature block.
          </p>
          <Button
            onClick={() => {
              setForm(emptyForm);
              setAddOpen(true);
            }}
          >
            <UserPlus className="mr-2 size-4" /> Add faculty
          </Button>
        </div>

        <Input
          value={search}
          placeholder="Search name, email, phone or designation…"
          className="max-w-sm"
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead className="w-28">Dept.</TableHead>
                <TableHead className="w-24">Room</TableHead>
                <TableHead className="w-40">Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-sm text-muted-foreground">
                    Loading faculty…
                  </TableCell>
                </TableRow>
              )}
              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-sm text-muted-foreground">
                    No faculty found.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.full_name || "—"}</TableCell>
                  <TableCell className="text-sm">{p.designation || "—"}</TableCell>
                  <TableCell className="text-sm">
                    <Badge variant="outline">{deptName(p.department_id)}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{p.room_no || "—"}</TableCell>
                  <TableCell className="text-sm">{p.phone || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.email || "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" aria-label={`Edit ${p.full_name ?? "faculty"}`} onClick={() => openEdit(p)}>
                      <Pencil className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add faculty</DialogTitle>
            <DialogDescription>
              Creates an account and staff record so this person can be assigned to course offerings.
            </DialogDescription>
          </DialogHeader>
          {fields("add")}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending}>
              <Plus className="mr-2 size-4" /> {create.isPending ? "Adding…" : "Add faculty"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit faculty details</DialogTitle>
            <DialogDescription>Email is fixed once the account exists.</DialogDescription>
          </DialogHeader>
          {fields("edit")}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={() => update.mutate()} disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
