-- 1. Institution profile (singleton)
CREATE TABLE public.institution_profile (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL DEFAULT 'Ahsanullah University of Science and Technology',
  short_name text NOT NULL DEFAULT 'AUST',
  code text NOT NULL DEFAULT 'AUST',
  sponsor_line text NOT NULL DEFAULT '(Sponsored by the Dhaka Ahsania Mission and approved by the Government of the People''s Republic of Bangladesh)',
  logo_url text,
  affiliated_to text NOT NULL DEFAULT '',
  accreditation text NOT NULL DEFAULT '',
  academic_year text NOT NULL DEFAULT '2024-25',
  term text NOT NULL DEFAULT 'Fall',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  address_line text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  pincode text NOT NULL DEFAULT '',
  vision text NOT NULL DEFAULT '',
  mission text NOT NULL DEFAULT '',
  attainment_scale text NOT NULL DEFAULT '3',
  target_attainment text NOT NULL DEFAULT '2.5',
  enable_indirect_feedback boolean NOT NULL DEFAULT true,
  auto_calculate_attainment boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.institution_profile TO authenticated;
GRANT ALL ON public.institution_profile TO service_role;
ALTER TABLE public.institution_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "institution_profile_select" ON public.institution_profile
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "institution_profile_insert" ON public.institution_profile
  FOR INSERT TO authenticated WITH CHECK (public.can_manage_master_data());
CREATE POLICY "institution_profile_update" ON public.institution_profile
  FOR UPDATE TO authenticated USING (public.can_manage_master_data()) WITH CHECK (public.can_manage_master_data());

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.institution_profile
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.institution_profile (name, short_name, code, website, email, phone, address_line, city, state)
VALUES ('Ahsanullah University of Science and Technology', 'AUST', 'AUST',
        'https://aust.edu', 'info@aust.edu', '+880 2 8870422',
        '141 & 142, Love Road, Tejgaon Industrial Area', 'Dhaka', 'Dhaka');

-- 2. Faculty details on staff records
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS designation text,
  ADD COLUMN IF NOT EXISTS room_no text,
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE POLICY "profiles_manager_update" ON public.profiles
  FOR UPDATE TO authenticated USING (public.can_manage_master_data()) WITH CHECK (public.can_manage_master_data());

-- 3. Course offering extra printed-form fields
ALTER TABLE public.course_offerings
  ADD COLUMN IF NOT EXISTS synopsis text,
  ADD COLUMN IF NOT EXISTS course_category text NOT NULL DEFAULT 'Core',
  ADD COLUMN IF NOT EXISTS prerequisites text,
  ADD COLUMN IF NOT EXISTS programme text,
  ADD COLUMN IF NOT EXISTS faculty_name text,
  ADD COLUMN IF NOT EXISTS level_year integer,
  ADD COLUMN IF NOT EXISTS level_semester integer;

ALTER TABLE public.course_offerings
  ADD CONSTRAINT course_offerings_course_category_check
  CHECK (course_category IN ('Core', 'Elective'));

-- 4. Consultation hour slots
CREATE TABLE public.course_consultation_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_offering_id uuid NOT NULL REFERENCES public.course_offerings(id) ON DELETE CASCADE,
  day_of_week text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_consultation_slots TO authenticated;
GRANT ALL ON public.course_consultation_slots TO service_role;
ALTER TABLE public.course_consultation_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ccs_select" ON public.course_consultation_slots
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ccs_insert" ON public.course_consultation_slots
  FOR INSERT TO authenticated WITH CHECK (public.can_edit_course_offering(course_offering_id));
CREATE POLICY "ccs_update" ON public.course_consultation_slots
  FOR UPDATE TO authenticated USING (public.can_edit_course_offering(course_offering_id))
  WITH CHECK (public.can_edit_course_offering(course_offering_id));
CREATE POLICY "ccs_delete" ON public.course_consultation_slots
  FOR DELETE TO authenticated USING (public.can_edit_course_offering(course_offering_id));

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.course_consultation_slots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Weekly schedule assessment strategy
ALTER TABLE public.course_weekly_schedule
  ADD COLUMN IF NOT EXISTS assessment_strategy text;

-- 6. Course outcome delivery / assessment text
ALTER TABLE public.course_outcomes
  ADD COLUMN IF NOT EXISTS delivery_methods text,
  ADD COLUMN IF NOT EXISTS assessment_methods text;

-- 7. References (16.1 required / 16.2 recommended)
CREATE TABLE public.course_references (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_offering_id uuid NOT NULL REFERENCES public.course_offerings(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'required',
  citation text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT course_references_kind_check CHECK (kind IN ('required', 'recommended'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_references TO authenticated;
GRANT ALL ON public.course_references TO service_role;
ALTER TABLE public.course_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cref_select" ON public.course_references
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "cref_insert" ON public.course_references
  FOR INSERT TO authenticated WITH CHECK (public.can_edit_course_offering(course_offering_id));
CREATE POLICY "cref_update" ON public.course_references
  FOR UPDATE TO authenticated USING (public.can_edit_course_offering(course_offering_id))
  WITH CHECK (public.can_edit_course_offering(course_offering_id));
CREATE POLICY "cref_delete" ON public.course_references
  FOR DELETE TO authenticated USING (public.can_edit_course_offering(course_offering_id));

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.course_references
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();