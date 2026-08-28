import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { AppShell } from "@/components/obe/app-shell";
import { Badge } from "@/components/ui/badge";
import { RequireAuth } from "@/components/obe/require-auth";
import { MasterDataTable } from "@/components/obe/master-data-table";
import { supabase } from "@/integrations/supabase/client";
import { programOutcomesResource } from "@/lib/master-data";

export const Route = createFileRoute("/master-data/program-outcomes")({
  head: () => ({
    meta: [
      { title: "Program Outcomes · OBE Suite master data" },
      {
        name: "description",
        content: "Maintain the institution-wide list of program outcomes (PO) and program-specific outcomes (PSO).",
      },
      { property: "og:title", content: "Program Outcomes · OBE Suite master data" },
      { property: "og:description", content: "Reference list of PO and PSO codes used across the outcome framework." },
    ],
  }),
  component: ProgramOutcomesRoute,
});

type KnowledgeProfile = { id: string; code: string; title: string; is_active: boolean; display_order: number };
type MappingRow = { program_outcome_id: string; knowledge_profile_id: string };

function ProgramOutcomesRoute() {
  const queryClient = useQueryClient();

  const { data: profiles } = useQuery({
    queryKey: ["knowledge-profiles", "options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_profiles")
        .select("id, code, title, is_active, display_order")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as KnowledgeProfile[];
    },
  });

  const mappingKey = ["po-knowledge-profile-mapping"];
  const { data: mappings } = useQuery({
    queryKey: mappingKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("po_knowledge_profile_mapping")
        .select("program_outcome_id, knowledge_profile_id");
      if (error) throw error;
      return (data ?? []) as MappingRow[];
    },
  });

  const profileById = useMemo(() => {
    const map = new Map<string, KnowledgeProfile>();
    for (const p of profiles ?? []) map.set(p.id, p);
    return map;
  }, [profiles]);

  const byOutcome = useMemo(() => {
    const out: Record<string, Record<string, string[]>> = {};
    for (const m of mappings ?? []) {
      const bucket = out[m.program_outcome_id] ?? { knowledge_profiles: [] };
      bucket["knowledge_profiles"] = [...(bucket["knowledge_profiles"] ?? []), m.knowledge_profile_id];
      out[m.program_outcome_id] = bucket;
    }
    return out;
  }, [mappings]);

  const options = useMemo(
    () =>
      (profiles ?? [])
        .filter((p) => p.is_active)
        .map((p) => ({ value: p.id, label: `${p.code} — ${p.title}` })),
    [profiles],
  );

  const saveMapping = async (rowId: string, values: Record<string, unknown>) => {
    const selected = Array.isArray(values["knowledge_profiles"])
      ? (values["knowledge_profiles"] as string[])
      : [];
    const { error: deleteError } = await supabase
      .from("po_knowledge_profile_mapping")
      .delete()
      .eq("program_outcome_id", rowId);
    if (deleteError) throw deleteError;
    if (selected.length > 0) {
      const { error: insertError } = await supabase
        .from("po_knowledge_profile_mapping")
        .insert(selected.map((id) => ({ program_outcome_id: rowId, knowledge_profile_id: id })));
      if (insertError) throw insertError;
    }
    await queryClient.invalidateQueries({ queryKey: mappingKey });
  };

  const renderProfileBadges = (row: Record<string, unknown>) => {
    const ids = byOutcome[String(row["id"])]?.["knowledge_profiles"] ?? [];
    const codes = ids
      .map((id) => profileById.get(id)?.code)
      .filter((c): c is string => Boolean(c))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    if (codes.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1">
        {codes.map((code) => (
          <Badge key={code} variant="secondary" className="px-1.5 py-0 text-[10px] font-medium">
            {code}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <RequireAuth>
      <AppShell title="Program Outcomes" subtitle="Master data · reference list of PO / PSO codes">
        <MasterDataTable
          resource={programOutcomesResource}
          multiSelectOptions={{ knowledge_profiles: options }}
          virtualValues={byOutcome}
          onAfterSave={saveMapping}
          renderCellExtra={{ title: renderProfileBadges }}
          detail={{ attachTo: "title", field: "description" }}
        />
      </AppShell>
    </RequireAuth>
  );
}
