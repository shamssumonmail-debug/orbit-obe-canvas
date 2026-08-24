import {
  BarChart3,
  Blocks,
  BookOpenCheck,
  Boxes,
  Brain,
  Building2,
  CalendarRange,
  ClipboardList,
  FileBarChart,
  Gauge,
  GraduationCap,
  Layers,
  LayoutDashboard,
  ListChecks,
  Network,
  Settings,
  Users,
} from "lucide-react";
import type { Role } from "./mock-auth";

export type NavItem = {
  label: string;
  icon: typeof LayoutDashboard;
  to?:
    | "/dashboard"
    | "/settings/institution"
    | "/master-data/program-outcomes"
    | "/master-data/knowledge-profiles"
    | "/master-data/complex-problem-attributes"
    | "/master-data/bloom-taxonomy-levels"
    | "/master-data/attainment-scale"
    | "/master-data/semester-types"
    | "/master-data/departments";
  comingSoon?: boolean;
  roles: Role[];
};

export type NavSection = {
  title: string;
  items: NavItem[];
};


export const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        to: "/dashboard",
        roles: ["super_admin", "faculty"],
      },
    ],
  },
  {
    title: "Master Data",
    items: [
      {
        label: "Program Outcomes",
        icon: Layers,
        to: "/master-data/program-outcomes",
        roles: ["super_admin", "faculty"],
      },
      {
        label: "Knowledge Profiles",
        icon: Blocks,
        to: "/master-data/knowledge-profiles",
        roles: ["super_admin", "faculty"],
      },
      {
        label: "Problem / Activity Attributes",
        icon: Boxes,
        to: "/master-data/complex-problem-attributes",
        roles: ["super_admin", "faculty"],
      },
      {
        label: "Bloom's Taxonomy Levels",
        icon: Brain,
        to: "/master-data/bloom-taxonomy-levels",
        roles: ["super_admin", "faculty"],
      },
      {
        label: "Attainment Scale",
        icon: Gauge,
        to: "/master-data/attainment-scale",
        roles: ["super_admin", "faculty"],
      },
      {
        label: "Semester Types",
        icon: CalendarRange,
        to: "/master-data/semester-types",
        roles: ["super_admin", "faculty"],
      },
      {
        label: "Departments & Courses",
        icon: Building2,
        to: "/master-data/departments",
        roles: ["super_admin", "faculty"],
      },
    ],
  },

  {
    title: "Outcome Setup",
    items: [
      { label: "Program Outcome (PO/PSO)", icon: GraduationCap, comingSoon: true, roles: ["super_admin"] },
      { label: "Course Outcome (CO)", icon: BookOpenCheck, comingSoon: true, roles: ["super_admin", "faculty"] },
      { label: "CO-PO Mapping", icon: Network, comingSoon: true, roles: ["super_admin", "faculty"] },
    ],
  },
  {
    title: "Assessment",
    items: [
      { label: "Exams & Marks", icon: ClipboardList, comingSoon: true, roles: ["super_admin", "faculty"] },
      { label: "Rubrics", icon: ListChecks, comingSoon: true, roles: ["super_admin"] },
      { label: "Attainment Engine", icon: BarChart3, comingSoon: true, roles: ["super_admin"] },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "Reports", icon: FileBarChart, comingSoon: true, roles: ["super_admin"] },
      { label: "Users & Roles", icon: Users, comingSoon: true, roles: ["super_admin"] },
      {
        label: "Settings",
        icon: Settings,
        to: "/settings/institution",
        roles: ["super_admin"],
      },
    ],
  },
];

export function sectionsForRole(role: Role): NavSection[] {
  return navSections
    .map((section) => ({ ...section, items: section.items.filter((i) => i.roles.includes(role)) }))
    .filter((section) => section.items.length > 0);
}
