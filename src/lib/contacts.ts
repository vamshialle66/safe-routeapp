import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Contact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

export function useContacts(userId: string | undefined) {
  return useQuery({
    queryKey: ["contacts", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Contact[]> => {
      const { data, error } = await supabase
        .from("emergency_contacts")
        .select("id, name, phone, relation")
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddContact(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: Omit<Contact, "id">) => {
      if (!userId) throw new Error("Please sign in first.");
      const { error } = await supabase.from("emergency_contacts").insert({ ...c, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts", userId] }),
  });
}

export function useRemoveContact(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("emergency_contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts", userId] }),
  });
}
