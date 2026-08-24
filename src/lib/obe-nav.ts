import {
  BarChart3,
  BookOpenCheck,
  ClipboardList,
  FileBarChart,
  GraduationCap,
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
  to?: "/dashboard" | "/settings/institution";
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
