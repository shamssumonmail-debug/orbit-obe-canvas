-- ============================================================
-- 1. profiles (staff directory; no users/profiles table existed)
-- ============================================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.can_manage_master_data())
  WITH CHECK (id = auth.uid() OR public.can_manage_master_data());

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, full_name, email)
SELECT u.id,
       COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
       u.email
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. helper roles
-- ============================================================
-- Any of faculty / obe_coordinator / super_admin may author course setup data.
CREATE OR REPLACE FUNCTION public.can_author_course_setup()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'obe_coordinator', 'faculty')
  )
$$;

REVOKE ALL ON FUNCTION public.can_author_course_setup() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_author_course_setup() TO authenticated, service_role;

-- ============================================================
-- 3. course_offerings
-- ============================================================
CREATE TABLE public.course_offerings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_course_id uuid NOT NULL REFERENCES public.curriculum_courses(id),
  academic_year int NOT NULL CHECK (academic_year BETWEEN 2015 AND 2100),
  semester_type_id uuid NOT NULL REFERENCES public.semester_types(id),
  section text NOT NULL,
  course_type text NOT NULL CHECK (course_type IN ('Theory','Sessional')),
  credit_hours numeric NOT NULL,
  instructor_id uuid NOT NULL REFERENCES public.profiles(id),
  consultation_hours text,
  grading_weight_class_performance numeric NOT NULL DEFAULT 0,
  grading_weight_quiz_assignment numeric NOT NULL DEFAULT 0,
  grading_weight_final numeric NOT NULL DEFAULT 0,
  co_attainment_target_percent numeric NOT NULL DEFAULT 60,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','checked','approved')),
  checked_by uuid REFERENCES public.profiles(id),
  checked_at timestamptz,
  approved_by uuid REFERENCES public.profiles(id),
  approved_at timestamptz,
  review_comment text,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT course_offerings_grading_weight_total CHECK (
    grading_weight_class_performance + grading_weight_quiz_assignment + grading_weight_final = 100
  ),
  CONSTRAINT course_offerings_unique_offering UNIQUE (curriculum_course_id, academic_year, semester_type_id, section)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_offerings TO authenticated;
GRANT ALL ON public.course_offerings TO service_role;

ALTER TABLE public.course_offerings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read course_offerings"
  ON public.course_offerings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authors can insert course_offerings"
  ON public.course_offerings FOR INSERT TO authenticated
  WITH CHECK (public.can_author_course_setup() AND created_by = auth.uid());
CREATE POLICY "Owners in draft or managers can update course_offerings"
  ON public.course_offerings FOR UPDATE TO authenticated
  USING ((status = 'draft' AND created_by = auth.uid()) OR public.can_manage_master_data())
  WITH CHECK ((status = 'draft' AND created_by = auth.uid()) OR public.can_manage_master_data());
CREATE POLICY "Owners in draft or managers can delete course_offerings"
  ON public.course_offerings FOR DELETE TO authenticated
  USING ((status = 'draft' AND created_by = auth.uid()) OR public.can_manage_master_data());

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.course_offerings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX course_offerings_curriculum_course_id_idx ON public.course_offerings(curriculum_course_id);
CREATE INDEX course_offerings_status_idx ON public.course_offerings(status);

-- ============================================================
-- 4. child-write helper (mirrors the parent offering rule)
-- ============================================================
CREATE OR REPLACE FUNCTION public.can_edit_course_offering(_offering_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.course_offerings o
    WHERE o.id = _offering_id
      AND ((o.status = 'draft' AND o.created_by = auth.uid()) OR public.can_manage_master_data())
  )
$$;

