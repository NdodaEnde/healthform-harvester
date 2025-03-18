
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Organization } from "@/types/organization";

export function useOrganizationData() {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [currentClient, setCurrentClient] = useState<Organization | null>(null);
  const [userOrganizations, setUserOrganizations] = useState<Organization[]>([]);
  const [clientOrganizations, setClientOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  
  const loadOrganizationData = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Clear organization state if user is logged out
        setCurrentOrganization(null);
        setCurrentClient(null);
        setUserOrganizations([]);
        setClientOrganizations([]);
        setLoading(false);
        return;
      }
      
      // Get all organizations for the current user
      const { data: orgUsers, error: orgUsersError } = await supabase
        .from("organization_users")
        .select(`
          organization_id,
          role,
          organizations:organization_id (
            id,
            name,
            organization_type,
            logo_url,
            contact_email,
            settings
          )
        `)
        .eq("user_id", user.id);
        
      if (orgUsersError) {
        throw orgUsersError;
      }
      
      const orgs = orgUsers?.map(ou => ({
        ...ou.organizations,
        userRole: ou.role
      })) || [];
      
      setUserOrganizations(orgs);
      
      // Get the current organization from localStorage or use the first one
      const storedOrgId = localStorage.getItem("currentOrganizationId");
      let currentOrg = null;
      
      if (storedOrgId) {
        currentOrg = orgs.find(org => org.id === storedOrgId) || null;
      }
      
      if (!currentOrg && orgs.length > 0) {
        currentOrg = orgs[0];
      }
      
      if (currentOrg) {
        setCurrentOrganization(currentOrg);
        localStorage.setItem("currentOrganizationId", currentOrg.id);
        
        // If service provider, load client organizations
        if (currentOrg.organization_type === "service_provider") {
          await loadClientOrganizations(currentOrg.id);
        }
      } else {
        setClientOrganizations([]);
      }
    } catch (error: any) {
      console.error("Error loading organization data:", error);
      toast({
        title: "Error",
        description: "Failed to load organization data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const loadClientOrganizations = async (serviceProviderId: string) => {
    try {
      // Fixed query that avoids the ambiguous relationship error
      const { data: relationships, error: relationshipsError } = await supabase
        .from("organization_relationships")
        .select("client_id")
        .eq("service_provider_id", serviceProviderId)
        .eq("is_active", true);
        
      if (relationshipsError) {
        throw relationshipsError;
      }
      
      // Extract client IDs
      const clientIds = relationships.map(rel => rel.client_id);
      
      if (clientIds.length === 0) {
        setClientOrganizations([]);
        setCurrentClient(null);
        return;
      }
      
      // Fetch client organizations separately using the client IDs
      const { data: clients, error: clientsError } = await supabase
        .from("organizations")
        .select("id, name, organization_type, logo_url, contact_email, settings")
        .in("id", clientIds);
        
      if (clientsError) {
        throw clientsError;
      }
      
      setClientOrganizations(clients || []);
      
      // Check for stored client selection
      const storedClientId = localStorage.getItem("currentClientId");
      if (storedClientId && storedClientId !== "all_clients") {
        const client = clients?.find(c => c.id === storedClientId);
        if (client) {
          setCurrentClient(client);
        } else {
          // Clear stored client if not found
          localStorage.removeItem("currentClientId");
          setCurrentClient(null);
        }
      } else {
        setCurrentClient(null);
      }
    } catch (error: any) {
      console.error("Error loading client organizations:", error);
      setClientOrganizations([]);
      setCurrentClient(null);
    }
  };
  
  const switchOrganization = async (organizationId: string) => {
    const org = userOrganizations.find(org => org.id === organizationId);
    
    if (org) {
      setCurrentOrganization(org);
      setCurrentClient(null); // Reset client selection
      localStorage.setItem("currentOrganizationId", org.id);
      localStorage.removeItem("currentClientId");
      
      // If service provider, load client organizations
      if (org.organization_type === "service_provider") {
        await loadClientOrganizations(org.id);
      } else {
        setClientOrganizations([]);
      }
    }
  };
  
  const switchClient = (clientId: string | null) => {
    // Handle "all_clients" value
    if (clientId === "all_clients" || clientId === null) {
      setCurrentClient(null);
      localStorage.removeItem("currentClientId");
      return;
    }
    
    const client = clientOrganizations.find(c => c.id === clientId);
    
    if (client) {
      setCurrentClient(client);
      localStorage.setItem("currentClientId", client.id);
    }
  };
  
  // Helper method to determine if current user is in a service provider or direct client
  const isServiceProvider = () => {
    return currentOrganization?.organization_type === "service_provider";
  };
  
  // Get the effective organization for queries (the client if selected, otherwise the main org)
  const getEffectiveOrganizationId = () => {
    if (isServiceProvider() && currentClient) {
      return currentClient.id;
    }
    return currentOrganization?.id || null;
  };

  useEffect(() => {
    loadOrganizationData();
    
    // Listen for auth state changes to reload org data when user logs in/out
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      loadOrganizationData();
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return {
    currentOrganization,
    currentClient,
    userOrganizations,
    clientOrganizations,
    loading,
    switchOrganization,
    switchClient,
    isServiceProvider,
    getEffectiveOrganizationId
  };
}
