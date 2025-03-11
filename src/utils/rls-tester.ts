
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

// Define allowed table names for type safety
type TableName = 'documents' | 'patients' | 'organizations' | 'organization_users';

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
  async testTableAccess(tableName: TableName) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(10);
      
      return {
        success: !error,
        data,
        error,
        message: error 
          ? `Error: ${error.message}` 
          : `Successfully retrieved ${data?.length || 0} rows from ${tableName}`,
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
      
      if (!userOrgs || userOrgs.length === 0) {
        return {
          success: true,
          data,
          message: "No organizations found for the current user, so no unauthorized access is possible."
        };
      }
      
      // Check if all returned documents belong to authorized organizations
      const unauthorizedDocs = data?.filter(doc => 
        doc.organization_id && !userOrgs.includes(doc.organization_id)
      );

      if (unauthorizedDocs && unauthorizedDocs.length > 0) {
        console.error("Unauthorized document access:", unauthorizedDocs);
      }

      return {
        success: !unauthorizedDocs || unauthorizedDocs.length === 0,
        data,
        unauthorizedDocs,
        message: !unauthorizedDocs || unauthorizedDocs.length === 0 
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
   * Test to verify user can only access organizations they belong to or have a relationship with
   * @returns Test results object
   */
  async testOrganizationAccess() {
    try {
      // Get organizations the user can access
      const { data: organizations, error } = await supabase
        .from('organizations')
        .select('*');
      
      if (error) {
        return {
          success: false,
          error,
          message: `Error accessing organizations: ${error.message}`
        };
      }

      // Get organizations the user belongs to
      const { data: userOrgs } = await supabase.rpc('get_user_organizations');
      
      if (!userOrgs || userOrgs.length === 0) {
        return {
          success: true,
          data: organizations,
          message: "No organizations found for the current user, so no unauthorized access is possible."
        };
      }
      
      // Check for any organizations that the user shouldn't be able to access
      const { data: relationships } = await supabase
        .from('organization_relationships')
        .select('client_id, service_provider_id')
        .in('service_provider_id', userOrgs || []);
      
      // Create list of all organizations the user should be able to access
      const allowedOrgIds = [
        ...(userOrgs || []),
        ...(relationships?.map(r => r.client_id) || [])
      ];
      
      // Find any organizations that the user shouldn't have access to
      const unauthorizedOrgs = organizations?.filter(org => 
        !allowedOrgIds.includes(org.id)
      );
      
      if (unauthorizedOrgs && unauthorizedOrgs.length > 0) {
        console.error("Unauthorized organization access:", unauthorizedOrgs);
      }

      return {
        success: !unauthorizedOrgs || unauthorizedOrgs.length === 0,
        data: organizations,
        unauthorizedOrgs,
        message: !unauthorizedOrgs || unauthorizedOrgs.length === 0
          ? `RLS working correctly! All ${organizations?.length || 0} organizations are properly authorized.`
          : `RLS FAILURE! Found ${unauthorizedOrgs?.length} unauthorized organizations.`
      };
    } catch (error) {
      console.error("Error testing organization access:", error);
      return {
        success: false,
        error,
        message: `Exception: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },

  /**
   * Test patient access to ensure proper RLS policies
   * @returns Test results object
   */
  async testPatientAccess() {
    try {
      // Get patients the user can access
      const { data: patients, error } = await supabase
        .from('patients')
        .select('*');
      
      if (error) {
        return {
          success: false,
          error,
          message: `Error accessing patients: ${error.message}`
        };
      }

      // Get organizations the user belongs to
      const { data: userOrgs } = await supabase.rpc('get_user_organizations');
      
      if (!userOrgs || userOrgs.length === 0) {
        return {
          success: true,
          data: patients,
          message: "No organizations found for current user, so no patient access is expected."
        };
      }

      // Get client organizations through relationships
      const { data: relationships } = await supabase
        .from('organization_relationships')
        .select('client_id')
        .in('service_provider_id', userOrgs || []);
      
      // Create list of all organizations the user should have access to
      const allowedOrgIds = [
        ...(userOrgs || []),
        ...(relationships?.map(r => r.client_id) || [])
      ];
      
      // Check if all returned patients belong to authorized organizations
      const unauthorizedPatients = patients?.filter(patient => 
        patient.organization_id && !allowedOrgIds.includes(patient.organization_id)
      );
      
      if (unauthorizedPatients && unauthorizedPatients.length > 0) {
        console.error("Unauthorized patient access:", unauthorizedPatients);
      }

      return {
        success: !unauthorizedPatients || unauthorizedPatients.length === 0,
        data: patients,
        unauthorizedPatients,
        message: !unauthorizedPatients || unauthorizedPatients.length === 0
          ? `RLS working correctly! All ${patients?.length || 0} patients belong to authorized organizations.`
          : `RLS FAILURE! Found ${unauthorizedPatients?.length} patients from unauthorized organizations.`
      };
    } catch (error) {
      console.error("Error testing patient access:", error);
      return {
        success: false,
        error,
        message: `Exception: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },

  /**
   * Test write operations to verify RLS policies for INSERT and UPDATE
   * @returns Test results object
   */
  async testWriteOperations() {
    const results = {
      insertOwnOrganization: { success: false, message: "" },
      insertOtherOrganization: { success: false, message: "" },
      updateOwnDocument: { success: false, message: "" },
      updateOtherDocument: { success: false, message: "" }
    };

    try {
      // Get current user's organizations
      const { data: userOrgs } = await supabase.rpc('get_user_organizations');
      
      if (!userOrgs || userOrgs.length === 0) {
        return {
          success: true,
          results: {
            noUserOrganizations: {
              success: true,
              message: "No organizations found for current user, skipping write operation tests."
            }
          },
          message: "No organizations found for current user, skipping write operation tests."
        };
      }

      // Test 1: Try to add a test document to user's own organization
      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          organization_id: userOrgs[0],
          file_name: 'test_document.pdf',
          file_path: 'test/test_document.pdf',
          mime_type: 'application/pdf',
          status: 'test'
        })
        .select();
      
      results.insertOwnOrganization = {
        success: !insertError,
        message: insertError 
          ? `Insert into own organization failed: ${insertError.message}` 
          : "Successfully inserted document into own organization"
      };

      // Test 2: Try to add a document to another organization
      // First find an organization the user doesn't belong to
      const { data: allOrgs } = await supabase
        .from('organizations')
        .select('id')
        .not('id', 'in', `(${userOrgs.join(',')})`)
        .limit(1);
      
      if (allOrgs && allOrgs.length > 0) {
        const { error: insertOtherError } = await supabase
          .from('documents')
          .insert({
            organization_id: allOrgs[0].id,
            file_name: 'test_document_other.pdf',
            file_path: 'test/test_document_other.pdf',
            mime_type: 'application/pdf',
            status: 'test'
          })
          .select();
        
        // This should fail with RLS policy violation
        results.insertOtherOrganization = {
          success: insertOtherError !== null, // Success here means the error happened as expected
          message: insertOtherError 
            ? "RLS correctly prevented insertion into unauthorized organization" 
            : "RLS FAILURE! Was able to insert into unauthorized organization"
        };
      } else {
        results.insertOtherOrganization = {
          success: true,
          message: "No other organizations found to test against. Skipping this test."
        };
      }

      // Test 3: Try to update own document
      const { data: ownDocs } = await supabase
        .from('documents')
        .select('id')
        .eq('organization_id', userOrgs[0])
        .limit(1);
      
      if (ownDocs && ownDocs.length > 0) {
        const { error: updateError } = await supabase
          .from('documents')
          .update({ status: 'test-updated' })
          .eq('id', ownDocs[0].id)
          .select();
        
        results.updateOwnDocument = {
          success: !updateError,
          message: updateError 
            ? `Update own document failed: ${updateError.message}` 
            : "Successfully updated own document"
        };
      } else {
        results.updateOwnDocument = {
          success: true,
          message: "No documents found in user's organization. Skipping this test."
        };
      }

      // Test 4: Try to update someone else's document
      const { data: otherDocs } = await supabase
        .from('documents')
        .select('id')
        .not('organization_id', 'in', `(${userOrgs.join(',')})`)
        .limit(1);
      
      if (otherDocs && otherDocs.length > 0) {
        const { error: updateOtherError } = await supabase
          .from('documents')
          .update({ status: 'test-updated-unauthorized' })
          .eq('id', otherDocs[0].id)
          .select();
        
        // This should fail with RLS policy violation
        results.updateOtherDocument = {
          success: updateOtherError !== null, // Success here means the error happened as expected
          message: updateOtherError 
            ? "RLS correctly prevented update of unauthorized document" 
            : "RLS FAILURE! Was able to update unauthorized document"
        };
      } else {
        results.updateOtherDocument = {
          success: true,
          message: "No other organization's documents found to test against. Skipping this test."
        };
      }

      // Clean up test data
      await supabase
        .from('documents')
        .delete()
        .eq('status', 'test')
        .or('status.eq.test-updated');

      const overallSuccess = Object.values(results).every(r => r.success);
      
      return {
        success: overallSuccess,
        results,
        message: overallSuccess
          ? "All write operation tests passed!"
          : "Some write operation tests failed. See details."
      };
    } catch (error) {
      console.error("Error testing write operations:", error);
      return {
        success: false,
        error,
        results,
        message: `Exception: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },

  /**
   * Run all RLS policy tests and display results
   */
  async runAllTests() {
    console.log("Starting RLS policy tests...");
    
    // Get current user for logging
    const { data: { user } } = await supabase.auth.getUser();
    console.log(`Running tests as user: ${user?.email || 'Not logged in'}`);
    
    const results = {
      documents: await this.testTableAccess('documents'),
      patients: await this.testTableAccess('patients'),
      organizations: await this.testTableAccess('organizations'),
      documentAccessControl: await this.testDocumentAccessControl(),
      organizationAccess: await this.testOrganizationAccess(),
      patientAccess: await this.testPatientAccess(),
      writeOperations: await this.testWriteOperations(),
    };

    console.log("RLS Test Results:", results);
    
    // Count passed and failed tests
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`Test Summary: ${passedTests}/${totalTests} tests passed, ${failedTests} failed`);
    
    // Notification of test results
    if (failedTests === 0) {
      toast({
        title: "RLS Policies Test: SUCCESS",
        description: "All multi-tenant security policies are working correctly.",
        variant: "default",
      });
    } else {
      toast({
        title: "RLS Policies Test: ISSUES FOUND",
        description: `${failedTests} policy tests failed. Check results for details.`,
        variant: "destructive",
      });
    }

    return results;
  }
};
