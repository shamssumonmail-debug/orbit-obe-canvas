import type { Role } from "./mock-auth";

/** Roles allowed to create / edit / deactivate master data (mirrors the DB policy). */
export const MASTER_DATA_MANAGER_ROLES = ["super_admin", "obe_coordinator"] as const;

export function canManageMasterData(role: Role | undefined): boolean {
  return !!role && (MASTER_DATA_MANAGER_ROLES as readonly string[]).includes(role);
}

export type FieldType = "text" | "textarea" | "number" | "select" | "boolean" | "multiselect";

export type FieldDef = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  /** Not a column on the resource table — handled outside the main insert/update payload. */
  virtual?: boolean;
  /** Shown under the input as helper text (e.g. uniqueness hints). */
  hint?: string;
  options?: readonly string[];
  min?: number;
  max?: number;
  /** Render this column in the data table. */
  inTable?: boolean;
  /** Allow sorting by this column. */
  sortable?: boolean;
  /** Include the value in the client-side search match. */
  searchable?: boolean;
  /** Column width utility class. */
  className?: string;
};

export type ResourceDef = {
  /** Postgres table name. */
  table: string;
  title: string;
  singular: string;
  description: string;
  fields: FieldDef[];
  defaultSort: { column: string; ascending: boolean };
};

const activeField: FieldDef = {
  name: "is_active",
  label: "Status",
  type: "boolean",
  inTable: true,
  sortable: true,
};

const displayOrderField: FieldDef = {
  name: "display_order",
  label: "Order",
  type: "number",
  required: true,
  min: 0,
  inTable: true,
  sortable: true,
  className: "w-20",
};

export const programOutcomesResource: ResourceDef = {
  table: "program_outcomes",
  title: "Program Outcomes",
  singular: "Program Outcome",
  description: "Program and program-specific outcomes (PO / PSO) used across the outcome framework.",
  defaultSort: { column: "display_order", ascending: true },
  fields: [
    {
      name: "code",
      label: "Code",
      type: "text",
      required: true,
      hint: "Must be unique, e.g. PO-a",
      inTable: true,
      sortable: true,
      searchable: true,
      className: "w-32",
    },
    { name: "title", label: "Title", type: "text", required: true, inTable: true, sortable: true, searchable: true },
    displayOrderField,
    activeField,
  ],
};

export const knowledgeProfilesResource: ResourceDef = {
  table: "knowledge_profiles",
  title: "Knowledge Profiles",
  singular: "Knowledge Profile",
  description: "Knowledge profile descriptors (K1–K8) referenced by outcome and attribute mapping.",
  defaultSort: { column: "display_order", ascending: true },
  fields: [
    {
      name: "code",
      label: "Code",
      type: "text",
      required: true,
      hint: "Must be unique, e.g. K1",
      inTable: true,
      sortable: true,
      searchable: true,
      className: "w-24",
    },
    { name: "title", label: "Title", type: "text", required: true, inTable: true, sortable: true, searchable: true },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      inTable: true,
      searchable: true,
      hint: "Optional — some descriptors are still unconfirmed.",
    },
    displayOrderField,
    activeField,
  ],
};

export const complexProblemAttributesResource: ResourceDef = {
  table: "complex_problem_attributes",
  title: "Complex Problem / Activity Attributes",
  singular: "Attribute",
  description: "Complex Engineering Problem (CEP) and Complex Engineering Activity (CEA) attributes.",
  defaultSort: { column: "display_order", ascending: true },
  fields: [
    {
      name: "code",
      label: "Code",
      type: "text",
      required: true,
      hint: "Must be unique, e.g. P1 or A1",
      inTable: true,
      sortable: true,
      searchable: true,
      className: "w-24",
    },
    {
      name: "category",
      label: "Category",
      type: "select",
      required: true,
      options: ["CEP", "CEA"],
      inTable: true,
      sortable: true,
      searchable: true,
      className: "w-28",
    },
    { name: "title", label: "Title", type: "text", inTable: true, sortable: true, searchable: true },
    { name: "description", label: "Description", type: "textarea", inTable: true, searchable: true },
    displayOrderField,
    activeField,
  ],
};

