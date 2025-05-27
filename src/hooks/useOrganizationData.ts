
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
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  const loadOrganizationData = async () => {
    try {
      console.log("Loading organization data...");
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Clear organization state if user is logged out
        setCurrentOrganization(null);
        setCurrentClient(null);
        setUserOrganizations([]);
        setClientOrganizations([]);
        setLoading(false);
        setInitialLoadComplete(true);
        console.log("No authenticated user, cleared organization data");
        return;
      }
      
      console.log("Loading organizations for user:", user.id);
      
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
        .eq("user_id", user.id as any);
        
      if (orgUsersError) {
        console.error("Error fetching organizations:", orgUsersError);
        throw orgUsersError;
      }
      
      const orgs = orgUsers?.filter(ou => ou && ou.organizations && 'id' in ou.organizations)
        .map(ou => ({
          ...(ou.organizations as any),
          userRole: ou.role
        })) || [];
      
      console.log("User organizations loaded:", orgs.length);
      setUserOrganizations(orgs);
      
      // Get the current organization from localStorage or use the first one
      const storedOrgId = localStorage.getItem("currentOrganizationId");
      let currentOrg = null;
      
      if (storedOrgId) {
        currentOrg = orgs.find(org => org.id === storedOrgId) || null;
        console.log("Found stored organization:", currentOrg?.name || "None");
      }
      
      if (!currentOrg && orgs.length > 0) {
        currentOrg = orgs[0];
        // Store the first organization as current if none was previously selected
        localStorage.setItem("currentOrganizationId", orgs[0].id);
        console.log("Using first organization:", orgs[0].name);
      }
      
      if (currentOrg) {
        console.log("Setting current organization:", currentOrg.name);
        setCurrentOrganization(currentOrg);
        
        // If service provider, load client organizations
        if (currentOrg.organization_type === "service_provider") {
          await loadClientOrganizations(currentOrg.id);
        } else {
          setClientOrganizations([]);
        }
      } else {
        console.log("No organization available");
        setCurrentOrganization(null);
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
      setInitialLoadComplete(true);
      console.log("Organization data loading complete");
    }
  };
  
  const loadClientOrganizations = async (serviceProviderId: string) => {
    try {
      // Fixed query that avoids the ambiguous relationship error
      const { data: relationships, error: relationshipsError } = await supabase
        .from("organization_relationships")
        .select("client_id")
        .eq("service_provider_id", serviceProviderId as any)
        .eq("is_active", true as any);
        
      if (relationshipsError) {
        throw relationshipsError;
      }
      
      // Extract client IDs safely
      const clientIds = relationships?.filter(rel => rel && 'client_id' in rel).map(rel => rel.client_id) || [];
      
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
      
      setClientOrganizations((clients || []) as unknown as Organization[]);
      
      // Check for stored client selection
      const storedClientId = localStorage.getItem("currentClientId");
      if (storedClientId && storedClientId !== "all_clients") {
        const client = clients?.find(c => c.id === storedClientId);
        if (client) {
          setCurrentClient(client as unknown as Organization);
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
  
  // Updated switchClient to match the type signature and handle edge cases
  const switchClient = (clientId: string) => {
    console.log("switchClient called with:", clientId);
    
    // Handle "all_clients" value
    if (clientId === "all_clients") {
      console.log("Switching to all clients view");
      setCurrentClient(null);
      localStorage.removeItem("currentClientId");
      return;
    }
    
    const client = clientOrganizations.find(c => c.id === clientId);
    
    if (client) {
      console.log("Switching to client:", client.name);
      setCurrentClient(client);
      localStorage.setItem("currentClientId", client.id);
    } else {
      console.warn(`Client with ID ${clientId} not found`);
    }
  };
  
  const isServiceProvider = () => {
    return currentOrganization?.organization_type === "service_provider";
  };
  
  const getEffectiveOrganizationId = () => {
    if (isServiceProvider() && currentClient) {
      return currentClient.id;
    }
    return currentOrganization?.id || null;
  };

  useEffect(() => {
    // Load organization data once when the hook is first used
    loadOrganizationData();
    
    // Listen for auth state changes to reload org data when user logs in/out
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      console.log("Auth state changed:", event);
      // Load organization data after slight delay to ensure auth state is settled
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setTimeout(() => {
          loadOrganizationData();
        }, 100);
      }
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
    initialLoadComplete,
    switchOrganization,
    switchClient,
    isServiceProvider,
    getEffectiveOrganizationId
  };
}
