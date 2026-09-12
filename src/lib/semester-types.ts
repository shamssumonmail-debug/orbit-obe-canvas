import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

const FALLBACK = ["Spring", "Summer", "Fall"];

/** Semester type labels from master data, with a safe fallback list. */
export function useSemesterTypeOptions() {
  const { data } = useQuery({
    queryKey: ["semester-types", "options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("semester_types")
        .select("code, display_order, is_active")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return (data ?? []).map((row) => row.code as string);
    },
  });
  return data && data.length > 0 ? data : FALLBACK;
}