export const bloomTaxonomyResource: ResourceDef = {
  table: "bloom_taxonomy_levels",
  title: "Bloom's Taxonomy Levels",
  singular: "Taxonomy Level",
  description: "Cognitive, psychomotor and affective levels used when writing course outcomes.",
  defaultSort: { column: "display_order", ascending: true },
  fields: [
    {
      name: "domain",
      label: "Domain",
      type: "select",
      required: true,
      options: ["Cognitive", "Psychomotor", "Affective"],
      inTable: true,
      sortable: true,
      searchable: true,
      className: "w-36",
    },
    {
      name: "level",
      label: "Level",
      type: "text",
      required: true,
      hint: "Domain + level must be unique, e.g. Analyze",
      inTable: true,
      sortable: true,
      searchable: true,
    },
    displayOrderField,
    activeField,
  ],
};

export const attainmentScaleResource: ResourceDef = {
  table: "attainment_scale_bands",
  title: "Attainment Scale",
  singular: "Scale Band",
  description: "Default global scale bands mapping a score range to an attainment category.",
  defaultSort: { column: "scale_value", ascending: false },
  fields: [
    {
      name: "scale_value",
      label: "Scale",
      type: "number",
      required: true,
      min: 1,
      max: 10,
      hint: "Between 1 and 10",
      inTable: true,
      sortable: true,
      className: "w-20",
    },
    {
      name: "category_label",
      label: "Category",
      type: "text",
      required: true,
      inTable: true,
      sortable: true,
      searchable: true,
    },
    {
      name: "min_score",
      label: "Min score",
      type: "number",
      required: true,
      hint: "Must be less than or equal to the maximum score.",
      inTable: true,
      sortable: true,
      className: "w-28",
    },
    { name: "max_score", label: "Max score", type: "number", required: true, inTable: true, sortable: true, className: "w-28" },
    { name: "is_default", label: "Default template", type: "boolean", inTable: true, sortable: true },
  ],
};

export const semesterTypesResource: ResourceDef = {
  table: "semester_types",
  title: "Semester Types",
  singular: "Semester Type",
  description: "Semester labels available when scheduling courses and assessments.",
  defaultSort: { column: "display_order", ascending: true },
  fields: [
    {
      name: "code",
      label: "Code",
      type: "text",
      required: true,
      hint: "Must be unique, e.g. Spring",
      inTable: true,
      sortable: true,
      searchable: true,
    },
    displayOrderField,
    activeField,
  ],
};

export const departmentsResource: ResourceDef = {
  table: "departments",
  title: "Departments",
  singular: "Department",
  description: "Academic departments that own programs and curriculum courses.",
  defaultSort: { column: "code", ascending: true },
  fields: [
    {
      name: "code",
      label: "Code",
      type: "text",
      required: true,
      hint: "Must be unique, e.g. EEE",
      inTable: true,
      sortable: true,
      searchable: true,
      className: "w-28",
    },
    { name: "name", label: "Name", type: "text", required: true, inTable: true, sortable: true, searchable: true },
    activeField,
  ],
};

export function curriculumCoursesResource(departmentOptions: { id: string; label: string }[]): ResourceDef {
  return {
    table: "curriculum_courses",
    title: "Curriculum Courses",
    singular: "Course",
    description: "Course catalogue per department, used as the base list for course outcomes.",
    defaultSort: { column: "course_code", ascending: true },
    fields: [
      {
        name: "department_id",
        label: "Department",
        type: "select",
        required: true,
        options: departmentOptions.map((d) => d.id),
        inTable: false,
      },
      {
        name: "course_code",
        label: "Course code",
        type: "text",
        required: true,
        hint: "Must be unique within the department.",
        inTable: true,
        sortable: true,
        searchable: true,
        className: "w-44",
      },
      {
        name: "course_title",
        label: "Course title",
        type: "text",
        required: true,
        inTable: true,
        sortable: true,
        searchable: true,
      },
      activeField,
    ],
  };
}

export const PAGE_SIZE = 25;
