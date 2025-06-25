
import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useOrganizationEnforcer, isPublicRoute } from "@/utils/organizationContextEnforcer";
import LoadingFallback from "./LoadingFallback";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOrganization } from "@/contexts/OrganizationContext";

interface OrganizationProtectedRouteProps {
  children: ReactNode;
}

const OrganizationProtectedRoute = ({ children }: OrganizationProtectedRouteProps) => {
  const location = useLocation();
  const { currentOrganization, loading } = useOrganizationEnforcer();
  const { userOrganizations, initialLoadComplete } = useOrganization();
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check authentication status first
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log("OrganizationProtectedRoute: Checking authentication status");
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          console.log("OrganizationProtectedRoute: User is authenticated");
          setIsAuthenticated(true);
        } else {
          console.log("OrganizationProtectedRoute: No active session found");
          setIsAuthenticated(false);
          
          // If not on a public route, show notification
          if (!isPublicRoute(location.pathname)) {
            toast.error("Authentication required", {
              description: "Please sign in to access this page"
            });
          }
        }
      } catch (err) {
        console.error("OrganizationProtectedRoute: Error checking auth status:", err);
        setIsAuthenticated(false);
      } finally {
        setIsAuthenticating(false);
      }
    };
    
    checkAuthStatus();
  }, [location.pathname]);
  
  // Check for special URL paths that need handling
  useEffect(() => {
    // Check for auth tokens in URL hash (OAuth flows)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    
    // Check for invitation token in query params
    const queryParams = new URLSearchParams(window.location.search);
    const inviteToken = queryParams.get("token");
    
    // Keep loading state if processing authentication or invitation
    if (accessToken || 
        location.pathname.includes('/auth/callback') || 
        location.pathname.includes('/callback') ||
        (inviteToken && location.pathname.includes('/accept-invite'))) {
      console.log("OrganizationProtectedRoute: Processing authentication flow, staying in loading state");
      setIsAuthenticating(true);
    }
  }, [location]);
  
  // Don't enforce organization context on public routes
  if (isPublicRoute(location.pathname)) {
    console.log("OrganizationProtectedRoute: On public route:", location.pathname);
    return <>{children}</>;
  }
  
  // If still checking authentication, show loading indicator
  if (isAuthenticating) {
    console.log("OrganizationProtectedRoute: Still authenticating, showing loading");
    return <LoadingFallback />;
  }
  
  // If not authenticated and not on a public route, redirect to auth
  if (!isAuthenticated) {
    console.log("OrganizationProtectedRoute: Not authenticated, redirecting to auth");
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  // CRITICAL: Wait for organization data to be fully loaded before making any decisions
  if (!initialLoadComplete || loading) {
    console.log("OrganizationProtectedRoute: Organization data still loading, showing loading fallback", {
      initialLoadComplete,
      loading,
      userOrganizations: userOrganizations.length
    });
    return <LoadingFallback />;
  }
  
  // Now we can safely make routing decisions based on complete data
  console.log("OrganizationProtectedRoute: Organization data loaded, making routing decisions", {
    currentOrganization: currentOrganization?.name || "None",
    userOrganizationsCount: userOrganizations.length,
    currentPath: location.pathname
  });
  
  // Special handling for setup page - only allow when user has no organizations
  if (location.pathname === "/setup") {
    if (userOrganizations.length === 0) {
      console.log("OrganizationProtectedRoute: On setup page with no organizations, allowing access");
      return <>{children}</>;
    } else {
      console.log("OrganizationProtectedRoute: User has organizations but is on setup page, redirecting to dashboard");
      return <Navigate to="/dashboard" state={{ from: location }} replace />;
    }
  }
  
  // For all other protected routes, enforce organization context
  if (userOrganizations.length === 0) {
    console.log("OrganizationProtectedRoute: No organizations found, redirecting to setup");
    return <Navigate to="/setup" state={{ from: location }} replace />;
  }
  
  if (!currentOrganization) {
    console.log("OrganizationProtectedRoute: No current organization selected, showing loading while enforcer handles selection");
    return <LoadingFallback />;
  }
  
  // User is authenticated and has organization context
  console.log("OrganizationProtectedRoute: All checks passed, rendering protected content");
  return <>{children}</>;
};

export default OrganizationProtectedRoute;
