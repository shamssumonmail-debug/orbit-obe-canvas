import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { profileLabel, useReferenceData } from "@/lib/course-setup";

export type BasicInfoValue = {
  department_id: string;
  curriculum_course_id: string;
  academic_year: number;
  semester_type_id: string;
  section: string;
  course_type: "Theory" | "Sessional";
  credit_hours: number;
  instructor_id: string;
  consultation_hours: string;
  grading_weight_class_performance: number;
  grading_weight_quiz_assignment: number;
  grading_weight_final: number;
  co_attainment_target_percent: number;
};

export function emptyBasicInfo(): BasicInfoValue {
  return {
    department_id: "",
    curriculum_course_id: "",
    academic_year: new Date().getFullYear(),
    semester_type_id: "",
    section: "",
    course_type: "Theory",
    credit_hours: 3,
    instructor_id: "",
    consultation_hours: "",
    grading_weight_class_performance: 30,
    grading_weight_quiz_assignment: 20,
    grading_weight_final: 50,
    co_attainment_target_percent: 60,
  };
}

export function gradingTotal(v: BasicInfoValue): number {
  return (
    Number(v.grading_weight_class_performance || 0) +
    Number(v.grading_weight_quiz_assignment || 0) +
    Number(v.grading_weight_final || 0)
  );
}

export function validateBasicInfo(v: BasicInfoValue): string | null {
  if (!v.curriculum_course_id) return "Select a curriculum course";
  if (!v.semester_type_id) return "Select a semester";
  if (!v.section.trim()) return "Section is required";
  if (!v.instructor_id) return "Select an instructor";
  if (!Number.isFinite(v.credit_hours) || v.credit_hours <= 0) return "Credit hours must be greater than 0";
  if (v.academic_year < 2015 || v.academic_year > 2100) return "Academic year must be between 2015 and 2100";
  if (gradingTotal(v) !== 100) return "Grading weights must add up to exactly 100%";
  return null;
}

export function BasicInfoForm({
  value,
  onChange,
  disabled = false,
}: {
  value: BasicInfoValue;
  onChange: (next: BasicInfoValue) => void;
  disabled?: boolean;
}) {
  const { departments, courses, semesters, profiles } = useReferenceData();
  const [courseOpen, setCourseOpen] = useState(false);

  const set = <K extends keyof BasicInfoValue>(key: K, val: BasicInfoValue[K]) =>
    onChange({ ...value, [key]: val });

  const filteredCourses = useMemo(
    () =>
      courses.filter(
        (c) => c.is_active !== false && (!value.department_id || c.department_id === value.department_id),
      ),
    [courses, value.department_id],
  );

  const selectedCourse = courses.find((c) => c.id === value.curriculum_course_id);
  const total = gradingTotal(value);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Department (filter)</Label>
          <Select
            value={value.department_id || "all"}
            onValueChange={(v) =>
              onChange({
                ...value,
                department_id: v === "all" ? "" : v,
                curriculum_course_id: "",
              })
            }
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.code} — {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Curriculum course *</Label>
          <Popover open={courseOpen} onOpenChange={setCourseOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                disabled={disabled}
                className="w-full justify-between font-normal"
              >
                <span className="truncate">
                  {selectedCourse
                    ? `${selectedCourse.course_code} — ${selectedCourse.course_title}`
                    : "Search and select a course"}
                </span>
                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search course code or title…" />
                <CommandList>
                  <CommandEmpty>No course found.</CommandEmpty>
                  <CommandGroup>
                    {filteredCourses.map((c) => (
                      <CommandItem
                        key={c.id}
                        value={`${c.course_code} ${c.course_title}`}
                        onSelect={() => {
                          set("curriculum_course_id", c.id);
                          setCourseOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 size-4",
                            c.id === value.curriculum_course_id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <span className="truncate">
                          {c.course_code} — {c.course_title}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="academic_year">Academic year *</Label>
          <Input
            id="academic_year"
            type="number"
            min={2015}
            max={2100}
            value={value.academic_year}
            disabled={disabled}
            onChange={(e) => set("academic_year", Number(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label>Semester *</Label>
          <Select
            value={value.semester_type_id}
            onValueChange={(v) => set("semester_type_id", v)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent>
              {semesters.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="section">Section *</Label>
          <Input
            id="section"
            value={value.section}
            placeholder="A or A,B,C,D"
            disabled={disabled}
            onChange={(e) => set("section", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Course type *</Label>
          <Select
            value={value.course_type}
            onValueChange={(v) => set("course_type", v as BasicInfoValue["course_type"])}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Theory">Theory</SelectItem>
              <SelectItem value="Sessional">Sessional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="credit_hours">Credit hours *</Label>
          <Input
            id="credit_hours"
            type="number"
            step="0.25"
            min={0}
            value={value.credit_hours}
            disabled={disabled}
            onChange={(e) => set("credit_hours", Number(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label>Instructor *</Label>
          <Select
            value={value.instructor_id}
            onValueChange={(v) => set("instructor_id", v)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select instructor" />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {profileLabel(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="consultation_hours">Consultation hours</Label>
          <Input
            id="consultation_hours"
            value={value.consultation_hours}
            placeholder="e.g. Sun & Tue, 2:00 PM – 4:00 PM"
            disabled={disabled}
            onChange={(e) => set("consultation_hours", e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">Grading weights</p>
            <p className="text-xs text-muted-foreground">Must total exactly 100%.</p>
          </div>
          <p
            className={cn(
              "rounded-md px-3 py-1 text-sm font-semibold",
              total === 100 ? "bg-primary-soft text-primary" : "bg-destructive/10 text-destructive",
            )}
          >
            Total: {total}%
          </p>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="gw_cp">Class performance %</Label>
            <Input
              id="gw_cp"
              type="number"
              min={0}
              max={100}
              value={value.grading_weight_class_performance}
              disabled={disabled}
              onChange={(e) => set("grading_weight_class_performance", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gw_qa">Quiz / assignment %</Label>
            <Input
              id="gw_qa"
              type="number"
              min={0}
              max={100}
              value={value.grading_weight_quiz_assignment}
              disabled={disabled}
              onChange={(e) => set("grading_weight_quiz_assignment", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gw_final">Final %</Label>
            <Input
              id="gw_final"
              type="number"
              min={0}
              max={100}
              value={value.grading_weight_final}
              disabled={disabled}
              onChange={(e) => set("grading_weight_final", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="co_target">CO attainment target %</Label>
            <Input
              id="co_target"
              type="number"
              min={0}
              max={100}
              value={value.co_attainment_target_percent}
              disabled={disabled}
              onChange={(e) => set("co_attainment_target_percent", Number(e.target.value))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
