import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export const LOGO_BUCKET = "branding";

export type InstitutionProfileRow = {
  id: string;
  name: string;
  short_name: string;
  code: string;
  sponsor_line: string;
  logo_url: string | null;
  affiliated_to: string;
  accreditation: string;
  academic_year: string;
  term: string;
  email: string;
  phone: string;
  website: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  vision: string;
  mission: string;
  attainment_scale: string;
  target_attainment: string;
  enable_indirect_feedback: boolean;
  auto_calculate_attainment: boolean;
};

export const INSTITUTION_QUERY_KEY = ["institution-profile"] as const;

export function useInstitution() {
  return useQuery({
    queryKey: INSTITUTION_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institution_profile")
        .select("*")
        .order("created_at")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as InstitutionProfileRow | null;
    },
  });
}

export function useSaveInstitution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<InstitutionProfileRow> & { id: string }) => {
      const { id, ...rest } = patch;
      const { error } = await supabase.from("institution_profile").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INSTITUTION_QUERY_KEY });
    },
  });
}

/** Signed URL for a logo stored as a path inside the private branding bucket. */
export function useLogoUrl(path: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!path) {
      setUrl(null);
      return;
    }
    if (/^https?:\/\//.test(path)) {
      setUrl(path);
      return;
    }
    let active = true;
    supabase.storage
      .from(LOGO_BUCKET)
      .createSignedUrl(path, 60 * 60)
      .then(({ data }) => {
        if (active) setUrl(data?.signedUrl ?? null);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [path]);

  return url;
}

export async function uploadLogo(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `logo-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(LOGO_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    ...(file.type ? { contentType: file.type } : {}),
  });
  if (error) throw error;
  return path;
}
