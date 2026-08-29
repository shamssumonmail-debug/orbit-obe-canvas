import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer } from "lucide-react";

import { RequireAuth } from "@/components/obe/require-auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useLogoUrl, useInstitution } from "@/lib/institution";
import { useCoDetails, useCourseOutcomes } from "@/components/obe/course-setup/course-outcomes-tab";
import { useWeeklySchedule } from "@/components/obe/course-setup/weekly-schedule-tab";
import {
  formatSlot,
  profileLabel,
  useConsultationSlots,
  useCourseReferences,
  useReferenceData,
  type CourseOffering,
} from "@/lib/course-setup";

export const Route = createFileRoute("/course-setup/report/$id")({
  head: () => ({
    meta: [
      { title: "Course Details Form · Approved report" },
      {
        name: "description",
        content:
          "Printable Course Details Form: synopsis, CO-PO mapping, PO indicators, knowledge profiles, CEP attributes, week-wise plan, references and signatures.",
      },
      { property: "og:title", content: "Course Details Form · Approved report" },
      {
        property: "og:description",
        content: "Printable, signed Course Details Form generated from the approved course offering.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportRoute,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-10 text-sm text-destructive">
      {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-10 text-sm text-muted-foreground">Course offering not found.</div>,
});

function ReportRoute() {
  return (
    <RequireAuth>
      <CourseDetailsReport />
    </RequireAuth>
  );
}

function fmtDate(ts: string | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function Lines({ text }: { text: string | null | undefined }) {
  if (!text) return <>—</>;
  return (
    <>
      {text.split("\n").map((line, i) => (
        <span key={i} className="block">
          {line}
        </span>
      ))}
    </>
  );
}

function CourseDetailsReport() {
  const { id } = Route.useParams();
  const institution = useInstitution();
  const logoUrl = useLogoUrl(institution.data?.logo_url);
  const { courses, departments, semesters, profiles, bloom, programOutcomes, knowledgeProfiles, problemAttributes } =
    useReferenceData();

  const offering = useQuery({
    queryKey: ["course-setup", "offering", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("course_offerings").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return (data ?? null) as CourseOffering | null;
    },
  });

  const outcomes = useCourseOutcomes(id);
  const details = useCoDetails((outcomes.data ?? []).map((c) => c.id));
  const schedule = useWeeklySchedule(id);
  const slots = useConsultationSlots(id);
  const refs = useCourseReferences(id);

  if (offering.isLoading || institution.isLoading) {
    return (
      <div className="mx-auto max-w-4xl p-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const o = offering.data;
  if (!o) {
    return (
      <div className="mx-auto max-w-4xl p-10 text-center">
        <p className="text-sm font-medium">Course offering not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/course-setup">Back to Course Setup</Link>
        </Button>
      </div>
    );
  }

  const course = courses.find((c) => c.id === o.curriculum_course_id);
  const department = departments.find((d) => d.id === course?.department_id);
  const semester = semesters.find((s) => s.id === o.semester_type_id);
  const findProfile = (pid: string | null) => profiles.find((p) => p.id === pid);
  const instructor = findProfile(o.instructor_id);
  const coList = outcomes.data ?? [];

  const usedPoIds = new Set((details.data?.po ?? []).map((m) => m.program_outcome_id));
  const usedKpIds = new Set((details.data?.kp ?? []).map((m) => m.knowledge_profile_id));
  const usedPaIds = new Set((details.data?.pa ?? []).map((m) => m.complex_problem_attribute_id));

  const usedPos = programOutcomes.filter((p) => usedPoIds.has(p.id));
  const usedKps = knowledgeProfiles.filter((p) => usedKpIds.has(p.id));
  const usedPas = problemAttributes.filter((p) => usedPaIds.has(p.id));

  const required = (refs.data ?? []).filter((r) => r.kind === "required");
  const recommended = (refs.data ?? []).filter((r) => r.kind === "recommended");

  const deptLabel = department ? `${department.name} (${department.code})` : "—";

  const signatories = [
    {
      role: "Prepared by",
      profile: findProfile(o.created_by),
      at: o.created_at,
      fallbackDesignation: "Course Instructor",
    },
    {
      role: "Checked by",
      profile: findProfile(o.checked_by),
      at: o.checked_at,
      fallbackDesignation: `OBE Program Coordinator${department ? `, ${department.code}` : ""}`,
    },
    {
      role: "Approved by",
      profile: findProfile(o.approved_by),
      at: o.approved_at,
      fallbackDesignation: `Head of the Department${department ? `, ${department.code}` : ""}`,
    },
  ];

  return (
    <div className="min-h-screen bg-muted/40 py-6 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-[900px] flex-wrap items-center justify-between gap-2 px-4 print:hidden">
        <Button asChild variant="ghost" size="sm">
          <Link to="/course-setup/$id" params={{ id }}>
            <ArrowLeft className="mr-2 size-4" /> Back to the form
          </Link>
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="mr-2 size-4" /> Print / Save as PDF
        </Button>
      </div>

      <article className="mx-auto max-w-[900px] space-y-6 bg-card px-8 py-10 text-sm leading-relaxed text-foreground shadow-[var(--shadow-card)] print:max-w-none print:shadow-none">
        <header className="space-y-2 text-center">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={`${institution.data?.name ?? "University"} logo`}
              className="mx-auto h-16 object-contain"
            />
          )}
          <h1 className="text-xl font-bold tracking-tight">
            {institution.data?.name ?? "Ahsanullah University of Science and Technology"}
          </h1>
          <p className="mx-auto max-w-2xl text-xs text-muted-foreground">{institution.data?.sponsor_line}</p>
          <h2 className="pt-3 text-base font-bold uppercase tracking-widest">Course Details</h2>
        </header>

        <section className="space-y-1.5">
          <Item n="1" label="Course title" value={course?.course_title ?? "—"} />
          <Item n="2" label="Course code" value={course?.course_code ?? "—"} />
          <Item n="3" label="Credit hours" value={String(o.credit_hours)} />
          <Item
            n="4"
            label="Level"
            value={`Year: ${o.level_year ?? "—"}, Semester: ${o.level_semester ?? "—"}`}
          />
          <Item n="5" label="Semester offered" value={`${semester?.code ?? "—"} ${o.academic_year}`} />
          <Item n="6" label="Programme" value={o.programme || "—"} />
          <Item n="7" label="Department" value={deptLabel} />
          <Item n="8" label="Faculty" value={o.faculty_name || "—"} />
          <div>
            <p className="font-semibold">9. Synopsis:</p>
            <p className="mt-1 whitespace-pre-line pl-6 text-justify">{o.synopsis || "—"}</p>
          </div>
          <Item n="10" label="Type of course (core/elective)" value={o.course_category} />
          <Item n="11" label="Prerequisite(s) (if any)" value={o.prerequisites || "N/A"} />
          <div>
            <p className="font-semibold">12. Name of the instructor(s) with contact details and office hours:</p>
            <table className="mt-2 w-full border border-border">
              <tbody>
                <Row label="Course Instructor’s Name" value={profileLabel(instructor)} />
                <Row label="Designation" value={instructor?.designation || "—"} />
                <Row label="Room" value={instructor?.room_no || "—"} />
                <Row label="Phone" value={instructor?.phone || "—"} />
                <Row label="E-mail" value={instructor?.email || "—"} />
                <tr className="border-t border-border align-top">
                  <th className="w-64 border-r border-border p-2 text-left font-medium">Consultation Hour</th>
                  <td className="p-2">
                    {(slots.data ?? []).length === 0 ? (
                      o.consultation_hours || "—"
                    ) : (
                      <ul className="list-inside list-disc space-y-0.5">
                        {(slots.data ?? []).map((s) => (
                          <li key={s.id}>{formatSlot(s)}</li>
                        ))}
                      </ul>
                    )}
                    {(slots.data ?? []).length > 0 && o.consultation_hours && (
                      <p className="mt-1 text-xs text-muted-foreground">{o.consultation_hours}</p>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold">
            13. Mapping of Course Outcomes (COs) with Program Outcomes (POs) and Bloom’s Taxonomy Level
          </h3>
          <p>After completion of the course, the students will be expected to:</p>
          <table className="w-full border border-border text-xs">
            <thead>
              <tr className="bg-muted/60">
                <th className="border border-border p-2 text-left">CO No.</th>
                <th className="border border-border p-2 text-left">CO statement</th>
                <th className="border border-border p-2 text-left">PO No.</th>
                <th className="border border-border p-2 text-left">K / P / A</th>
                <th className="border border-border p-2 text-left">Bloom’s Taxonomy (Domain/level)</th>
                <th className="border border-border p-2 text-left">Delivery Methods and Activities</th>
                <th className="border border-border p-2 text-left">Assessment Method</th>
              </tr>
            </thead>
            <tbody>
              {coList.length === 0 && (
                <tr>
                  <td colSpan={7} className="border border-border p-3 text-muted-foreground">
                    No course outcomes defined.
                  </td>
                </tr>
              )}
              {coList.map((co, i) => {
                const b = bloom.find((x) => x.id === co.bloom_taxonomy_level_id);
                const po = (details.data?.po ?? [])
                  .filter((m) => m.course_outcome_id === co.id)
                  .map((m) => programOutcomes.find((p) => p.id === m.program_outcome_id)?.code)
                  .filter(Boolean);
                const kp = (details.data?.kp ?? [])
                  .filter((m) => m.course_outcome_id === co.id)
                  .map((m) => knowledgeProfiles.find((p) => p.id === m.knowledge_profile_id)?.code)
                  .filter(Boolean);
                const pa = (details.data?.pa ?? [])
                  .filter((m) => m.course_outcome_id === co.id)
                  .map((m) => problemAttributes.find((p) => p.id === m.complex_problem_attribute_id)?.code)
                  .filter(Boolean);
                const tools = (details.data?.tools ?? [])
                  .filter((t) => t.course_outcome_id === co.id)
                  .map((t) => t.tool_name);
                return (
                  <tr key={co.id} className="align-top">
                    <td className="border border-border p-2">{i + 1}</td>
                    <td className="border border-border p-2">{co.co_statement}</td>
                    <td className="border border-border p-2">{po.join(", ") || "—"}</td>
                    <td className="border border-border p-2">{[...kp, ...pa].join(", ") || "—"}</td>
                    <td className="border border-border p-2">{b ? `${b.domain}/${b.level}` : "—"}</td>
                    <td className="border border-border p-2">
                      <Lines text={co.delivery_methods} />
                    </td>
                    <td className="border border-border p-2">
                      {co.assessment_methods ? <Lines text={co.assessment_methods} /> : tools.join(", ") || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="space-y-2">
          <h3 className="font-semibold">Description of PO Indicators</h3>
          <table className="w-full border border-border text-xs">
            <thead>
              <tr className="bg-muted/60">
                <th className="w-20 border border-border p-2 text-left">PO</th>
                <th className="border border-border p-2 text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              {usedPos.length === 0 && (
                <tr>
                  <td colSpan={2} className="border border-border p-3 text-muted-foreground">
                    No POs mapped yet.
                  </td>
                </tr>
              )}
              {usedPos.map((p) => (
                <tr key={p.id} className="align-top">
                  <td className="border border-border p-2 font-medium">{p.code}</td>
                  <td className="border border-border p-2">
                    <span className="font-medium">{p.title}: </span>
                    {p.description || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="space-y-2">
          <h3 className="font-semibold">
            Description of Applicable Knowledge Profiles{" "}
            {usedKps.length > 0 && `(${usedKps.map((k) => k.code).join(", ")})`} and CEP Attributes{" "}
            {usedPas.length > 0 && `(${usedPas.map((k) => k.code).join(", ")})`}
          </h3>
          <table className="w-full border border-border text-xs">
            <tbody>
              {usedKps.length === 0 && usedPas.length === 0 && (
                <tr>
                  <td className="border border-border p-3 text-muted-foreground">
                    No knowledge profiles or CEP attributes mapped yet.
                  </td>
                </tr>
              )}
              {[...usedKps, ...usedPas].map((k) => (
                <tr key={k.id} className="align-top">
                  <td className="w-16 border border-border p-2 font-medium">{k.code}</td>
                  <td className="w-52 border border-border p-2">{k.title || "—"}</td>
                  <td className="border border-border p-2">{k.description || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold">14. Percentages of Assessment Methods</h3>
          <table className="w-full border border-border text-xs">
            <thead>
              <tr className="bg-muted/60">
                <th className="border border-border p-2 text-left">Method</th>
                <th className="w-32 border border-border p-2 text-left">Percentage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border p-2">Class Performance</td>
                <td className="border border-border p-2">{o.grading_weight_class_performance}</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Quizzes / Assignments</td>
                <td className="border border-border p-2">{o.grading_weight_quiz_assignment}</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Final Examination</td>
                <td className="border border-border p-2">{o.grading_weight_final}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold">15. Week wise distribution of contents and assessment methods</h3>
          <table className="w-full border border-border text-xs">
            <thead>
              <tr className="bg-muted/60">
                <th className="w-14 border border-border p-2 text-left">Week</th>
                <th className="border border-border p-2 text-left">Topics</th>
                <th className="border border-border p-2 text-left">Teaching-Learning Strategy</th>
                <th className="border border-border p-2 text-left">Assessment Strategy</th>
                <th className="w-28 border border-border p-2 text-left">Corresponding COs</th>
              </tr>
            </thead>
            <tbody>
              {(schedule.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="border border-border p-3 text-muted-foreground">
                    No weekly plan recorded.
                  </td>
                </tr>
              )}
              {(schedule.data ?? []).map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="border border-border p-2">{r.week_number}</td>
                  <td className="border border-border p-2 whitespace-pre-line">{r.topic}</td>
                  <td className="border border-border p-2">
                    <Lines text={r.delivery_method} />
                  </td>
                  <td className="border border-border p-2">
                    <Lines text={r.assessment_strategy} />
                  </td>
                  <td className="border border-border p-2">
                    {coList.find((c) => c.id === r.course_outcome_id)?.co_number ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold">16. References</h3>
          <div>
            <p className="font-semibold">16.1 Required</p>
            {required.length === 0 ? (
              <p className="pl-6 text-muted-foreground">—</p>
            ) : (
              <ol className="list-inside list-decimal space-y-1 pl-6">
                {required.map((r) => (
                  <li key={r.id}>{r.citation}</li>
                ))}
              </ol>
            )}
          </div>
          <div>
            <p className="font-semibold">16.2 Recommended</p>
            {recommended.length === 0 ? (
              <p className="pl-6 text-muted-foreground">—</p>
            ) : (
              <ol className="list-inside list-decimal space-y-1 pl-6">
                {recommended.map((r) => (
                  <li key={r.id}>{r.citation}</li>
                ))}
              </ol>
            )}
          </div>
        </section>

        <section className="grid gap-6 pt-8 sm:grid-cols-3">
          {signatories.map((s) => (
            <div key={s.role} className="space-y-1">
              <div className="h-12 border-b border-foreground/60" />
              <p className="text-xs font-semibold uppercase tracking-wide">{s.role}</p>
              <p className="font-medium">{s.profile ? profileLabel(s.profile) : "—"}</p>
              <p className="text-xs text-muted-foreground">
                {s.profile?.designation || s.fallbackDesignation}
              </p>
              <p className="text-xs text-muted-foreground">
                {departments.find((d) => d.id === s.profile?.department_id)?.name ?? deptLabel}
              </p>
              <p className="text-xs text-muted-foreground">Date: {fmtDate(s.at)}</p>
            </div>
          ))}
        </section>
      </article>
    </div>
  );
}

function Item({ n, label, value }: { n: string; label: string; value: string }) {
  return (
    <p>
      <span className="font-semibold">
        {n}. {label}:
      </span>{" "}
      {value}
    </p>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-t border-border align-top">
      <th className="w-64 border-r border-border p-2 text-left font-medium">{label}</th>
      <td className="p-2">{value}</td>
    </tr>
  );
}
