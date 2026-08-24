import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/obe/app-shell";
import { RequireAuth } from "@/components/obe/require-auth";
import { MasterDataTable } from "@/components/obe/master-data-table";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { curriculumCoursesResource, departmentsResource } from "@/lib/master-data";

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

type Department = { id: string; code: string; name: string };

function DepartmentsRoute() {
  return (
    <RequireAuth>
      <AppShell
        title="Departments & Curriculum Courses"
        subtitle="Master data · departments and their course catalogue"
      >
        <DepartmentsAndCourses />
      </AppShell>
    </RequireAuth>
  );
}

function DepartmentsAndCourses() {
  const [departmentId, setDepartmentId] = useState<string>("");

  const { data: departments } = useQuery({
    queryKey: ["master-data", "departments", "options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("id, code, name").order("code");
      if (error) throw error;
      return (data ?? []) as Department[];
    },
  });

  const options = useMemo(
    () => (departments ?? []).map((d) => ({ id: d.id, label: `${d.code} — ${d.name}` })),
    [departments],
  );

  const coursesResource = useMemo(() => curriculumCoursesResource(options), [options]);
  const optionLabels = useMemo(
    () => ({ department_id: Object.fromEntries(options.map((o) => [o.id, o.label])) }),
    [options],
  );

  const selected = departmentId || options[0]?.id || "";

  return (
    <Tabs defaultValue="departments" className="space-y-4">
      <TabsList>
        <TabsTrigger value="departments">Departments</TabsTrigger>
        <TabsTrigger value="courses">Curriculum Courses</TabsTrigger>
      </TabsList>

      <TabsContent value="departments">
        <MasterDataTable resource={departmentsResource} />
      </TabsContent>

      <TabsContent value="courses">
        {options.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center">
            <p className="text-sm font-medium">No departments available yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a department first — courses are always owned by a department.
            </p>
          </div>
        ) : (
          <MasterDataTable
            resource={coursesResource}
            filter={selected ? { department_id: selected } : undefined}
            optionLabels={optionLabels}
            toolbar={
              <div className="flex items-center gap-2">
                <Label htmlFor="department-filter" className="text-sm text-muted-foreground">
                  Department
                </Label>
                <Select value={selected} onValueChange={setDepartmentId}>
                  <SelectTrigger id="department-filter" className="w-64">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            }
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
