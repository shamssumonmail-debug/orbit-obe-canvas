import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, MoreVertical } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { toast } from "sonner";

import { AppShell } from "@/components/obe/app-shell";
import { RequireAuth } from "@/components/obe/require-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/mock-auth";
import {
  attainmentByPo,
  attainmentTrend,
  cognitiveDistribution,
  coSeries,
  obeCounters,
  pendingMapping,
  setupRings,
} from "@/lib/obe-mock-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "OBE Dashboard · Outcome analytics overview" },
      {
        name: "description",
        content:
          "Visual dashboard of outcome based education progress: course outcome setup, CO-PO mapping backlog and PO attainment.",
      },
      { property: "og:title", content: "OBE Dashboard · Outcome analytics overview" },
      {
        property: "og:description",
        content: "Charts for course outcome setup, corrective measures, CO-PO mapping backlog and PO attainment.",
      },
    ],
  }),
  component: DashboardRoute,
});

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

function CardMenu() {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground"
      aria-label="Card options"
      onClick={() => toast.info("Card actions arrive with the backend milestone")}
    >
      <MoreVertical className="size-4" />
    </Button>
  );
}

function RingCard({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = Math.min(100, Math.round((value / total) * 100));
  return (
    <Card className="gap-0 py-0 shadow-[var(--shadow-card)]">
      <CardContent className="relative flex h-[190px] items-center justify-center p-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={[{ name: label, value: pct }]}
            innerRadius="72%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" cornerRadius={12} fill="var(--chart-1)" background={{ fill: "var(--muted)" }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <span className="absolute text-3xl font-semibold tabular-nums">{value}</span>
      </CardContent>
      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <p className="text-sm font-semibold">{label}</p>
        <CardMenu />
      </div>
    </Card>
  );
}

function DashboardRoute() {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "super_admin";

  return (
    <AppShell
      title="Outcome Based Education"
      subtitle={
        isAdmin
          ? "Institution-wide outcome setup and attainment overview"
          : `Your courses in ${user?.department}`
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Card className="gap-0 py-0 shadow-[var(--shadow-card)]">
            <CardContent className="flex h-[190px] flex-col justify-center gap-4 p-6">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Programs</p>
                <p className="text-3xl font-semibold tabular-nums">{obeCounters.programs}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Courses</p>
                <p className="text-3xl font-semibold tabular-nums">{obeCounters.courses}</p>
              </div>
            </CardContent>
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-sm font-semibold">OBE Counters</p>
              <CardMenu />
            </div>
          </Card>
          {setupRings.map((ring) => (
            <RingCard key={ring.label} {...ring} />
          ))}
        </div>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader className="flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => toast.info("CO-PO Mapping Setup arrives with the backend milestone")}
            >
              Go To CO-PO Mapping Setup <ArrowRight className="ml-1 size-4" />
            </Button>
            <CardTitle className="text-base font-medium text-muted-foreground">Pending CO-PO Mapping Setup</CardTitle>
            <CardMenu />
          </CardHeader>
          <CardContent className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pendingMapping} margin={{ left: 4, right: 8 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="group"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  angle={-90}
                  textAnchor="end"
                  height={70}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  label={{
                    value: "Count of Pending PO Mapping",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 11, fill: "var(--muted-foreground)" },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                />
                <Legend iconType="square" wrapperStyle={{ fontSize: 11 }} />
                {coSeries.map((co, i) => (
                  <Bar key={co} dataKey={co} stackId="co" fill={CHART_COLORS[i]} barSize={18} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="shadow-[var(--shadow-card)] lg:col-span-2">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-base">PO Attainment vs Target</CardTitle>
              <CardMenu />
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attainmentByPo} barGap={-28}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="po" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                  <YAxis domain={[0, 3]} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="target" fill="var(--muted)" barSize={28} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" fill="var(--chart-1)" barSize={28} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-base">Cognitive Level Distribution</CardTitle>
              <CardMenu />
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cognitiveDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={92}
                    paddingAngle={2}
                  >
                    {cognitiveDistribution.map((entry, i) => (
                      <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-base">Attainment Trend (Direct vs Indirect)</CardTitle>
            <CardMenu />
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attainmentTrend}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="term" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <YAxis domain={[0, 3]} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                />
                <Legend iconType="plainline" wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="direct" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="indirect" stroke="var(--chart-3)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
