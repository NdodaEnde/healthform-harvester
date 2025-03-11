
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

// This hook enforces organization context throughout the application
export const useOrganizationEnforcer = () => {
  const navigate = useNavigate();
  const { 
    currentOrganization, 
    userOrganizations, 
    loading,
  } = useOrganization();

  useEffect(() => {
    const checkAuthAndOrg = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If not authenticated, redirect to auth page
      if (!session) {
        navigate("/auth");
        return;
      }
      
      // If authenticated but no organization context is available (after loading is complete)
      if (!loading && !currentOrganization && userOrganizations.length === 0) {
        // This means the user is authenticated but doesn't belong to any organization
        toast({
          title: "Organization Required",
          description: "You need to be part of an organization to access this application.",
          variant: "destructive",
        });
        
        // You might want to redirect to a specific page where users can request org access
        // For now, we'll just sign them out
        await supabase.auth.signOut();
        navigate("/auth");
      }
    };
    
    checkAuthAndOrg();
  }, [currentOrganization, userOrganizations, loading, navigate]);
  
  return { currentOrganization, loading };
};

// Public routes that don't require organization context
export const PUBLIC_ROUTES = ["/", "/auth", "/auth/accept-invite", "/auth/reset-password", "/auth/update-password"];

// Helper to check if a route is public
export const isPublicRoute = (pathname: string) => {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`));
};
