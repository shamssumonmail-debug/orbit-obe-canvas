import { Check, ChevronsUpDown, Plus, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { WEEKDAYS, profileLabel, useReferenceData } from "@/lib/course-setup";

export type ConsultationSlotDraft = {
  key: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
};

export type BasicInfoValue = {
  department_id: string;
  curriculum_course_id: string;
  academic_year: number;
  semester_type_id: string;
  section: string;
  course_type: "Theory" | "Sessional";
  course_category: "Core" | "Elective";
  credit_hours: number;
  instructor_id: string;
  consultation_hours: string;
  programme: string;
  faculty_name: string;
  level_year: number;
  level_semester: number;
  synopsis: string;
  prerequisites: string;
  consultation_slots: ConsultationSlotDraft[];
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
    course_category: "Core",
    credit_hours: 3,
    instructor_id: "",
    consultation_hours: "",
    programme: "",
    faculty_name: "Engineering",
    level_year: 1,
    level_semester: 1,
    synopsis: "",
    prerequisites: "",
    consultation_slots: [],
    grading_weight_class_performance: 10,
    grading_weight_quiz_assignment: 20,
    grading_weight_final: 70,
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
  if (!v.instructor_id) return "Select a faculty member";
  if (!Number.isFinite(v.credit_hours) || v.credit_hours <= 0) return "Credit hours must be greater than 0";
  if (v.academic_year < 2015 || v.academic_year > 2100) return "Academic year must be between 2015 and 2100";
  for (const s of v.consultation_slots) {
    if (!s.day_of_week) return "Every consultation slot needs a day";
    if (!s.start_time || !s.end_time) return "Every consultation slot needs a start and end time";
    if (s.start_time >= s.end_time) return `Consultation slot on ${s.day_of_week} ends before it starts`;
  }
  if (gradingTotal(v) !== 100) return "Grading weights must add up to exactly 100%";
  return null;
}

/** Columns of `course_offerings` that this form writes. */
export function basicInfoPayload(v: BasicInfoValue) {
  return {
    curriculum_course_id: v.curriculum_course_id,
    academic_year: v.academic_year,
    semester_type_id: v.semester_type_id,
    section: v.section.trim(),
    course_type: v.course_type,
    course_category: v.course_category,
    credit_hours: v.credit_hours,
    instructor_id: v.instructor_id,
    consultation_hours: v.consultation_hours.trim() || null,
    programme: v.programme.trim() || null,
    faculty_name: v.faculty_name.trim() || null,
    level_year: v.level_year || null,
    level_semester: v.level_semester || null,
    synopsis: v.synopsis.trim() || null,
    prerequisites: v.prerequisites.trim() || null,
    grading_weight_class_performance: v.grading_weight_class_performance,
    grading_weight_quiz_assignment: v.grading_weight_quiz_assignment,
    grading_weight_final: v.grading_weight_final,
    co_attainment_target_percent: v.co_attainment_target_percent,
  };
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
  const selectedFaculty = profiles.find((p) => p.id === value.instructor_id);
  const total = gradingTotal(value);

  const setSlots = (next: ConsultationSlotDraft[]) => set("consultation_slots", next);

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
          <Label>Semester offered *</Label>
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
          <Label htmlFor="level_year">Level — year *</Label>
          <Input
            id="level_year"
            type="number"
            min={1}
            max={6}
            value={value.level_year}
            disabled={disabled}
            onChange={(e) => set("level_year", Number(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="level_semester">Level — semester *</Label>
          <Input
            id="level_semester"
            type="number"
            min={1}
            max={3}
            value={value.level_semester}
            disabled={disabled}
            onChange={(e) => set("level_semester", Number(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="programme">Programme</Label>
          <Input
            id="programme"
            value={value.programme}
            placeholder="e.g. B.Sc. in Electrical and Electronic Engineering (EEE)"
            disabled={disabled}
            onChange={(e) => set("programme", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="faculty_name">Faculty (school)</Label>
          <Input
            id="faculty_name"
            value={value.faculty_name}
            placeholder="e.g. Engineering"
            disabled={disabled}
            onChange={(e) => set("faculty_name", e.target.value)}
          />
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
          <Label>Delivery type *</Label>
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
          <Label>Type of course (core / elective) *</Label>
          <Select
            value={value.course_category}
            onValueChange={(v) => set("course_category", v as BasicInfoValue["course_category"])}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Core">Core</SelectItem>
              <SelectItem value="Elective">Elective</SelectItem>
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

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="synopsis">Synopsis</Label>
          <Textarea
            id="synopsis"
            rows={5}
            value={value.synopsis}
            placeholder="Course synopsis as printed in the Course Details Form…"
            disabled={disabled}
            onChange={(e) => set("synopsis", e.target.value)}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="prerequisites">Prerequisite(s) (if any)</Label>
          <Input
            id="prerequisites"
            value={value.prerequisites}
            placeholder="e.g. EEE 2101, or N/A"
            disabled={disabled}
            onChange={(e) => set("prerequisites", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Course faculty (instructor) *</Label>
          <Select
            value={value.instructor_id}
            onValueChange={(v) => set("instructor_id", v)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select faculty" />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {profileLabel(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedFaculty && (
            <p className="text-xs text-muted-foreground">
              {[
                selectedFaculty.designation,
                selectedFaculty.room_no ? `Room ${selectedFaculty.room_no}` : null,
                selectedFaculty.phone,
                selectedFaculty.email,
              ]
                .filter(Boolean)
                .join(" · ") || "Add phone, room and designation on the Faculty page."}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="consultation_hours">Consultation hours note</Label>
          <Input
            id="consultation_hours"
            value={value.consultation_hours}
            placeholder="Optional extra note"
            disabled={disabled}
            onChange={(e) => set("consultation_hours", e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">Consultation hour slots</p>
            <p className="text-xs text-muted-foreground">
              Add one row per weekly slot — printed as bullets under item 12.
            </p>
          </div>
          {!disabled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setSlots([
                  ...value.consultation_slots,
                  {
                    key: `slot-${Date.now()}-${value.consultation_slots.length}`,
                    day_of_week: "Sunday",
                    start_time: "10:30",
                    end_time: "12:10",
                  },
                ])
              }
            >
              <Plus className="mr-2 size-4" /> Add slot
            </Button>
          )}
        </div>

        <div className="mt-4 space-y-3">
          {value.consultation_slots.length === 0 && (
            <p className="text-sm text-muted-foreground">No consultation slots added yet.</p>
          )}
          {value.consultation_slots.map((s, i) => (
            <div key={s.key} className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
              <div className="space-y-1">
                <Label className="text-xs">Day</Label>
                <Select
                  value={s.day_of_week}
                  disabled={disabled}
                  onValueChange={(v) =>
                    setSlots(value.consultation_slots.map((x, xi) => (xi === i ? { ...x, day_of_week: v } : x)))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKDAYS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">From</Label>
                <Input
                  type="time"
                  value={s.start_time}
                  disabled={disabled}
                  onChange={(e) =>
                    setSlots(
                      value.consultation_slots.map((x, xi) =>
                        xi === i ? { ...x, start_time: e.target.value } : x,
                      ),
                    )
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">To</Label>
                <Input
                  type="time"
                  value={s.end_time}
                  disabled={disabled}
                  onChange={(e) =>
                    setSlots(
                      value.consultation_slots.map((x, xi) => (xi === i ? { ...x, end_time: e.target.value } : x)),
                    )
                  }
                />
              </div>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${s.day_of_week} slot`}
                  onClick={() => setSlots(value.consultation_slots.filter((_, xi) => xi !== i))}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">Percentages of assessment methods</p>
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
            <Label htmlFor="gw_qa">Quizzes / assignments %</Label>
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
            <Label htmlFor="gw_final">Final examination %</Label>
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
