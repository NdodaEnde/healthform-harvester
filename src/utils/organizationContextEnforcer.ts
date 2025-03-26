
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      console.log("Preview mode detected in organizationContextEnforcer");
      setAuthLoading(false);
      setAuthChecked(true);
      return;
    }
    
    const checkAuthAndOrg = async () => {
      try {
        console.log("Checking auth and organization status");
        setAuthLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        // If not authenticated, redirect to auth page
        if (!session) {
          console.log("No active session found, redirecting to auth");
          navigate("/auth");
          return;
        }
        
        // If authenticated but no organization context is available (after loading is complete)
        if (!orgLoading && !currentOrganization && userOrganizations.length === 0) {
          // This means the user is authenticated but doesn't belong to any organization
          // Redirect to first-time setup page instead of signing out
          console.log("User has no organizations, redirecting to setup");
          navigate("/setup");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        toast.error("Authentication error", {
          description: "There was a problem verifying your account. Please try signing in again."
        });
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
        organization_type: 'service_provider',
        userRole: 'admin',
        // Add other required props
      }, 
      loading: false 
    };
  }
  
  return { currentOrganization, loading: orgLoading || authLoading };
};

// Public routes that don't require organization context
export const PUBLIC_ROUTES = [
  "/", 
  "/auth", 
  "/auth/accept-invite", 
  "/auth/reset-password", 
  "/auth/update-password",
  "/reset-password", 
  "/update-password", 
  "/accept-invite", 
  "/setup"
];

// Helper to check if a route is public
export const isPublicRoute = (pathname: string) => {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`));
};
