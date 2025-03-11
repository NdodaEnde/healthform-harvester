
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Utility to test and validate Row Level Security (RLS) policies
 * for multi-tenant systems
 */
export const rlsTester = {
  /**
   * Test accessing data from a specific table
   * @param tableName The table to test
   * @returns Object with test results
   */
  async testTableAccess(tableName: string) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(10);
      
      return {
        success: !error,
        data,
        error,
        message: error ? `Error: ${error.message}` : `Successfully retrieved ${data?.length || 0} rows`,
      };
    } catch (error) {
      console.error(`Error testing table access for ${tableName}:`, error);
      return {
        success: false,
        error,
        message: `Exception: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },

  /**
   * Test to verify that current user can only access their own documents
   * @returns Test results object
   */
  async testDocumentAccessControl() {
    try {
      // First get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { 
          success: false, 
          message: "No authenticated user found. Please sign in first." 
        };
      }

      // Test documents table access
      const { data, error } = await supabase
        .from('documents')
        .select('*');
      
      if (error) {
        return {
          success: false,
          error,
          message: `Error accessing documents: ${error.message}`
        };
      }

      // Verify all returned documents belong to organizations the user has access to
      const { data: userOrgs } = await supabase.rpc('get_user_organizations');
      
      // Check if all returned documents belong to authorized organizations
      const unauthorizedDocs = data?.filter(doc => 
        doc.organization_id && !userOrgs.includes(doc.organization_id)
      );

      return {
        success: unauthorizedDocs?.length === 0,
        data,
        unauthorizedDocs,
        message: unauthorizedDocs?.length === 0 
          ? `RLS working correctly! All ${data?.length || 0} documents belong to your organizations.` 
          : `RLS FAILURE! Found ${unauthorizedDocs?.length} documents from unauthorized organizations.`,
      };
    } catch (error) {
      console.error("Error testing document access control:", error);
      return {
        success: false,
        error,
        message: `Exception: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },

  /**
   * Run all RLS policy tests and display results
   */
  async runAllTests() {
    const results = {
      documents: await this.testTableAccess('documents'),
      patients: await this.testTableAccess('patients'),
      organizations: await this.testTableAccess('organizations'),
      documentAccessControl: await this.testDocumentAccessControl(),
    };

    console.log("RLS Test Results:", results);
    
    // Notification of test results
    if (Object.values(results).every(r => r.success)) {
      toast({
        title: "RLS Policies Test: SUCCESS",
        description: "All multi-tenant security policies are working correctly.",
        variant: "default",
      });
    } else {
      toast({
        title: "RLS Policies Test: ISSUES FOUND",
        description: "Some RLS policies may not be working correctly. Check console for details.",
        variant: "destructive",
      });
    }

    return results;
  }
};