REVOKE ALL ON FUNCTION public.can_edit_course_offering(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_edit_course_offering(uuid) TO authenticated, service_role;

-- ============================================================
-- 5. course_outcomes
-- ============================================================
CREATE TABLE public.course_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_offering_id uuid NOT NULL REFERENCES public.course_offerings(id) ON DELETE CASCADE,
  co_number text NOT NULL,
  co_statement text NOT NULL,
  bloom_taxonomy_level_id uuid NOT NULL REFERENCES public.bloom_taxonomy_levels(id),
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT course_outcomes_unique_number UNIQUE (course_offering_id, co_number)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_outcomes TO authenticated;
GRANT ALL ON public.course_outcomes TO service_role;

ALTER TABLE public.course_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read course_outcomes"
  ON public.course_outcomes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authors can insert course_outcomes"
  ON public.course_outcomes FOR INSERT TO authenticated
  WITH CHECK (public.can_author_course_setup() AND public.can_edit_course_offering(course_offering_id));
CREATE POLICY "Editors can update course_outcomes"
  ON public.course_outcomes FOR UPDATE TO authenticated
  USING (public.can_edit_course_offering(course_offering_id))
  WITH CHECK (public.can_edit_course_offering(course_offering_id));
CREATE POLICY "Editors can delete course_outcomes"
  ON public.course_outcomes FOR DELETE TO authenticated
  USING (public.can_edit_course_offering(course_offering_id));

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.course_outcomes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX course_outcomes_offering_idx ON public.course_outcomes(course_offering_id);

CREATE OR REPLACE FUNCTION public.can_edit_course_outcome(_course_outcome_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.course_outcomes co
    JOIN public.course_offerings o ON o.id = co.course_offering_id
    WHERE co.id = _course_outcome_id
      AND ((o.status = 'draft' AND o.created_by = auth.uid()) OR public.can_manage_master_data())
  )
$$;

REVOKE ALL ON FUNCTION public.can_edit_course_outcome(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_edit_course_outcome(uuid) TO authenticated, service_role;

-- ============================================================
-- 6. co_po_mapping
-- ============================================================
CREATE TABLE public.co_po_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_outcome_id uuid NOT NULL REFERENCES public.course_outcomes(id) ON DELETE CASCADE,
  program_outcome_id uuid NOT NULL REFERENCES public.program_outcomes(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT co_po_mapping_unique UNIQUE (course_outcome_id, program_outcome_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.co_po_mapping TO authenticated;
GRANT ALL ON public.co_po_mapping TO service_role;

ALTER TABLE public.co_po_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read co_po_mapping"
  ON public.co_po_mapping FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authors can insert co_po_mapping"
  ON public.co_po_mapping FOR INSERT TO authenticated
  WITH CHECK (public.can_author_course_setup() AND public.can_edit_course_outcome(course_outcome_id));
CREATE POLICY "Editors can update co_po_mapping"
  ON public.co_po_mapping FOR UPDATE TO authenticated
  USING (public.can_edit_course_outcome(course_outcome_id))
  WITH CHECK (public.can_edit_course_outcome(course_outcome_id));
CREATE POLICY "Editors can delete co_po_mapping"
  ON public.co_po_mapping FOR DELETE TO authenticated
  USING (public.can_edit_course_outcome(course_outcome_id));

CREATE INDEX co_po_mapping_outcome_idx ON public.co_po_mapping(course_outcome_id);

-- ============================================================
-- 7. co_knowledge_profile_mapping
-- ============================================================
CREATE TABLE public.co_knowledge_profile_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_outcome_id uuid NOT NULL REFERENCES public.course_outcomes(id) ON DELETE CASCADE,
  knowledge_profile_id uuid NOT NULL REFERENCES public.knowledge_profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT co_knowledge_profile_mapping_unique UNIQUE (course_outcome_id, knowledge_profile_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.co_knowledge_profile_mapping TO authenticated;
GRANT ALL ON public.co_knowledge_profile_mapping TO service_role;

ALTER TABLE public.co_knowledge_profile_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read co_knowledge_profile_mapping"
  ON public.co_knowledge_profile_mapping FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authors can insert co_knowledge_profile_mapping"
  ON public.co_knowledge_profile_mapping FOR INSERT TO authenticated
  WITH CHECK (public.can_author_course_setup() AND public.can_edit_course_outcome(course_outcome_id));
CREATE POLICY "Editors can update co_knowledge_profile_mapping"
  ON public.co_knowledge_profile_mapping FOR UPDATE TO authenticated
  USING (public.can_edit_course_outcome(course_outcome_id))
  WITH CHECK (public.can_edit_course_outcome(course_outcome_id));
CREATE POLICY "Editors can delete co_knowledge_profile_mapping"
  ON public.co_knowledge_profile_mapping FOR DELETE TO authenticated
  USING (public.can_edit_course_outcome(course_outcome_id));

CREATE INDEX co_knowledge_profile_mapping_outcome_idx ON public.co_knowledge_profile_mapping(course_outcome_id);

-- ============================================================
-- 8. co_problem_attribute_mapping
-- ============================================================
CREATE TABLE public.co_problem_attribute_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_outcome_id uuid NOT NULL REFERENCES public.course_outcomes(id) ON DELETE CASCADE,
  complex_problem_attribute_id uuid NOT NULL REFERENCES public.complex_problem_attributes(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT co_problem_attribute_mapping_unique UNIQUE (course_outcome_id, complex_problem_attribute_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.co_problem_attribute_mapping TO authenticated;
GRANT ALL ON public.co_problem_attribute_mapping TO service_role;

ALTER TABLE public.co_problem_attribute_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read co_problem_attribute_mapping"
  ON public.co_problem_attribute_mapping FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authors can insert co_problem_attribute_mapping"
  ON public.co_problem_attribute_mapping FOR INSERT TO authenticated
  WITH CHECK (public.can_author_course_setup() AND public.can_edit_course_outcome(course_outcome_id));
CREATE POLICY "Editors can update co_problem_attribute_mapping"
  ON public.co_problem_attribute_mapping FOR UPDATE TO authenticated
  USING (public.can_edit_course_outcome(course_outcome_id))
  WITH CHECK (public.can_edit_course_outcome(course_outcome_id));
CREATE POLICY "Editors can delete co_problem_attribute_mapping"
  ON public.co_problem_attribute_mapping FOR DELETE TO authenticated
  USING (public.can_edit_course_outcome(course_outcome_id));

CREATE INDEX co_problem_attribute_mapping_outcome_idx ON public.co_problem_attribute_mapping(course_outcome_id);

-- ============================================================
-- 9. co_assessment_tools
-- ============================================================
CREATE TABLE public.co_assessment_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_outcome_id uuid NOT NULL REFERENCES public.course_outcomes(id) ON DELETE CASCADE,
  tool_name text NOT NULL,
  max_marks numeric NOT NULL CHECK (max_marks > 0),
  rubric_notes text,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.co_assessment_tools TO authenticated;
GRANT ALL ON public.co_assessment_tools TO service_role;

ALTER TABLE public.co_assessment_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read co_assessment_tools"
  ON public.co_assessment_tools FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authors can insert co_assessment_tools"
  ON public.co_assessment_tools FOR INSERT TO authenticated
  WITH CHECK (public.can_author_course_setup() AND public.can_edit_course_outcome(course_outcome_id));
CREATE POLICY "Editors can update co_assessment_tools"
  ON public.co_assessment_tools FOR UPDATE TO authenticated
  USING (public.can_edit_course_outcome(course_outcome_id))
  WITH CHECK (public.can_edit_course_outcome(course_outcome_id));
CREATE POLICY "Editors can delete co_assessment_tools"
  ON public.co_assessment_tools FOR DELETE TO authenticated
  USING (public.can_edit_course_outcome(course_outcome_id));

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.co_assessment_tools
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX co_assessment_tools_outcome_idx ON public.co_assessment_tools(course_outcome_id);

-- ============================================================
-- 10. course_weekly_schedule
-- ============================================================
CREATE TABLE public.course_weekly_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_offering_id uuid NOT NULL REFERENCES public.course_offerings(id) ON DELETE CASCADE,
  week_number int NOT NULL,
  topic text NOT NULL,
  course_outcome_id uuid REFERENCES public.course_outcomes(id) ON DELETE SET NULL,
  delivery_method text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT course_weekly_schedule_unique_week UNIQUE (course_offering_id, week_number)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_weekly_schedule TO authenticated;
GRANT ALL ON public.course_weekly_schedule TO service_role;

ALTER TABLE public.course_weekly_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read course_weekly_schedule"
  ON public.course_weekly_schedule FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authors can insert course_weekly_schedule"
  ON public.course_weekly_schedule FOR INSERT TO authenticated
  WITH CHECK (public.can_author_course_setup() AND public.can_edit_course_offering(course_offering_id));
CREATE POLICY "Editors can update course_weekly_schedule"
  ON public.course_weekly_schedule FOR UPDATE TO authenticated
  USING (public.can_edit_course_offering(course_offering_id))
  WITH CHECK (public.can_edit_course_offering(course_offering_id));
CREATE POLICY "Editors can delete course_weekly_schedule"
  ON public.course_weekly_schedule FOR DELETE TO authenticated
  USING (public.can_edit_course_offering(course_offering_id));

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.course_weekly_schedule
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX course_weekly_schedule_offering_idx ON public.course_weekly_schedule(course_offering_id);