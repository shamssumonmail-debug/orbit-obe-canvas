// CO / PO attainment computation for the frontend-only CO Assessment module.
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { round1, sectionGroups, type ScoreSection, type StudentRow } from "./co-assessment";

export type AttainmentBand = {
  scale_value: number;
  category_label: string;
  min_score: number;
  max_score: number;
};

export const fallbackBands: AttainmentBand[] = [
  { scale_value: 1, category_label: "Unsatisfactory", min_score: 0, max_score: 39 },
  { scale_value: 2, category_label: "Developing", min_score: 40, max_score: 59 },
  { scale_value: 3, category_label: "Satisfactory", min_score: 60, max_score: 79 },
  { scale_value: 4, category_label: "Exemplary", min_score: 80, max_score: 100 },
];

export function useAttainmentBands(): AttainmentBand[] {
  const { data } = useQuery({
    queryKey: ["attainment-scale-bands", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attainment_scale_bands")
        .select("scale_value, category_label, min_score, max_score")
        .order("scale_value");
      if (error) throw error;
      return (data ?? []) as AttainmentBand[];
    },
  });
  return data && data.length > 0 ? data : fallbackBands;
}

export function bandFor(bands: AttainmentBand[], percent: number): AttainmentBand {
  const found = bands.find((b) => percent >= Number(b.min_score) && percent <= Number(b.max_score));
  return found ?? bands[bands.length - 1] ?? fallbackBands[0];
}

/** Colour per scale value — low levels red/amber, high levels green. */
export function bandColor(scaleValue: number): string {
  const palette: Record<number, string> = {
    1: "hsl(0 72% 51%)",
    2: "hsl(32 95% 50%)",
    3: "hsl(199 89% 48%)",
    4: "hsl(142 71% 40%)",
    5: "hsl(160 84% 32%)",
  };
  return palette[scaleValue] ?? "hsl(220 9% 55%)";
}

export type CoAttainment = {
  co: string;
  label: string;
  maxScore: number;
  avgPercent: number;
  attainmentPercent: number;
  studentsMeeting: number;
  totalStudents: number;
};

function coKey(coLabel?: string) {
  const match = coLabel?.match(/CO\s*\d+/i);
  return match ? match[0].replace(/\s+/g, "").toUpperCase() : "";
}

/**
 * Attainment per CO. `attainmentPercent` = share of students reaching the
 * per-CO target (default 60% of the marks mapped to that CO).
 */
export function computeCoAttainment(
  sections: ScoreSection[],
  students: StudentRow[],
  targetPercent = 60,
): CoAttainment[] {
  const map = new Map<string, { label: string; leaves: { id: string; max: number }[] }>();

  sections.forEach((section) =>
    sectionGroups(section).forEach((group) => {
      const key = coKey(group.coLabel);
      if (!key) return;
      const entry = map.get(key) ?? { label: group.coLabel ?? key, leaves: [] };
      group.leaves.forEach((leaf) =>
        entry.leaves.push({ id: leaf.id, max: Number(leaf.maxScore) || 0 }),
      );
      map.set(key, entry);
    }),
  );

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([co, entry]) => {
      const maxScore = entry.leaves.reduce((sum, leaf) => sum + leaf.max, 0);
      const percents = students.map((student) => {
        const got = entry.leaves.reduce(
          (sum, leaf) => sum + (Number(student.scores[leaf.id]) || 0),
          0,
        );
        return maxScore > 0 ? (got / maxScore) * 100 : 0;
      });
      const meeting = percents.filter((p) => p >= targetPercent).length;
      return {
        co,
        label: entry.label,
        maxScore: round1(maxScore),
        avgPercent: percents.length
          ? round1(percents.reduce((a, b) => a + b, 0) / percents.length)
          : 0,
        attainmentPercent: percents.length ? round1((meeting / percents.length) * 100) : 0,
        studentsMeeting: meeting,
        totalStudents: percents.length,
      };
    });
}

/** Mock CO → PO mapping used by the frontend-only attainment reports. */
export const MOCK_CO_PO: Record<string, string[]> = {
  CO1: ["PO-a", "PO-b"],
  CO2: ["PO-b", "PO-c"],
  CO3: ["PO-c", "PO-e"],
  CO4: ["PO-d", "PO-e"],
};

export type PoAttainment = { po: string; attainmentPercent: number; contributingCos: string[] };

export function computePoAttainment(coStats: CoAttainment[]): PoAttainment[] {
  const buckets = new Map<string, { total: number; cos: string[] }>();
  coStats.forEach((stat) => {
    (MOCK_CO_PO[stat.co] ?? []).forEach((po) => {
      const entry = buckets.get(po) ?? { total: 0, cos: [] };
      entry.total += stat.attainmentPercent;
      entry.cos.push(stat.co);
      buckets.set(po, entry);
    });
  });
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([po, entry]) => ({
      po,
      attainmentPercent: round1(entry.total / Math.max(1, entry.cos.length)),
      contributingCos: entry.cos,
    }));
}
