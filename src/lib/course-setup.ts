import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { Role } from "./mock-auth";

export type OfferingStatus = "draft" | "checked" | "approved";

export const STATUS_LABEL: Record<OfferingStatus, string> = {
  draft: "Draft",
  checked: "Checked",
  approved: "Approved",
};

/**
 * The project has no HoD-equivalent role, so `super_admin` acts as the admin role
 * for the approve / reopen steps (mirrors the database policies).
 */
export function isCoordinator(role: Role | undefined): boolean {
  return role === "super_admin" || (role as string) === "obe_coordinator";
}

export function isAdmin(role: Role | undefined): boolean {
  return role === "super_admin";
}

export type CourseOffering = {
  id: string;
  curriculum_course_id: string;
  academic_year: number;
  semester_type_id: string;
  section: string;
  course_type: "Theory" | "Sessional";
  credit_hours: number;
  instructor_id: string;
  consultation_hours: string | null;
  grading_weight_class_performance: number;
  grading_weight_quiz_assignment: number;
  grading_weight_final: number;
  co_attainment_target_percent: number;
  status: OfferingStatus;
  checked_by: string | null;
  checked_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  review_comment: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  synopsis: string | null;
  course_category: "Core" | "Elective";
  prerequisites: string | null;
  programme: string | null;
  faculty_name: string | null;
  level_year: number | null;
  level_semester: number | null;
};

export type ConsultationSlot = {
  id: string;
  course_offering_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  display_order: number;
};

export type CourseReference = {
  id: string;
  course_offering_id: string;
  kind: "required" | "recommended";
  citation: string;
  display_order: number;
};

export const WEEKDAYS = [
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const;

export function formatTime(t: string): string {
  const [h, m] = t.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${m ?? "00"} ${suffix}`;
}

export function formatSlot(s: { day_of_week: string; start_time: string; end_time: string }): string {
  return `${s.day_of_week} ${formatTime(s.start_time)} – ${formatTime(s.end_time)}`;
}


export type CourseOutcome = {
  id: string;
  course_offering_id: string;
  co_number: string;
  co_statement: string;
  bloom_taxonomy_level_id: string;
  display_order: number;
  delivery_methods: string | null;
  assessment_methods: string | null;
};


export type AssessmentTool = {
  id: string;
  course_outcome_id: string;
  tool_name: string;
  max_marks: number;
  rubric_notes: string | null;
  display_order: number;
};

export type WeeklyScheduleRow = {
  id: string;
  course_offering_id: string;
  week_number: number;
  topic: string;
  course_outcome_id: string | null;
  delivery_method: string | null;
  assessment_strategy: string | null;
};

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone?: string | null;
  designation?: string | null;
  room_no?: string | null;
  department_id?: string | null;
  is_active?: boolean | null;
};


/** Editing is blocked once approved (for everyone) and once out of draft for non-managers. */
export function canEditOffering(
  offering: Pick<CourseOffering, "status" | "created_by"> | undefined,
  role: Role | undefined,
  userId: string | null,
): boolean {
  if (!offering) return false;
  if (offering.status === "approved") return false;
  if (isCoordinator(role)) return true;
  return offering.status === "draft" && !!userId && offering.created_by === userId;
}

export function nextCoNumber(existing: { co_number: string }[]): string {
  let n = 1;
  const taken = new Set(existing.map((c) => c.co_number.toUpperCase()));
  while (taken.has(`CO${n}`)) n += 1;
  return `CO${n}`;
}

export function useCurrentUserId(): string | null {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (active) setId(data.user?.id ?? null);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  return id;
}

/** Shared reference data used across the Course Setup tabs. */
export function useReferenceData() {
  const departments = useQuery({
    queryKey: ["course-setup", "departments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("id, code, name").order("code");
      if (error) throw error;
      return data ?? [];
    },
  });

  const courses = useQuery({
    queryKey: ["course-setup", "curriculum-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curriculum_courses")
        .select("id, department_id, course_code, course_title, is_active")
        .order("course_code");
      if (error) throw error;
      return data ?? [];
    },
  });

  const semesters = useQuery({
    queryKey: ["course-setup", "semester-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("semester_types")
        .select("id, code, display_order")
        .order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const profiles = useQuery({
    queryKey: ["course-setup", "profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, designation, room_no, department_id, is_active")
        .order("full_name");

      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });

  const bloom = useQuery({
    queryKey: ["course-setup", "bloom"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bloom_taxonomy_levels")
        .select("id, domain, level, display_order, is_active")
        .order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const programOutcomes = useQuery({
    queryKey: ["course-setup", "program-outcomes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("program_outcomes")
        .select("id, code, title, display_order, is_active")
        .order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const knowledgeProfiles = useQuery({
    queryKey: ["course-setup", "knowledge-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_profiles")
        .select("id, code, title, display_order, is_active")
        .order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const problemAttributes = useQuery({
    queryKey: ["course-setup", "problem-attributes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complex_problem_attributes")
        .select("id, code, category, title, display_order, is_active")
        .order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  return {
    departments: departments.data ?? [],
    courses: courses.data ?? [],
    semesters: semesters.data ?? [],
    profiles: profiles.data ?? [],
    bloom: bloom.data ?? [],
    programOutcomes: programOutcomes.data ?? [],
    knowledgeProfiles: knowledgeProfiles.data ?? [],
    problemAttributes: problemAttributes.data ?? [],
    loading:
      departments.isLoading ||
      courses.isLoading ||
      semesters.isLoading ||
      profiles.isLoading ||
      bloom.isLoading,
  };
}

export function profileLabel(p: Profile | undefined): string {
  if (!p) return "—";
  return p.full_name || p.email || p.id.slice(0, 8);
}
