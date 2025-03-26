
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

// Helper to detect preview mode
const isInPreviewMode = () => {
  const url = window.location.href;
  return url.includes('/preview') || url.includes('preview=true');
};

// This hook enforces organization context throughout the application
export const useOrganizationEnforcer = () => {
  const navigate = useNavigate();
  const { 
    currentOrganization, 
    userOrganizations, 
    loading: orgLoading,
  } = useOrganization();
  
  const [authChecked, setAuthChecked] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  
  useEffect(() => {
    // Skip auth check in preview mode
    if (isInPreviewMode()) {
      setAuthLoading(false);
      setAuthChecked(true);
      return;
    }
    
    const checkAuthAndOrg = async () => {
      try {
        setAuthLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        // If not authenticated, redirect to auth page
        if (!session) {
          navigate("/auth");
          return;
        }
        
        // If authenticated but no organization context is available (after loading is complete)
        if (!orgLoading && !currentOrganization && userOrganizations.length === 0) {
          // This means the user is authenticated but doesn't belong to any organization
          // Redirect to first-time setup page instead of signing out
          navigate("/setup");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        // On error, we shouldn't redirect to prevent infinite loops
      } finally {
        setAuthLoading(false);
        setAuthChecked(true);
      }
    };
    
    // Only run the check once and if not already checked
    if (!authChecked) {
      checkAuthAndOrg();
    }
  }, [currentOrganization, userOrganizations, orgLoading, navigate, authChecked]);

  // In preview mode, return mock data
  if (isInPreviewMode()) {
    return { 
      currentOrganization: { 
        id: 'preview-org-id', 
        name: 'Preview Organization',
        type: 'service_provider',
        // Add other required props
      }, 
      loading: false 
    };
  }
  
  return { currentOrganization, loading: orgLoading || authLoading };
};

// Public routes that don't require organization context
export const PUBLIC_ROUTES = ["/", "/auth", "/auth/accept-invite", "/auth/reset-password", "/auth/update-password", "/setup"];

// Helper to check if a route is public
export const isPublicRoute = (pathname: string) => {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`));
};
