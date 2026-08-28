ALTER TABLE public.program_outcomes ADD COLUMN IF NOT EXISTS description text;

CREATE TABLE public.po_knowledge_profile_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_outcome_id uuid NOT NULL REFERENCES public.program_outcomes(id) ON DELETE CASCADE,
  knowledge_profile_id uuid NOT NULL REFERENCES public.knowledge_profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (program_outcome_id, knowledge_profile_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.po_knowledge_profile_mapping TO authenticated;
GRANT ALL ON public.po_knowledge_profile_mapping TO service_role;

ALTER TABLE public.po_knowledge_profile_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read po_knowledge_profile_mapping"
  ON public.po_knowledge_profile_mapping FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can insert po_knowledge_profile_mapping"
  ON public.po_knowledge_profile_mapping FOR INSERT TO authenticated WITH CHECK (public.can_manage_master_data());

CREATE POLICY "Managers can update po_knowledge_profile_mapping"
  ON public.po_knowledge_profile_mapping FOR UPDATE TO authenticated USING (public.can_manage_master_data()) WITH CHECK (public.can_manage_master_data());

CREATE POLICY "Managers can delete po_knowledge_profile_mapping"
  ON public.po_knowledge_profile_mapping FOR DELETE TO authenticated USING (public.can_manage_master_data());

CREATE INDEX idx_po_kp_mapping_po ON public.po_knowledge_profile_mapping(program_outcome_id);
CREATE INDEX idx_po_kp_mapping_kp ON public.po_knowledge_profile_mapping(knowledge_profile_id);