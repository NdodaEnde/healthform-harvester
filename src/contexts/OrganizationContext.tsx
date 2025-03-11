
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface Organization {
  id: string;
  name: string;
  organization_type: string;
  logo_url?: string;
  contact_email?: string;
  userRole?: string;
  settings?: any;
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  currentClient: Organization | null;
  userOrganizations: Organization[];
  clientOrganizations: Organization[];
  loading: boolean;
  switchOrganization: (organizationId: string) => Promise<void>;
  switchClient: (clientId: string | null) => void;
  isServiceProvider: () => boolean;
  getEffectiveOrganizationId: () => string | null;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
}

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [currentClient, setCurrentClient] = useState<Organization | null>(null);
  const [userOrganizations, setUserOrganizations] = useState<Organization[]>([]);
  const [clientOrganizations, setClientOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  
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
  
  async function loadOrganizationData() {
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
  }
  
  async function loadClientOrganizations(serviceProviderId: string) {
    try {
      const { data: clients, error: clientsError } = await supabase
        .from("organization_relationships")
        .select(`
          client:client_id (
            id,
            name,
            organization_type,
            logo_url,
            contact_email,
            settings
          )
        `)
        .eq("service_provider_id", serviceProviderId)
        .eq("is_active", true);
        
      if (clientsError) {
        throw clientsError;
      }
      
      const clientOrgs = clients?.map(c => c.client) || [];
      setClientOrganizations(clientOrgs);
      
      // Check for stored client selection
      const storedClientId = localStorage.getItem("currentClientId");
      if (storedClientId) {
        const client = clientOrgs.find(c => c.id === storedClientId);
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
  }
  
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
    // null means "All Clients"
    if (clientId === null) {
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
  
  const value = {
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
  
  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}
