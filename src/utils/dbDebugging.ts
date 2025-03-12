
import { supabase } from "@/integrations/supabase/client";

export const debugUserOrganizations = async (userId: string) => {
  try {
    // Try multiple approaches to get the user's organizations
    
    // 1. Direct query from organization_users table
    const { data: directQuery, error: directError } = await supabase
      .from("organization_users")
      .select("organization_id, role, created_at")
      .eq("user_id", userId);
      
    if (directError) {
      console.error("Error in direct organization query:", directError);
    }
    
    // 2. Try a raw query instead (this might bypass some RLS issues)
    const { data: rawQuery, error: rawError } = await supabase
      .rpc('get_user_organizations');
      
    if (rawError) {
      console.error("Error in raw organization query:", rawError);
    }
    
    return {
      userId,
      directQuery: directQuery || [],
      rawQuery: rawQuery || [],
      directQuerySuccess: !directError,
      rawQuerySuccess: !rawError
    };
  } catch (error) {
    console.error("Error in debug function:", error);
    return { error: String(error) };
  }
};
