import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type MyProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  designation: string | null;
  room_no: string | null;
  department_id: string | null;
};

export const MY_PROFILE_QUERY_KEY = ["my-profile"] as const;

export function useMyProfile() {
  return useQuery({
    queryKey: MY_PROFILE_QUERY_KEY,
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const id = auth.user?.id;
      if (!id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, designation, room_no, department_id")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as MyProfileRow | null;
    },
  });
}

export function useSaveMyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Omit<MyProfileRow, "id" | "email">> & { id: string }) => {
      const { id, ...rest } = patch;
      const { error } = await supabase.from("profiles").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MY_PROFILE_QUERY_KEY });
    },
  });
}
