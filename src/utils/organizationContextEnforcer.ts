import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/contexts/AuthContext";

export const useOrganizationEnforcer = () => {
  const navigate = useNavigate();
  const { currentOrganization, userOrganizations, loading: orgLoading } = useOrganization();
  const { session, loading: authLoading } = useAuth();
  
  const inPreviewMode = window.location.href.includes('/preview') || 
                       window.location.href.includes('preview=true');

  useEffect(() => {
    if (inPreviewMode || authLoading || orgLoading) {
      return;
    }

    if (!session) {
      console.log("No session found, redirecting to auth page");
      navigate("/auth");
      return;
    }

    if (!currentOrganization && userOrganizations.length === 0 && !loading) {
      console.log("User has no organizations, redirecting to setup page");
      navigate("/setup");
    }
  }, [currentOrganization, userOrganizations, loading, session, navigate, inPreviewMode]);

  if (inPreviewMode) {
    return {
      currentOrganization: { id: 'preview-org', name: 'Preview Organization' },
      loading: false
    };
  }

  return { currentOrganization, loading: orgLoading || authLoading };
};

// Public routes that don't require organization context
export const PUBLIC_ROUTES = [
  "/", 
  "/auth", 
  "/reset-password", 
  "/update-password", 
  "/accept-invite", 
  "/setup"
];

// Helper to check if a route is public
export const isPublicRoute = (pathname: string) => {
  return PUBLIC_ROUTES.some(route => 
    pathname === route || 
    pathname.startsWith(`${route}/`)
  );
};
